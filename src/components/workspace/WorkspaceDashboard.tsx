import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { WorkspaceStatus, WorkspaceRole, WorkspaceType } from '../../types';
import { WorkspaceLayout } from './WorkspaceLayout';
import { TeamManagement } from './TeamManagement';
import { WorkspaceCommunication } from './WorkspaceCommunication';
import { WorkspaceAnalyticsDashboard } from './WorkspaceAnalyticsDashboard';
import { WorkspaceReportExport } from './WorkspaceReportExport';
import { WorkspaceTemplateManagement } from './WorkspaceTemplateManagement';
import { EventMarketplaceIntegration } from '../marketplace';

import { TaskManagementInterface } from './TaskManagementInterface';
import { WorkspaceAuditLog } from './WorkspaceAuditLog';
import { WorkspaceRoleAssignment } from './WorkspaceRoleAssignment';
import { RoleBasedActions } from './RoleBasedActions';
import { WorkspaceRoleAnalytics } from './WorkspaceRoleAnalytics';
import { CreateSubWorkspaceModal } from './CreateSubWorkspaceModal';
import { DepartmentDashboard } from './department';
import { CommitteeDashboard } from './committee';
import { TeamDashboard } from './team';
import { RootDashboard } from './root';
import { WorkspaceSettingsContent } from './WorkspaceSettingsContent';
import { EventSettingsTabContent } from './event-settings';
import { ApprovalsTabContent } from './approvals';
import { ChecklistsTabContent } from './checklists';
// Committee tabs (L3)
import { 
  AssignShiftsTab, 
  SendBriefTab, 
  CheckInVolunteerTab, 
  CreateTeamTab, 
  TrainingStatusTab, 
  PerformanceReviewTab,
  // IT Committee tabs
  CheckSystemsTab,
  UpdateCredentialsTab,
  ServiceStatusTab,
  TicketQueueTab,
  // Technical Committee tabs
  TestEquipmentTab,
  UpdateRunsheetTab,
  TechCheckTab,
  IssueReportTab,
  // Registration Committee tabs
  ScanCheckInTab,
  AddAttendeeTab,
  ExportListTab,
  SendRemindersTab,
  ViewWaitlistTab,
  // Finance Committee tabs
  RecordExpenseTab,
  GenerateReportTab,
  ApproveRequestTab,
  ViewBudgetTab,
  ExportDataTab,
} from './committee-tabs';
// Volunteers Department tabs (L2)
import {
  ViewCommitteesTab,
  ShiftOverviewTab,
  MassAnnouncementTab,
  HoursReportTab,
  ApproveTimesheetsTab,
  TrainingScheduleTab,
  RecognitionTab,
  RecruitmentTab,
} from './department/volunteers/tabs';
// Tech Department tabs (L2)
import {
  SystemHealthCheckTab,
  NetworkStatusTab,
  SecurityAuditTab,
  EquipmentReportTab,
  BackupStatusTab,
  ReportIncidentTab,
  ConfigReviewTab,
  DocumentationTab,
} from './department/tech/tabs';
// Content Department tabs (L2)
import {
  CreateContentTab,
  AssignJudgesTab,
  EnterScoreTab,
  UploadMediaTab,
  AddSpeakerTab,
  ScheduleSessionTab,
  ViewRubricsTab,
} from './department/content/tabs';
// Growth Department tabs (L2)
import {
  LaunchCampaignTab,
  ScheduleContentTab,
  AddSponsorTab,
  SendAnnouncementTab,
  ViewAnalyticsTab,
  SetGoalsTab,
  ManagePartnersTab,
  PROutreachTab,
} from './department/growth/tabs';
// Media Committee tabs (L3)
import {
  UploadMediaTab as MediaUploadTab,
  CreateShotListTab,
  GalleryReviewTab,
  ExportAssetsTab,
} from './committee/media';
import {
  AssignJudgesCommitteeTab,
  SetupRubricsTab as JudgeSetupRubricsTab,
  ViewScoresTab as JudgeViewScoresTab,
  ExportResultsTab as JudgeExportResultsTab,
  JudgeScoringPortalTab,
} from './committee/judge';
// Speaker Liaison Committee tabs (L3)
import {
  SpeakerRosterTab,
  SessionScheduleTab as SpeakerSessionScheduleTab,
  MaterialsCollectionTab,
  TravelCoordinationTab,
  CommunicationLogTab,
} from './committee/speaker-liaison/tabs';
// Content Committee tabs (L3)
import {
  ReviewContentTab,
  CreateTemplateTab,
  AssignReviewerTab,
  PublishContentTab,
  ContentCalendarTab,
  ContentPipelineTab,
} from './committee/content/tabs';
// Social Media Committee tabs (L3)
import {
  ScheduleContentSocialTab,
  MonitorHashtagsSocialTab,
  EngagementReportSocialTab,
  PostNowSocialTab,
  ManagePlatformsSocialTab,
  ContentLibrarySocialTab,
} from './committee/social-media/tabs';
// Communication Committee tabs (L3)
import {
  SendAnnouncementTab as CommSendAnnouncementTab,
  CreateEmailTab as CommCreateEmailTab,
  DraftPressReleaseTab as CommDraftPressReleaseTab,
  BroadcastMessageTab as CommBroadcastMessageTab,
  ScheduleUpdateTab as CommScheduleUpdateTab,
  ContactStakeholdersTab as CommContactStakeholdersTab,
} from './committee/communication/tabs';
// Marketing Committee tabs (L3)
import {
  SchedulePostMarketingTab,
  ViewAnalyticsMarketingTab,
  CreateCampaignMarketingTab,
  ABTestingMarketingTab,
} from './committee/marketing/tabs';
// Operations Department tabs (L2)
import {
  EventBriefingTab,
  LogisticsStatusTab,
  CateringUpdateTab,
  FacilityCheckTab,
  MasterChecklistTab,
  IncidentReportTab,
  TeamRosterTab,
  OpsReportTab,
} from './department/operations/tabs';
// Facility Committee tabs (L3)
import {
  SafetyCheckTab,
  VenueWalkthroughTab,
  ReportIssueTab,
  RoomStatusTab,
} from './committee/facility/tabs';
// Logistics Committee tabs (L3)
import {
  TrackShipmentTab,
  AddEquipmentTab,
  ScheduleTransportTab,
  AddVenueTab,
  CreateChecklistTab,
  GenerateReportTab as LogisticsGenerateReportTab,
  ReportIssueTab as LogisticsReportIssueTab,
  ViewTimelineTab,
} from './committee/logistics/tabs';
// Catering Committee tabs (L3)
import {
  UpdateMenuTab as CateringUpdateMenuTab,
  CheckInventoryTab as CateringCheckInventoryTab,
  DietaryReportTab as CateringDietaryReportTab,
  ConfirmHeadcountTab as CateringConfirmHeadcountTab,
} from './committee/catering/tabs';
import { useWorkspaceShell } from '@/hooks/useWorkspaceShell';

