import { registerComponent, Components } from '../../lib/vulcan-lib';
import React, { useState } from 'react';
import withErrorBoundary from '../common/withErrorBoundary';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import {useCurrentUser} from "../common/withUser"
import { useContinueReading } from '../recommendations/withContinueReading';
import Tooltip from "@material-ui/core/Tooltip";
import {QueryLink} from "../../lib/reactRouterWrapper";
import {DEFAULT_LOW_KARMA_THRESHOLD, MAX_LOW_KARMA_THRESHOLD} from "../../lib/collections/posts/views";
import Checkbox from "@material-ui/core/Checkbox";
import {useLocation} from "../../lib/routeUtil";

const styles = (theme: ThemeType): JssStyles => ({
  checkbox: {
    padding: "1px 12px 0 0"
  },
  checkboxGroup: {
    display: "flex",
    alignItems: "center",
    [theme.breakpoints.down('xs')]: {
      marginBottom: theme.spacing.unit*2,
      flex: `1 0 100%`,
      order: 0
    }
  },
})

const DraftsPage = ({classes}) => {
  const {SingleColumnSection, SectionTitle, DraftsList } = Components
  
  const currentUser = useCurrentUser()
  const { query } = useLocation();
  const [showArchived, setShowArchived] = useState(false)
  
  if (!currentUser) return <span>You must sign in to view your drafts.</span>
  
  const currentIncludeDraftEvents = (query.includeDraftEvents === 'true')
  const currentIncludeArchived = (query.includeArchived === 'true')
  
  const draftTerms: PostsViewTerms = {view: "drafts", ...query, userId: currentUser._id, limit: 50, sortDrafts: currentUser?.sortDrafts || "modifiedAt" }
  draftTerms.includeArchived = currentIncludeArchived
  draftTerms.includeDraftEvents = currentIncludeDraftEvents
  
  return <SingleColumnSection>
    <AnalyticsContext listContext={"draftsPage"}>
      <DraftsList terms={draftTerms} title={"Drafts & Unpublished Posts"} showAllDraftsLink={false}/>
    </AnalyticsContext>
  </SingleColumnSection>
}


const DraftsPageComponent = registerComponent('DraftsPage', DraftsPage, {
  hocs: [withErrorBoundary], styles
});

declare global {
  interface ComponentTypes {
    DraftsPage: typeof DraftsPageComponent
  }
}