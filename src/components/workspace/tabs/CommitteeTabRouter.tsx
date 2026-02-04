import { lazy, Suspense } from 'react';
import { Workspace } from '@/types';
import { WorkspaceTab } from '@/types/workspace-tabs';
import { Skeleton } from '@/components/ui/skeleton';

// Tab loading skeleton
function TabSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

// Lazy load committee tabs
const AssignShiftsTab = lazy(() => import('../committee-tabs').then(m => ({ default: m.AssignShiftsTab })));
const SendBriefTab = lazy(() => import('../committee-tabs').then(m => ({ default: m.SendBriefTab })));
const CheckInVolunteerTab = lazy(() => import('../committee-tabs').then(m => ({ default: m.CheckInVolunteerTab })));
const CreateTeamTab = lazy(() => import('../committee-tabs').then(m => ({ default: m.CreateTeamTab })));
const TrainingStatusTab = lazy(() => import('../committee-tabs').then(m => ({ default: m.TrainingStatusTab })));
const PerformanceReviewTab = lazy(() => import('../committee-tabs').then(m => ({ default: m.PerformanceReviewTab })));

// IT Committee tabs
const CheckSystemsTab = lazy(() => import('../committee-tabs').then(m => ({ default: m.CheckSystemsTab })));
const UpdateCredentialsTab = lazy(() => import('../committee-tabs').then(m => ({ default: m.UpdateCredentialsTab })));
const ServiceStatusTab = lazy(() => import('../committee-tabs').then(m => ({ default: m.ServiceStatusTab })));
const TicketQueueTab = lazy(() => import('../committee-tabs').then(m => ({ default: m.TicketQueueTab })));

// Technical Committee tabs
const TestEquipmentTab = lazy(() => import('../committee-tabs').then(m => ({ default: m.TestEquipmentTab })));
const UpdateRunsheetTab = lazy(() => import('../committee-tabs').then(m => ({ default: m.UpdateRunsheetTab })));
const TechCheckTab = lazy(() => import('../committee-tabs').then(m => ({ default: m.TechCheckTab })));
const IssueReportTab = lazy(() => import('../committee-tabs').then(m => ({ default: m.IssueReportTab })));
const TechIncidentLogTab = lazy(() => import('../committee-tabs').then(m => ({ default: m.TechIncidentLogTab })));
const EquipmentCheckoutTab = lazy(() => import('../committee-tabs').then(m => ({ default: m.EquipmentCheckoutTab })));
const PowerDistributionTab = lazy(() => import('../committee-tabs').then(m => ({ default: m.PowerDistributionTab })));
const ContingencyChecklistTab = lazy(() => import('../committee-tabs').then(m => ({ default: m.ContingencyChecklistTab })));

// Registration Committee tabs
const ScanCheckInTab = lazy(() => import('../committee-tabs').then(m => ({ default: m.ScanCheckInTab })));
const AddAttendeeTab = lazy(() => import('../committee-tabs').then(m => ({ default: m.AddAttendeeTab })));
const ExportListTab = lazy(() => import('../committee-tabs').then(m => ({ default: m.ExportListTab })));
const SendRemindersTab = lazy(() => import('../committee-tabs').then(m => ({ default: m.SendRemindersTab })));
const ViewWaitlistTab = lazy(() => import('../committee-tabs').then(m => ({ default: m.ViewWaitlistTab })));
const IDCardsTab = lazy(() => import('../committee-tabs').then(m => ({ default: m.IDCardsTab })));
const CertificatesTab = lazy(() => import('../committee-tabs').then(m => ({ default: m.CertificatesTab })));

// Finance Committee tabs
const RecordExpenseTab = lazy(() => import('../committee-tabs').then(m => ({ default: m.RecordExpenseTab })));
const GenerateReportTab = lazy(() => import('../committee-tabs').then(m => ({ default: m.GenerateReportTab })));
const ApproveRequestTab = lazy(() => import('../committee-tabs').then(m => ({ default: m.ApproveRequestTab })));
const ViewBudgetTab = lazy(() => import('../committee-tabs').then(m => ({ default: m.ViewBudgetTab })));
const ExportDataTab = lazy(() => import('../committee-tabs').then(m => ({ default: m.ExportDataTab })));

// Media Committee tabs
const MediaUploadTab = lazy(() => import('../committee/media').then(m => ({ default: m.UploadMediaTab })));
const CreateShotListTab = lazy(() => import('../committee/media').then(m => ({ default: m.CreateShotListTab })));
const GalleryReviewTab = lazy(() => import('../committee/media').then(m => ({ default: m.GalleryReviewTab })));
const ExportAssetsTab = lazy(() => import('../committee/media').then(m => ({ default: m.ExportAssetsTab })));

