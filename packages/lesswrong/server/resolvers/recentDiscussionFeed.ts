import { addGraphQLResolvers, addGraphQLQuery, addGraphQLSchema } from '../../lib/vulcan-lib/graphql';
import { accessFilterSingle, accessFilterMultiple } from '../../lib/utils/schemaUtils';
import { mergeFeedQueries, feedSubquery, defineFeedResolver, viewBasedSubquery } from '../utils/feedUtil';
import { Posts } from '../../lib/collections/posts/collection';
import { Comments } from '../../lib/collections/comments/collection';
import { Tags } from '../../lib/collections/tags/collection';
import { Revisions } from '../../lib/collections/revisions/collection';

defineFeedResolver<Date>({
  name: "RecentDiscussionFeed",
  args: "af: Boolean",
  cutoffTypeGraphQL: "Date",
  resultTypesGraphQL: `
    postCommented: Post
    tagDiscussed: Tag
    tagRevised: Revision
  `,
  resolver: async ({limit=20, cutoff, args, context}: {
    limit?: number, cutoff?: Date,
    args: {af: boolean},
    context: ResolverContext
  }) => {
    type SortKeyType = Date;
    const {af} = args;
    const {currentUser} = context;
    
    const result = await mergeFeedQueries<SortKeyType>({
      limit, cutoff,
      subqueries: [
        // Post commented
        viewBasedSubquery({
          type: "postCommented",
          collection: Posts,
          sortField: "lastCommentedAt",
          context,
          selector: {
            baseScore: {$gt:0},
            hideFrontpageComments: false,
            hiddenRelatedQuestion: undefined,
            shortform: undefined,
            groupId: undefined,
            ...(af ? {af: true} : undefined),
          },
        }),
        // Tags with discussion comments
        viewBasedSubquery({
          type: "tagDiscussed",
          collection: Tags,
          sortField: "lastCommentedAt",
          context,
          selector: {
            lastCommentedAt: {$exists: true},
            ...(af ? {af: true} : undefined),
          },
        }),
        // Large revision to tag
        viewBasedSubquery({
          type: "tagRevised",
          collection: Revisions,
          sortField: "editedAt",
          context,
          selector: {
            collectionName: "Tags",
            fieldName: "description",
            "changeMetrics.added": {$gt: 100},
          },
        }),
      ],
    });
    return result;
  }
});