interface WorkspaceDashboardProps {
  workspaceId?: string;
  orgSlug?: string;
}

export function WorkspaceDashboard({ workspaceId, orgSlug }: WorkspaceDashboardProps) {
  const { state, actions, permissions } = useWorkspaceShell({ workspaceId, orgSlug });
  const [searchParams] = useSearchParams();

  const {
    workspace,
    tasks,
    teamMembers,
    isLoading,
    isTasksLoading,
    error,
    activeTab,
    activeRoleSpace,
    showSubWorkspaceModal,
    taskIdFromUrl,
  } = state;

  // Section deep-linking: auto-scroll to section when sectionid param is present
  useEffect(() => {
    const sectionId = searchParams.get('sectionid');
    if (!sectionId || !workspace) return;

    // Small delay to ensure content is rendered
    const timer = setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchParams, workspace]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Workspace Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The workspace you're looking for doesn't exist or you don't have access to it.
          </p>
          <p className="text-xs text-muted-foreground mb-4">Status: {WorkspaceStatus.DISSOLVED}</p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <WorkspaceLayout
      workspace={workspace}
      activeTab={activeTab}
      onTabChange={actions.setActiveTab}
      orgSlug={orgSlug || ''}
      canCreateSubWorkspace={permissions.canCreateSubWorkspace}
      canInviteMembers={permissions.canInviteMembers}
      onCreateSubWorkspace={() => actions.setShowSubWorkspaceModal(true)}
      onInviteMember={actions.handleInviteTeamMember}
      onManageSettings={permissions.canManageSettings ? actions.handleManageSettings : undefined}
    >
      {/* Sub-Workspace Creation Modal */}
      {workspace?.eventId && (
        <CreateSubWorkspaceModal
          open={showSubWorkspaceModal}
          onOpenChange={actions.setShowSubWorkspaceModal}
          parentWorkspaceId={workspace.id}
          eventId={workspace.eventId}
        />
      )}

      <div className="w-full">
        {activeTab === 'overview' && (
          <>
            {/* Level-specific dashboards */}
            {workspace.workspaceType === WorkspaceType.ROOT ? (
              <RootDashboard 
                workspace={workspace} 
                orgSlug={orgSlug}
                userRole={permissions.currentMember?.role as WorkspaceRole}
                onDelegateRole={() => actions.setActiveTab('role-management')}
                onInviteMember={permissions.canInviteMembers ? actions.handleInviteTeamMember : undefined}
                onManageSettings={permissions.canManageSettings ? actions.handleManageSettings : undefined}
              />
            ) : workspace.workspaceType === WorkspaceType.DEPARTMENT ? (
              <DepartmentDashboard 
                workspace={workspace} 
                orgSlug={orgSlug}
                onViewTasks={actions.handleViewTasks}
              />
            ) : workspace.workspaceType === WorkspaceType.COMMITTEE ? (
              <CommitteeDashboard 
                workspace={workspace} 
                orgSlug={orgSlug}
                userRole={permissions.currentMember?.role as WorkspaceRole}
                onViewTasks={actions.handleViewTasks}
                onDelegateRole={() => actions.setActiveTab('role-management')}
                onInviteMember={permissions.canInviteMembers ? actions.handleInviteTeamMember : undefined}
                onRequestBudget={() => {}}
                onRequestResource={() => {}}
              />
            ) : workspace.workspaceType === WorkspaceType.TEAM ? (
              <TeamDashboard 
                workspace={workspace} 
                orgSlug={orgSlug}
                userRole={permissions.currentMember?.role as WorkspaceRole}
                onViewTasks={actions.handleViewTasks}
                onLogHours={() => {}}
                onSubmitForApproval={() => {}}
              />
            ) : (
              /* Fallback for legacy workspaces without workspace_type */
              <RootDashboard 
                workspace={workspace} 
                orgSlug={orgSlug}
                userRole={permissions.currentMember?.role as WorkspaceRole}
                onDelegateRole={() => actions.setActiveTab('role-management')}
                onInviteMember={permissions.canInviteMembers ? actions.handleInviteTeamMember : undefined}
                onManageSettings={permissions.canManageSettings ? actions.handleManageSettings : undefined}
              />
            )}
          </>
        )}

        {activeTab === 'tasks' && (
          <div className="bg-card rounded-lg shadow-sm border border-border p-3 sm:p-6">
            <TaskManagementInterface
              tasks={tasks}
              teamMembers={teamMembers}
              workspaceId={workspace.id}
              roleScope={activeRoleSpace}
              onTaskEdit={(task) => {
                if (!permissions.canManageTasks) return;
                console.log('Edit task:', task);
              }}
              onTaskDelete={actions.handleTaskDelete}
              onTaskStatusChange={actions.handleTaskStatusChange}
              isLoading={isTasksLoading}
              initialTaskId={taskIdFromUrl}
            />
          </div>
        )}

        {activeTab === 'marketplace' && workspace.event && (
          <EventMarketplaceIntegration eventId={workspace.event.id} eventName={workspace.event.name} />
        )}

        {activeTab === 'team' && <TeamManagement workspace={workspace} roleScope={activeRoleSpace} />}

        {activeTab === 'communication' && (
          <WorkspaceCommunication
            workspaceId={workspace.id}
            teamMembers={teamMembers}
            roleScope={activeRoleSpace}
          />
        )}

        {activeTab === 'analytics' && (
          <WorkspaceAnalyticsDashboard workspace={workspace} roleScope={activeRoleSpace} />
        )}

        {activeTab === 'reports' && <WorkspaceReportExport workspace={workspace} teamMembers={teamMembers} />}

        {activeTab === 'templates' && (
          <WorkspaceTemplateManagement
            workspaceId={workspace.id}
            mode="library"
            onTemplateApplied={(template) => console.log('Template applied:', template)}
            onTemplateCreated={(template) => console.log('Template created:', template)}
          />
        )}

        {activeTab === 'audit' && <WorkspaceAuditLog workspace={workspace} teamMembers={teamMembers} />}

        {activeTab === 'role-management' && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <RoleBasedActions
              workspace={workspace}
              userRole={permissions.currentMember?.role as WorkspaceRole || null}
              onDelegateRole={() => {}}
              onInviteMember={permissions.canInviteMembers ? actions.handleInviteTeamMember : undefined}
              onManageSettings={permissions.canManageSettings ? actions.handleManageSettings : undefined}
              onViewReport={() => {}}
            />
            
            {/* Role Assignment */}
            <WorkspaceRoleAssignment
              workspaceId={workspace.id}
              teamMembers={teamMembers}
              currentUserRole={permissions.currentMember?.role as WorkspaceRole}
              isGlobalManager={permissions.isGlobalWorkspaceManager}
            />
            
            {/* Role Analytics */}
            <WorkspaceRoleAnalytics workspace={workspace} />
          </div>
        )}

        {activeTab === 'settings' && (
          <WorkspaceSettingsContent
            workspace={workspace}
            teamMembers={teamMembers}
            canManageSettings={permissions.canManageSettings}
            currentUserRole={permissions.currentMember?.role as WorkspaceRole}
          />
        )}

        {activeTab === 'event-settings' && workspace.eventId && (
          <EventSettingsTabContent
            workspace={workspace}
            userRole={permissions.currentMember?.role as WorkspaceRole}
          />
        )}

        {activeTab === 'approvals' && (
          <ApprovalsTabContent
            workspace={workspace}
            userRole={permissions.currentMember?.role as WorkspaceRole}
          />
        )}

        {activeTab === 'checklists' && (
          <ChecklistsTabContent workspace={workspace} />
        )}

        {activeTab === 'assign-shifts' && (
          <AssignShiftsTab workspace={workspace} />
        )}

        {activeTab === 'send-brief' && (
          <SendBriefTab workspace={workspace} />
        )}

        {activeTab === 'check-in' && (
          <CheckInVolunteerTab workspace={workspace} />
        )}

        {activeTab === 'create-team' && (
          <CreateTeamTab workspace={workspace} />
        )}

        {activeTab === 'training-status' && (
          <TrainingStatusTab workspace={workspace} />
        )}

        {activeTab === 'performance-review' && (
          <PerformanceReviewTab workspace={workspace} />
        )}

        {/* Volunteer Department tabs */}
        {activeTab === 'view-committees' && (
          <ViewCommitteesTab workspace={workspace} />
        )}

        {activeTab === 'shift-overview' && (
          <ShiftOverviewTab workspace={workspace} />
        )}

        {activeTab === 'mass-announcement' && (
          <MassAnnouncementTab workspace={workspace} />
        )}

        {activeTab === 'hours-report' && (
          <HoursReportTab workspace={workspace} />
        )}

        {activeTab === 'approve-timesheets' && (
          <ApproveTimesheetsTab workspace={workspace} />
        )}

        {activeTab === 'training-schedule' && (
          <TrainingScheduleTab workspace={workspace} />
        )}

        {activeTab === 'recognition' && (
          <RecognitionTab workspace={workspace} />
        )}

        {activeTab === 'recruitment' && (
          <RecruitmentTab workspace={workspace} />
        )}

        {/* Tech Department tabs */}
        {activeTab === 'system-check' && (
          <SystemHealthCheckTab workspaceId={workspace.id} />
        )}

        {activeTab === 'network-status' && (
          <NetworkStatusTab workspaceId={workspace.id} />
        )}

        {activeTab === 'security-audit' && (
          <SecurityAuditTab workspaceId={workspace.id} />
        )}

        {activeTab === 'equipment-report' && (
          <EquipmentReportTab workspaceId={workspace.id} />
        )}

        {activeTab === 'backup-status' && (
          <BackupStatusTab workspaceId={workspace.id} />
        )}

        {activeTab === 'report-incident' && (
          <ReportIncidentTab workspaceId={workspace.id} />
        )}

        {activeTab === 'config-review' && (
          <ConfigReviewTab workspaceId={workspace.id} />
        )}

        {activeTab === 'documentation' && (
          <DocumentationTab workspaceId={workspace.id} />
        )}

        {/* IT Committee tabs */}
        {activeTab === 'check-systems' && (
          <CheckSystemsTab workspaceId={workspace.id} />
        )}

        {activeTab === 'update-credentials' && (
          <UpdateCredentialsTab workspaceId={workspace.id} />
        )}

        {activeTab === 'service-status' && (
          <ServiceStatusTab workspaceId={workspace.id} />
        )}

        {activeTab === 'ticket-queue' && (
          <TicketQueueTab workspaceId={workspace.id} />
        )}

        {/* Technical Committee tabs */}
        {activeTab === 'test-equipment' && (
          <TestEquipmentTab workspaceId={workspace.id} />
        )}

        {activeTab === 'update-runsheet' && (
          <UpdateRunsheetTab workspaceId={workspace.id} />
        )}

        {activeTab === 'tech-check' && (
          <TechCheckTab workspaceId={workspace.id} />
        )}

        {activeTab === 'issue-report' && (
          <IssueReportTab workspaceId={workspace.id} />
        )}

        {/* Registration Committee tabs */}
        {activeTab === 'scan-checkin' && (
          <ScanCheckInTab workspace={workspace} />
        )}

        {activeTab === 'add-attendee' && (
          <AddAttendeeTab workspace={workspace} />
        )}

        {activeTab === 'export-list' && (
          <ExportListTab workspace={workspace} />
        )}

        {activeTab === 'send-reminders' && (
          <SendRemindersTab workspace={workspace} />
        )}

        {activeTab === 'view-waitlist' && (
          <ViewWaitlistTab workspace={workspace} />
        )}

        {/* Finance Committee tabs */}
        {activeTab === 'record-expense' && (
          <RecordExpenseTab workspace={workspace} />
        )}

        {activeTab === 'generate-report' && (
          <GenerateReportTab workspace={workspace} />
        )}

        {activeTab === 'approve-request' && (
          <ApproveRequestTab workspace={workspace} />
        )}

        {activeTab === 'view-budget' && (
          <ViewBudgetTab workspace={workspace} />
        )}

        {activeTab === 'export-data' && (
          <ExportDataTab workspace={workspace} />
        )}

        {/* Content Department tabs */}
        {activeTab === 'create-content' && (
          <CreateContentTab workspace={workspace} />
        )}

        {activeTab === 'assign-judges' && (
          <AssignJudgesTab workspace={workspace} />
        )}

        {activeTab === 'enter-score' && (
          <EnterScoreTab workspace={workspace} />
        )}

        {activeTab === 'upload-media' && (
          <UploadMediaTab workspace={workspace} />
        )}

        {activeTab === 'add-speaker' && (
          <AddSpeakerTab workspace={workspace} />
        )}

        {activeTab === 'schedule-session' && (
          <ScheduleSessionTab workspace={workspace} />
        )}

        {activeTab === 'view-rubrics' && (
          <ViewRubricsTab workspace={workspace} />
        )}

        {/* Growth Department tabs */}
        {activeTab === 'launch-campaign' && (
          <LaunchCampaignTab workspace={workspace} />
        )}

        {activeTab === 'schedule-content' && (
          <ScheduleContentTab workspace={workspace} />
        )}

        {activeTab === 'add-sponsor' && (
          <AddSponsorTab workspace={workspace} />
        )}

        {activeTab === 'send-announcement' && (
          <SendAnnouncementTab workspace={workspace} />
        )}

        {activeTab === 'view-analytics' && (
          <ViewAnalyticsTab workspace={workspace} />
        )}

        {activeTab === 'set-goals' && (
          <SetGoalsTab workspace={workspace} />
        )}

        {activeTab === 'manage-partners' && (
          <ManagePartnersTab workspace={workspace} />
        )}

        {activeTab === 'pr-outreach' && (
          <PROutreachTab workspace={workspace} />
        )}

        {/* Media Committee tabs (L3) */}
        {activeTab === 'upload-media-committee' && (
          <MediaUploadTab workspaceId={workspace.id} />
        )}

        {activeTab === 'create-shot-list' && (
          <CreateShotListTab workspaceId={workspace.id} />
        )}

        {activeTab === 'gallery-review' && (
          <GalleryReviewTab workspaceId={workspace.id} />
        )}

        {activeTab === 'export-assets' && (
          <ExportAssetsTab workspaceId={workspace.id} />
        )}

        {/* Judge Committee tabs (L3) */}
        {activeTab === 'assign-judges-committee' && (
          <AssignJudgesCommitteeTab workspaceId={workspace.id} />
        )}

        {activeTab === 'setup-rubrics-committee' && (
          <JudgeSetupRubricsTab workspaceId={workspace.id} />
        )}

        {activeTab === 'view-scores-committee' && (
          <JudgeViewScoresTab workspaceId={workspace.id} />
        )}

        {activeTab === 'export-results-committee' && (
          <JudgeExportResultsTab workspaceId={workspace.id} />
        )}

        {activeTab === 'judge-scoring-portal' && (
          <JudgeScoringPortalTab workspaceId={workspace.id} />
        )}

        {/* Speaker Liaison Committee tabs (L3) */}
        {activeTab === 'speaker-roster-committee' && (
          <SpeakerRosterTab workspaceId={workspace.id} />
        )}

        {activeTab === 'materials-collection-committee' && (
          <MaterialsCollectionTab workspaceId={workspace.id} />
        )}

        {activeTab === 'session-schedule-committee' && (
          <SpeakerSessionScheduleTab workspaceId={workspace.id} />
        )}

        {activeTab === 'travel-coordination-committee' && (
          <TravelCoordinationTab workspaceId={workspace.id} />
        )}

        {activeTab === 'communication-log-committee' && (
          <CommunicationLogTab workspaceId={workspace.id} />
        )}

        {/* Content Committee tabs (L3) */}
        {activeTab === 'review-content-committee' && (
          <ReviewContentTab workspaceId={workspace.id} />
        )}

        {activeTab === 'create-template-committee' && (
          <CreateTemplateTab workspaceId={workspace.id} />
        )}

        {activeTab === 'assign-reviewer-committee' && (
          <AssignReviewerTab workspaceId={workspace.id} />
        )}

        {activeTab === 'publish-content-committee' && (
          <PublishContentTab workspaceId={workspace.id} />
        )}

        {activeTab === 'content-calendar-committee' && (
          <ContentCalendarTab workspaceId={workspace.id} />
        )}

        {activeTab === 'content-pipeline-committee' && (
          <ContentPipelineTab workspaceId={workspace.id} />
        )}

        {/* Social Media Committee tabs (L3) */}
        {activeTab === 'schedule-content-social' && (
          <ScheduleContentSocialTab workspaceId={workspace.id} />
        )}

        {activeTab === 'monitor-hashtags-social' && (
          <MonitorHashtagsSocialTab workspaceId={workspace.id} />
        )}

        {activeTab === 'engagement-report-social' && (
          <EngagementReportSocialTab workspaceId={workspace.id} />
        )}

        {activeTab === 'post-now-social' && (
          <PostNowSocialTab workspaceId={workspace.id} />
        )}

        {activeTab === 'manage-platforms-social' && (
          <ManagePlatformsSocialTab workspaceId={workspace.id} />
        )}

        {activeTab === 'content-library-social' && (
          <ContentLibrarySocialTab workspaceId={workspace.id} />
        )}

        {/* Communication Committee tabs (L3) */}
        {activeTab === 'send-announcement-communication' && (
          <CommSendAnnouncementTab workspaceId={workspace.id} />
        )}

        {activeTab === 'create-email-communication' && (
          <CommCreateEmailTab workspaceId={workspace.id} />
        )}

        {activeTab === 'draft-press-release-communication' && (
          <CommDraftPressReleaseTab workspaceId={workspace.id} />
        )}

        {activeTab === 'broadcast-message-communication' && (
          <CommBroadcastMessageTab workspaceId={workspace.id} />
        )}

        {activeTab === 'schedule-update-communication' && (
          <CommScheduleUpdateTab workspaceId={workspace.id} />
        )}

        {activeTab === 'contact-stakeholders-communication' && (
          <CommContactStakeholdersTab workspaceId={workspace.id} />
        )}

        {/* Marketing Committee tabs (L3) */}
        {activeTab === 'schedule-post-marketing' && (
          <SchedulePostMarketingTab workspaceId={workspace.id} />
        )}

        {activeTab === 'view-analytics-marketing' && (
          <ViewAnalyticsMarketingTab workspaceId={workspace.id} />
        )}

        {activeTab === 'create-campaign-marketing' && (
          <CreateCampaignMarketingTab workspaceId={workspace.id} />
        )}

        {activeTab === 'ab-test-marketing' && (
          <ABTestingMarketingTab workspaceId={workspace.id} />
        )}

        {/* Operations Department tabs (L2) */}
        {activeTab === 'event-briefing' && (
          <EventBriefingTab workspace={workspace} />
        )}

        {activeTab === 'logistics-status' && (
          <LogisticsStatusTab workspace={workspace} />
        )}

        {activeTab === 'catering-update' && (
          <CateringUpdateTab workspace={workspace} />
        )}

        {activeTab === 'facility-check' && (
          <FacilityCheckTab workspace={workspace} />
        )}

        {activeTab === 'master-checklist' && (
          <MasterChecklistTab workspace={workspace} />
        )}

        {activeTab === 'incident-report' && (
          <IncidentReportTab workspace={workspace} />
        )}

        {activeTab === 'team-roster' && (
          <TeamRosterTab workspace={workspace} />
        )}

        {activeTab === 'ops-report' && (
          <OpsReportTab workspace={workspace} />
        )}

        {/* Facility Committee tabs (L3) */}
        {activeTab === 'safety-check-facility' && (
          <SafetyCheckTab workspaceId={workspace.id} />
        )}

        {activeTab === 'venue-walkthrough-facility' && (
          <VenueWalkthroughTab workspaceId={workspace.id} />
        )}

        {activeTab === 'report-issue-facility' && (
          <ReportIssueTab workspaceId={workspace.id} />
        )}

        {activeTab === 'room-status-facility' && (
          <RoomStatusTab workspaceId={workspace.id} />
        )}

        {/* Logistics Committee tabs (L3) */}
        {activeTab === 'track-shipment-logistics' && (
          <TrackShipmentTab workspaceId={workspace.id} />
        )}

        {activeTab === 'add-equipment-logistics' && (
          <AddEquipmentTab workspaceId={workspace.id} />
        )}

        {activeTab === 'schedule-transport-logistics' && (
          <ScheduleTransportTab workspaceId={workspace.id} />
        )}

        {activeTab === 'add-venue-logistics' && (
          <AddVenueTab workspaceId={workspace.id} />
        )}

        {activeTab === 'create-checklist-logistics' && (
          <CreateChecklistTab workspaceId={workspace.id} />
        )}

        {activeTab === 'generate-report-logistics' && (
          <LogisticsGenerateReportTab workspaceId={workspace.id} />
        )}

        {activeTab === 'report-issue-logistics' && (
          <LogisticsReportIssueTab workspaceId={workspace.id} />
        )}

        {activeTab === 'view-timeline-logistics' && (
          <ViewTimelineTab workspaceId={workspace.id} />
        )}

        {/* Catering Committee tabs (L3) */}
        {activeTab === 'update-menu-catering' && (
          <CateringUpdateMenuTab workspaceId={workspace.id} />
        )}

        {activeTab === 'check-inventory-catering' && (
          <CateringCheckInventoryTab workspaceId={workspace.id} />
        )}

        {activeTab === 'dietary-report-catering' && (
          <CateringDietaryReportTab workspaceId={workspace.id} />
        )}

        {activeTab === 'confirm-headcount-catering' && (
          <CateringConfirmHeadcountTab workspaceId={workspace.id} />
        )}
      </div>
    </WorkspaceLayout>
  );
}