// Judge Committee tabs
const AssignJudgesCommitteeTab = lazy(() => import('../committee/judge').then(m => ({ default: m.AssignJudgesCommitteeTab })));
const JudgeSetupRubricsTab = lazy(() => import('../committee/judge').then(m => ({ default: m.SetupRubricsTab })));
const JudgeViewScoresTab = lazy(() => import('../committee/judge').then(m => ({ default: m.ViewScoresTab })));
const JudgeExportResultsTab = lazy(() => import('../committee/judge').then(m => ({ default: m.ExportResultsTab })));
const JudgeScoringPortalTab = lazy(() => import('../committee/judge').then(m => ({ default: m.JudgeScoringPortalTab })));

// Speaker Liaison Committee tabs
const SpeakerRosterTab = lazy(() => import('../committee/speaker-liaison/tabs').then(m => ({ default: m.SpeakerRosterTab })));
const SpeakerSessionScheduleTab = lazy(() => import('../committee/speaker-liaison/tabs').then(m => ({ default: m.SessionScheduleTab })));
const MaterialsCollectionTab = lazy(() => import('../committee/speaker-liaison/tabs').then(m => ({ default: m.MaterialsCollectionTab })));
const TravelCoordinationTab = lazy(() => import('../committee/speaker-liaison/tabs').then(m => ({ default: m.TravelCoordinationTab })));
const CommunicationLogTab = lazy(() => import('../committee/speaker-liaison/tabs').then(m => ({ default: m.CommunicationLogTab })));

// Content Committee tabs
const ReviewContentTab = lazy(() => import('../committee/content/tabs').then(m => ({ default: m.ReviewContentTab })));
const CreateTemplateTab = lazy(() => import('../committee/content/tabs').then(m => ({ default: m.CreateTemplateTab })));
const AssignReviewerTab = lazy(() => import('../committee/content/tabs').then(m => ({ default: m.AssignReviewerTab })));
const PublishContentTab = lazy(() => import('../committee/content/tabs').then(m => ({ default: m.PublishContentTab })));
const ContentCalendarTab = lazy(() => import('../committee/content/tabs').then(m => ({ default: m.ContentCalendarTab })));
const ContentPipelineTab = lazy(() => import('../committee/content/tabs').then(m => ({ default: m.ContentPipelineTab })));

// Social Media Committee tabs
const ScheduleContentSocialTab = lazy(() => import('../committee/social-media/tabs').then(m => ({ default: m.ScheduleContentSocialTab })));
const MonitorHashtagsSocialTab = lazy(() => import('../committee/social-media/tabs').then(m => ({ default: m.MonitorHashtagsSocialTab })));
const EngagementReportSocialTab = lazy(() => import('../committee/social-media/tabs').then(m => ({ default: m.EngagementReportSocialTab })));
const PostNowSocialTab = lazy(() => import('../committee/social-media/tabs').then(m => ({ default: m.PostNowSocialTab })));
const ManagePlatformsSocialTab = lazy(() => import('../committee/social-media/tabs').then(m => ({ default: m.ManagePlatformsSocialTab })));
const ContentLibrarySocialTab = lazy(() => import('../committee/social-media/tabs').then(m => ({ default: m.ContentLibrarySocialTab })));

// Communication Committee tabs
const CommSendAnnouncementTab = lazy(() => import('../committee/communication/tabs').then(m => ({ default: m.SendAnnouncementTab })));
const CommCreateEmailTab = lazy(() => import('../committee/communication/tabs').then(m => ({ default: m.CreateEmailTab })));
const CommDraftPressReleaseTab = lazy(() => import('../committee/communication/tabs').then(m => ({ default: m.DraftPressReleaseTab })));
const CommBroadcastMessageTab = lazy(() => import('../committee/communication/tabs').then(m => ({ default: m.BroadcastMessageTab })));
const CommScheduleUpdateTab = lazy(() => import('../committee/communication/tabs').then(m => ({ default: m.ScheduleUpdateTab })));
const CommContactStakeholdersTab = lazy(() => import('../committee/communication/tabs').then(m => ({ default: m.ContactStakeholdersTab })));

