import { addGraphQLSchema, addGraphQLResolvers, addGraphQLQuery, addGraphQLMutation } from '../../lib/vulcan-lib/graphql';
import fetch from 'node-fetch'
import { DatabaseServerSetting } from '../databaseSettings';

const ElicitUserType = `type ElicitUser {
  isQuestionCreator: Boolean
  displayName: String
  _id: String
  sourceUserId: String
}`

addGraphQLSchema(ElicitUserType);

const ElicitPredictionType = `type ElicitPrediction {
  _id: String
  prediction: Int
  createdAt: Date
  notes: String
  creator: ElicitUser
  sourceUrl: String
  sourceId: String
  binaryQuestionId: String
}`

addGraphQLSchema(ElicitPredictionType);

const ElicitBlockDataType = `type ElicitBlockData {
  _id: String
  title: String
  notes: String
  resolvesBy: Date
  resolution: Boolean
  predictions: [ElicitPrediction]
}`

addGraphQLSchema(ElicitBlockDataType);

const elicitAPIUrl = "https://ought-elicit-alpha.herokuapp.com/api/v1"
const elicitAPIKey = new DatabaseServerSetting('elicitAPIKey', null)
// const elicitSourceName = new DatabaseServerSetting('elicitSourceName', 'LessWrong')
const elicitSourceURL = new DatabaseServerSetting('elicitSourceURL', 'https://LessWrong.com')

async function getPredictionsFromElicit(questionId: string = "9caNKRnBs") {
  const response = await fetch(`${elicitAPIUrl}/binary-questions/${questionId}/binary-predictions?user_most_recent=true&expand=creator&prediction.fields=createdAt,notes,id,sourceUrl,sourceId,binaryQuestionId&creator.fields=sourceUserId`, {
    method: 'GET',
    redirect: 'follow'
  })
  const responseText = await response.text()
  if (!responseText) return null
  return JSON.parse(responseText)
}

async function getPredictionDataFromElicit(questionId: string = "9caNKRnBs") {
  const response = await fetch(`${elicitAPIUrl}/binary-questions/${questionId}?binaryQuestion.fields=notes,resolvesBy,resolution,title`, {
    method: 'GET',
    redirect: 'follow',
    headers: {
      'Authorization': `API_KEY ${elicitAPIKey.get()}`
    }
  })
  const responseText = await response.text()
  if (!responseText) return null
  return JSON.parse(responseText)
}

async function sendElicitPrediction(questionId: string, prediction: number, user: DbUser) {
  const response = await fetch(`${elicitAPIUrl}/binary-questions/${questionId}/binary-predictions`, {
    method: 'POST',
    body: JSON.stringify({
      prediction,
      sourceUserId: user._id,
      sourceUserDisplayName: user.displayName,
      sourceUrl: elicitSourceURL.get()
    }),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `API_KEY ${elicitAPIKey.get()}`
    }
  })
  const responseText = await response.text()
  if (!responseText) throw Error ("Something went wrong with sending an Elicit Prediction")
  return JSON.parse(responseText)
}

async function getElicitQuestionWithPredictions(questionId: string) {
  const elicitData: any = await getPredictionDataFromElicit(questionId)
  const predictions: any = await getPredictionsFromElicit(questionId)
  
  const { title, notes, resolvesBy, resolution } = elicitData
  const processedPredictions = predictions.map(({
    id,
    prediction,
    createdAt,
    notes,
    creator,
    sourceUrl,
    sourceId,
    binaryQuestionId
  }) => ({
    _id: id || creator.id,
    prediction,
    createdAt: new Date(createdAt),
    notes,
    creator: {
      ...creator,
      _id: creator.id
    },
    sourceUrl,
    sourceId,
    binaryQuestionId
  }))
  return {
    _id: questionId,
    title,
    notes,
    resolution,
    resolvesBy: new Date(resolvesBy),
    predictions: processedPredictions
  }
}

if (elicitAPIKey.get()) {
  const elicitPredictionResolver = {
    Query: {
      async ElicitBlockData(root, { questionId }, context: ResolverContext) {
        return await getElicitQuestionWithPredictions(questionId)
      }
    },
    Mutation: {
      async MakeElicitPrediction(root, { questionId, prediction }, { currentUser }: ResolverContext) {
        if (!currentUser) throw Error("Can only make elicit prediction when logged in")
        const responseData: any = await sendElicitPrediction(questionId, prediction, currentUser)
        if (!responseData?.binaryQuestionId) throw Error("Error in sending prediction to Elicit")
        const newData = await getElicitQuestionWithPredictions(questionId)
        return newData
      }
    }
  };
  
  addGraphQLResolvers(elicitPredictionResolver);
  addGraphQLQuery('ElicitBlockData(questionId: String): ElicitBlockData');
  addGraphQLMutation('MakeElicitPrediction(questionId: String, prediction: Int): ElicitBlockData');
}

