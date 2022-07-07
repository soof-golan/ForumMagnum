import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment SequencesPageTitleFragment on Sequence {
    _id
    title
    canonicalCollection {
      title
    }
  }
`);

registerFragment(`
  fragment SequencesPageFragment on Sequence {
    ...SequencesPageTitleFragment
    createdAt
    userId
    user {
      ...UsersMinimumInfo
    }
    contents {
      ...RevisionDisplay
    }
    gridImageId
    bannerImageId
    canonicalCollectionSlug
    draft
    isDeleted
    hidden
    hideFromAuthorPage
    curatedOrder
    userProfileOrder
    af
  }
`);

registerFragment(`
  fragment SequencesPageWithChaptersFragment on Sequence {
    ...SequencesPageFragment
    chapters {
      ...ChaptersFragment
    }
  }
`)

registerFragment(`
  fragment SequencesEdit on Sequence {
    ...SequencesPageFragment
    contents { 
      ...RevisionEdit
    }
  }
`)