// Marketing Committee tabs
const SchedulePostMarketingTab = lazy(() => import('../committee/marketing/tabs').then(m => ({ default: m.SchedulePostMarketingTab })));
const ViewAnalyticsMarketingTab = lazy(() => import('../committee/marketing/tabs').then(m => ({ default: m.ViewAnalyticsMarketingTab })));
const CreateCampaignMarketingTab = lazy(() => import('../committee/marketing/tabs').then(m => ({ default: m.CreateCampaignMarketingTab })));
const ABTestingMarketingTab = lazy(() => import('../committee/marketing/tabs').then(m => ({ default: m.ABTestingMarketingTab })));

// Facility Committee tabs
const SafetyCheckTab = lazy(() => import('../committee/facility/tabs').then(m => ({ default: m.SafetyCheckTab })));
const VenueWalkthroughTab = lazy(() => import('../committee/facility/tabs').then(m => ({ default: m.VenueWalkthroughTab })));
const ReportIssueTab = lazy(() => import('../committee/facility/tabs').then(m => ({ default: m.ReportIssueTab })));
const RoomStatusTab = lazy(() => import('../committee/facility/tabs').then(m => ({ default: m.RoomStatusTab })));

// Logistics Committee tabs
const TrackShipmentTab = lazy(() => import('../committee/logistics/tabs').then(m => ({ default: m.TrackShipmentTab })));
const AddEquipmentTab = lazy(() => import('../committee/logistics/tabs').then(m => ({ default: m.AddEquipmentTab })));
const ScheduleTransportTab = lazy(() => import('../committee/logistics/tabs').then(m => ({ default: m.ScheduleTransportTab })));
const AddVenueTab = lazy(() => import('../committee/logistics/tabs').then(m => ({ default: m.AddVenueTab })));
const CreateChecklistTab = lazy(() => import('../committee/logistics/tabs').then(m => ({ default: m.CreateChecklistTab })));
const LogisticsGenerateReportTab = lazy(() => import('../committee/logistics/tabs').then(m => ({ default: m.GenerateReportTab })));
const LogisticsReportIssueTab = lazy(() => import('../committee/logistics/tabs').then(m => ({ default: m.ReportIssueTab })));
const ViewTimelineTab = lazy(() => import('../committee/logistics/tabs').then(m => ({ default: m.ViewTimelineTab })));

// Catering Committee tabs
const CateringUpdateMenuTab = lazy(() => import('../committee/catering/tabs').then(m => ({ default: m.UpdateMenuTab })));
const CateringCheckInventoryTab = lazy(() => import('../committee/catering/tabs').then(m => ({ default: m.CheckInventoryTab })));
const CateringDietaryReportTab = lazy(() => import('../committee/catering/tabs').then(m => ({ default: m.DietaryReportTab })));
const CateringConfirmHeadcountTab = lazy(() => import('../committee/catering/tabs').then(m => ({ default: m.ConfirmHeadcountTab })));

// Event Committee tabs
const UpdateScheduleTab = lazy(() => import('../committee/event/tabs').then(m => ({ default: m.UpdateScheduleTab })));
const BriefTeamsTab = lazy(() => import('../committee/event/tabs').then(m => ({ default: m.BriefTeamsTab })));
const VIPTrackerTab = lazy(() => import('../committee/event/tabs').then(m => ({ default: m.VIPTrackerTab })));
const RunOfShowTab = lazy(() => import('../committee/event/tabs').then(m => ({ default: m.RunOfShowTab })));

// Map of committee tabs
const COMMITTEE_TAB_MAP: Record<string, (props: { workspace: Workspace }) => JSX.Element | null> = {
  'assign-shifts': ({ workspace }) => <AssignShiftsTab workspace={workspace} />,
  'send-brief': ({ workspace }) => <SendBriefTab workspace={workspace} />,
  'check-in': ({ workspace }) => <CheckInVolunteerTab workspace={workspace} />,
  'create-team': ({ workspace }) => <CreateTeamTab workspace={workspace} />,
  'training-status': ({ workspace }) => <TrainingStatusTab workspace={workspace} />,
  'performance-review': ({ workspace }) => <PerformanceReviewTab workspace={workspace} />,
  
  // IT Committee
  'check-systems': ({ workspace }) => <CheckSystemsTab workspaceId={workspace.id} />,
  'update-credentials': ({ workspace }) => <UpdateCredentialsTab workspaceId={workspace.id} />,
  'service-status': ({ workspace }) => <ServiceStatusTab workspaceId={workspace.id} />,
  'ticket-queue': ({ workspace }) => <TicketQueueTab workspaceId={workspace.id} />,
  
  // Technical Committee
  'test-equipment': ({ workspace }) => <TestEquipmentTab workspaceId={workspace.id} />,
  'update-runsheet': ({ workspace }) => <UpdateRunsheetTab workspaceId={workspace.id} />,
  'tech-check': ({ workspace }) => <TechCheckTab workspaceId={workspace.id} />,
  'issue-report': ({ workspace }) => <IssueReportTab workspaceId={workspace.id} />,
  'incident-log': ({ workspace }) => <TechIncidentLogTab workspaceId={workspace.id} />,
  'equipment-checkout': ({ workspace }) => <EquipmentCheckoutTab workspaceId={workspace.id} eventId={workspace.eventId} />,
  'power-distribution': ({ workspace }) => <PowerDistributionTab workspaceId={workspace.id} />,
  'contingency': ({ workspace }) => <ContingencyChecklistTab workspaceId={workspace.id} />,
  
  // Registration Committee
  'scan-checkin': ({ workspace }) => <ScanCheckInTab workspace={workspace} />,
  'add-attendee': ({ workspace }) => <AddAttendeeTab workspace={workspace} />,
  'export-list': ({ workspace }) => <ExportListTab workspace={workspace} />,
  'send-reminders': ({ workspace }) => <SendRemindersTab workspace={workspace} />,
  'view-waitlist': ({ workspace }) => <ViewWaitlistTab workspace={workspace} />,
  'id-cards': ({ workspace }) => <IDCardsTab workspace={workspace} />,
  'certificates': ({ workspace }) => <CertificatesTab workspace={workspace} />,
  
  // Finance Committee
  'record-expense': ({ workspace }) => <RecordExpenseTab workspace={workspace} />,
  'generate-report': ({ workspace }) => <GenerateReportTab workspace={workspace} />,
  'approve-request': ({ workspace }) => <ApproveRequestTab workspace={workspace} />,
  'view-budget': ({ workspace }) => <ViewBudgetTab workspace={workspace} />,
  'export-data': ({ workspace }) => <ExportDataTab workspace={workspace} />,
  
  // Media Committee
  'upload-media-committee': ({ workspace }) => <MediaUploadTab workspaceId={workspace.id} />,
  'create-shot-list': ({ workspace }) => <CreateShotListTab workspaceId={workspace.id} />,
  'gallery-review': ({ workspace }) => <GalleryReviewTab workspaceId={workspace.id} />,
  'export-assets': ({ workspace }) => <ExportAssetsTab workspaceId={workspace.id} />,
  
  // Judge Committee
  'assign-judges-committee': ({ workspace }) => <AssignJudgesCommitteeTab workspaceId={workspace.id} />,
  'setup-rubrics-committee': ({ workspace }) => <JudgeSetupRubricsTab workspaceId={workspace.id} />,
  'view-scores-committee': ({ workspace }) => <JudgeViewScoresTab workspaceId={workspace.id} />,
  'export-results-committee': ({ workspace }) => <JudgeExportResultsTab workspaceId={workspace.id} />,
  'judge-scoring-portal': ({ workspace }) => <JudgeScoringPortalTab workspaceId={workspace.id} />,
  
  // Speaker Liaison Committee
  'speaker-roster-committee': ({ workspace }) => <SpeakerRosterTab workspaceId={workspace.id} />,
  'materials-collection-committee': ({ workspace }) => <MaterialsCollectionTab workspaceId={workspace.id} />,
  'session-schedule-committee': ({ workspace }) => <SpeakerSessionScheduleTab workspaceId={workspace.id} />,
  'travel-coordination-committee': ({ workspace }) => <TravelCoordinationTab workspaceId={workspace.id} />,
  'communication-log-committee': ({ workspace }) => <CommunicationLogTab workspaceId={workspace.id} />,
  
  // Content Committee
  'review-content-committee': ({ workspace }) => <ReviewContentTab workspaceId={workspace.id} />,
  'create-template-committee': ({ workspace }) => <CreateTemplateTab workspaceId={workspace.id} />,
  'assign-reviewer-committee': ({ workspace }) => <AssignReviewerTab workspaceId={workspace.id} />,
  'publish-content-committee': ({ workspace }) => <PublishContentTab workspaceId={workspace.id} />,
  'content-calendar-committee': ({ workspace }) => <ContentCalendarTab workspaceId={workspace.id} />,
  'content-pipeline-committee': ({ workspace }) => <ContentPipelineTab workspaceId={workspace.id} />,
  
  // Social Media Committee
  'schedule-content-social': ({ workspace }) => <ScheduleContentSocialTab workspaceId={workspace.id} />,
  'monitor-hashtags-social': ({ workspace }) => <MonitorHashtagsSocialTab workspaceId={workspace.id} />,
  'engagement-report-social': ({ workspace }) => <EngagementReportSocialTab workspaceId={workspace.id} />,
  'post-now-social': ({ workspace }) => <PostNowSocialTab workspaceId={workspace.id} />,
  'manage-platforms-social': ({ workspace }) => <ManagePlatformsSocialTab workspaceId={workspace.id} />,
  'content-library-social': ({ workspace }) => <ContentLibrarySocialTab workspaceId={workspace.id} />,
  
  // Communication Committee
  'send-announcement-communication': ({ workspace }) => <CommSendAnnouncementTab workspaceId={workspace.id} />,
  'create-email-communication': ({ workspace }) => <CommCreateEmailTab workspaceId={workspace.id} />,
  'draft-press-release-communication': ({ workspace }) => <CommDraftPressReleaseTab workspaceId={workspace.id} />,
  'broadcast-message-communication': ({ workspace }) => <CommBroadcastMessageTab workspaceId={workspace.id} />,
  'schedule-update-communication': ({ workspace }) => <CommScheduleUpdateTab workspaceId={workspace.id} />,
  'contact-stakeholders-communication': ({ workspace }) => <CommContactStakeholdersTab workspaceId={workspace.id} />,
  
  // Marketing Committee
  'schedule-post-marketing': ({ workspace }) => <SchedulePostMarketingTab workspaceId={workspace.id} />,
  'view-analytics-marketing': ({ workspace }) => <ViewAnalyticsMarketingTab workspaceId={workspace.id} />,
  'create-campaign-marketing': ({ workspace }) => <CreateCampaignMarketingTab workspaceId={workspace.id} />,
  'ab-test-marketing': ({ workspace }) => <ABTestingMarketingTab workspaceId={workspace.id} />,
  
  // Facility Committee
  'safety-check-facility': ({ workspace }) => <SafetyCheckTab workspaceId={workspace.id} />,
  'venue-walkthrough-facility': ({ workspace }) => <VenueWalkthroughTab workspaceId={workspace.id} />,
  'report-issue-facility': ({ workspace }) => <ReportIssueTab workspaceId={workspace.id} />,
  'room-status-facility': ({ workspace }) => <RoomStatusTab workspaceId={workspace.id} />,
  
  // Logistics Committee
  'track-shipment-logistics': ({ workspace }) => <TrackShipmentTab workspaceId={workspace.id} />,
  'add-equipment-logistics': ({ workspace }) => <AddEquipmentTab workspaceId={workspace.id} />,
  'schedule-transport-logistics': ({ workspace }) => <ScheduleTransportTab workspaceId={workspace.id} />,
  'add-venue-logistics': ({ workspace }) => <AddVenueTab workspaceId={workspace.id} />,
  'create-checklist-logistics': ({ workspace }) => <CreateChecklistTab workspaceId={workspace.id} />,
  'generate-report-logistics': ({ workspace }) => <LogisticsGenerateReportTab workspaceId={workspace.id} />,
  'report-issue-logistics': ({ workspace }) => <LogisticsReportIssueTab workspaceId={workspace.id} />,
  'view-timeline-logistics': ({ workspace }) => <ViewTimelineTab workspaceId={workspace.id} />,
  
  // Catering Committee
  'update-menu-catering': ({ workspace }) => <CateringUpdateMenuTab workspaceId={workspace.id} />,
  'check-inventory-catering': ({ workspace }) => <CateringCheckInventoryTab workspaceId={workspace.id} />,
  'dietary-report-catering': ({ workspace }) => <CateringDietaryReportTab workspaceId={workspace.id} />,
  'confirm-headcount-catering': ({ workspace }) => <CateringConfirmHeadcountTab workspaceId={workspace.id} />,
  
  // Event Committee
  'update-schedule-event': ({ workspace }) => <UpdateScheduleTab workspaceId={workspace.id} />,
  'brief-teams-event': ({ workspace }) => <BriefTeamsTab workspaceId={workspace.id} />,
  'vip-tracker-event': ({ workspace }) => <VIPTrackerTab workspaceId={workspace.id} />,
  'run-of-show-event': ({ workspace }) => <RunOfShowTab workspaceId={workspace.id} />,
};

interface CommitteeTabRouterProps {
  workspace: Workspace;
  activeTab: WorkspaceTab;
}

export function CommitteeTabRouter({ workspace, activeTab }: CommitteeTabRouterProps) {
  const TabComponent = COMMITTEE_TAB_MAP[activeTab];
  
  if (!TabComponent) {
    return null;
  }

  return (
    <Suspense fallback={<TabSkeleton />}>
      {TabComponent({ workspace })}
    </Suspense>
  );
}
