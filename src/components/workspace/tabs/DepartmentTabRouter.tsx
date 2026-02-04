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

// Volunteers Department tabs (L2)
const ViewCommitteesTab = lazy(() => import('../department/volunteers/tabs').then(m => ({ default: m.ViewCommitteesTab })));
const ShiftOverviewTab = lazy(() => import('../department/volunteers/tabs').then(m => ({ default: m.ShiftOverviewTab })));
const MassAnnouncementTab = lazy(() => import('../department/volunteers/tabs').then(m => ({ default: m.MassAnnouncementTab })));
const HoursReportTab = lazy(() => import('../department/volunteers/tabs').then(m => ({ default: m.HoursReportTab })));
const ApproveTimesheetsTab = lazy(() => import('../department/volunteers/tabs').then(m => ({ default: m.ApproveTimesheetsTab })));
const TrainingScheduleTab = lazy(() => import('../department/volunteers/tabs').then(m => ({ default: m.TrainingScheduleTab })));
const RecognitionTab = lazy(() => import('../department/volunteers/tabs').then(m => ({ default: m.RecognitionTab })));
const RecruitmentTab = lazy(() => import('../department/volunteers/tabs').then(m => ({ default: m.RecruitmentTab })));

// Tech Department tabs (L2)
const SystemHealthCheckTab = lazy(() => import('../department/tech/tabs').then(m => ({ default: m.SystemHealthCheckTab })));
const NetworkStatusTab = lazy(() => import('../department/tech/tabs').then(m => ({ default: m.NetworkStatusTab })));
const SecurityAuditTab = lazy(() => import('../department/tech/tabs').then(m => ({ default: m.SecurityAuditTab })));
const EquipmentReportTab = lazy(() => import('../department/tech/tabs').then(m => ({ default: m.EquipmentReportTab })));
const BackupStatusTab = lazy(() => import('../department/tech/tabs').then(m => ({ default: m.BackupStatusTab })));
const ReportIncidentTab = lazy(() => import('../department/tech/tabs').then(m => ({ default: m.ReportIncidentTab })));
const ConfigReviewTab = lazy(() => import('../department/tech/tabs').then(m => ({ default: m.ConfigReviewTab })));
const DocumentationTab = lazy(() => import('../department/tech/tabs').then(m => ({ default: m.DocumentationTab })));

// Content Department tabs (L2)
const CreateContentTab = lazy(() => import('../department/content/tabs').then(m => ({ default: m.CreateContentTab })));
const AssignJudgesTab = lazy(() => import('../department/content/tabs').then(m => ({ default: m.AssignJudgesTab })));
const EnterScoreTab = lazy(() => import('../department/content/tabs').then(m => ({ default: m.EnterScoreTab })));
const UploadMediaTab = lazy(() => import('../department/content/tabs').then(m => ({ default: m.UploadMediaTab })));
const AddSpeakerTab = lazy(() => import('../department/content/tabs').then(m => ({ default: m.AddSpeakerTab })));
const ScheduleSessionTab = lazy(() => import('../department/content/tabs').then(m => ({ default: m.ScheduleSessionTab })));
const ViewRubricsTab = lazy(() => import('../department/content/tabs').then(m => ({ default: m.ViewRubricsTab })));

// Finance Department tabs (L2)
const FinanceBudgetOverviewTab = lazy(() => import('../department/finance/tabs').then(m => ({ default: m.BudgetOverviewTab })));
const FinanceExpenseManagementTab = lazy(() => import('../department/finance/tabs').then(m => ({ default: m.ExpenseManagementTab })));
const FinanceInvoiceManagementTab = lazy(() => import('../department/finance/tabs').then(m => ({ default: m.InvoiceManagementTab })));
const FinanceBudgetApprovalsTab = lazy(() => import('../department/finance/tabs').then(m => ({ default: m.BudgetApprovalsTab })));
const FinanceSpendingAnalysisTab = lazy(() => import('../department/finance/tabs').then(m => ({ default: m.SpendingAnalysisTab })));
const FinanceFinancialReportsTab = lazy(() => import('../department/finance/tabs').then(m => ({ default: m.FinancialReportsTab })));
const FinanceBudgetForecastTab = lazy(() => import('../department/finance/tabs').then(m => ({ default: m.BudgetForecastTab })));
const FinanceAuditTrailTab = lazy(() => import('../department/finance/tabs').then(m => ({ default: m.FinanceAuditTrailTab })));

// Growth Department tabs (L2)
const LaunchCampaignTab = lazy(() => import('../department/growth/tabs').then(m => ({ default: m.LaunchCampaignTab })));
const ScheduleContentTab = lazy(() => import('../department/growth/tabs').then(m => ({ default: m.ScheduleContentTab })));
const AddSponsorTab = lazy(() => import('../department/growth/tabs').then(m => ({ default: m.AddSponsorTab })));
const SendAnnouncementTab = lazy(() => import('../department/growth/tabs').then(m => ({ default: m.SendAnnouncementTab })));
const ViewAnalyticsTab = lazy(() => import('../department/growth/tabs').then(m => ({ default: m.ViewAnalyticsTab })));
const SetGoalsTab = lazy(() => import('../department/growth/tabs').then(m => ({ default: m.SetGoalsTab })));
const ManagePartnersTab = lazy(() => import('../department/growth/tabs').then(m => ({ default: m.ManagePartnersTab })));
const PROutreachTab = lazy(() => import('../department/growth/tabs').then(m => ({ default: m.PROutreachTab })));

// Operations Department tabs (L2)
const EventBriefingTab = lazy(() => import('../department/operations/tabs').then(m => ({ default: m.EventBriefingTab })));
const LogisticsStatusTab = lazy(() => import('../department/operations/tabs').then(m => ({ default: m.LogisticsStatusTab })));
const CateringUpdateTab = lazy(() => import('../department/operations/tabs').then(m => ({ default: m.CateringUpdateTab })));
const FacilityCheckTab = lazy(() => import('../department/operations/tabs').then(m => ({ default: m.FacilityCheckTab })));
const MasterChecklistTab = lazy(() => import('../department/operations/tabs').then(m => ({ default: m.MasterChecklistTab })));
const IncidentReportTab = lazy(() => import('../department/operations/tabs').then(m => ({ default: m.IncidentReportTab })));
const TeamRosterTab = lazy(() => import('../department/operations/tabs').then(m => ({ default: m.TeamRosterTab })));
const OpsReportTab = lazy(() => import('../department/operations/tabs').then(m => ({ default: m.OpsReportTab })));

// Map of department tabs
const DEPARTMENT_TAB_MAP: Record<string, (props: { workspace: Workspace }) => JSX.Element | null> = {
  // Volunteer Department
  'view-committees': ({ workspace }) => <ViewCommitteesTab workspace={workspace} />,
  'shift-overview': ({ workspace }) => <ShiftOverviewTab workspace={workspace} />,
  'mass-announcement': ({ workspace }) => <MassAnnouncementTab workspace={workspace} />,
  'hours-report': ({ workspace }) => <HoursReportTab workspace={workspace} />,
  'approve-timesheets': ({ workspace }) => <ApproveTimesheetsTab workspace={workspace} />,
  'training-schedule': ({ workspace }) => <TrainingScheduleTab workspace={workspace} />,
  'recognition': ({ workspace }) => <RecognitionTab workspace={workspace} />,
  'recruitment': ({ workspace }) => <RecruitmentTab workspace={workspace} />,
  
  // Tech Department
  'system-check': ({ workspace }) => <SystemHealthCheckTab workspaceId={workspace.id} />,
  'network-status': ({ workspace }) => <NetworkStatusTab workspaceId={workspace.id} />,
  'security-audit': ({ workspace }) => <SecurityAuditTab workspaceId={workspace.id} />,
  'equipment-report': ({ workspace }) => <EquipmentReportTab workspaceId={workspace.id} />,
  'backup-status': ({ workspace }) => <BackupStatusTab workspaceId={workspace.id} />,
  'report-incident': ({ workspace }) => <ReportIncidentTab workspaceId={workspace.id} />,
  'config-review': ({ workspace }) => <ConfigReviewTab workspaceId={workspace.id} />,
  'documentation': ({ workspace }) => <DocumentationTab workspaceId={workspace.id} />,
  
  // Content Department
  'create-content': ({ workspace }) => <CreateContentTab workspace={workspace} />,
  'assign-judges': ({ workspace }) => <AssignJudgesTab workspace={workspace} />,
  'enter-score': ({ workspace }) => <EnterScoreTab workspace={workspace} />,
  'upload-media': ({ workspace }) => <UploadMediaTab workspace={workspace} />,
  'add-speaker': ({ workspace }) => <AddSpeakerTab workspace={workspace} />,
  'schedule-session': ({ workspace }) => <ScheduleSessionTab workspace={workspace} />,
  'view-rubrics': ({ workspace }) => <ViewRubricsTab workspace={workspace} />,
  
  // Growth Department
  'launch-campaign': ({ workspace }) => <LaunchCampaignTab workspace={workspace} />,
  'schedule-content': ({ workspace }) => <ScheduleContentTab workspace={workspace} />,
  'add-sponsor': ({ workspace }) => <AddSponsorTab workspace={workspace} />,
  'send-announcement': ({ workspace }) => <SendAnnouncementTab workspace={workspace} />,
  'view-analytics': ({ workspace }) => <ViewAnalyticsTab workspace={workspace} />,
  'set-goals': ({ workspace }) => <SetGoalsTab workspace={workspace} />,
  'manage-partners': ({ workspace }) => <ManagePartnersTab workspace={workspace} />,
  'pr-outreach': ({ workspace }) => <PROutreachTab workspace={workspace} />,
  
  // Operations Department
  'event-briefing': ({ workspace }) => <EventBriefingTab workspace={workspace} />,
  'logistics-status': ({ workspace }) => <LogisticsStatusTab workspace={workspace} />,
  'catering-update': ({ workspace }) => <CateringUpdateTab workspace={workspace} />,
  'facility-check': ({ workspace }) => <FacilityCheckTab workspace={workspace} />,
  'master-checklist': ({ workspace }) => <MasterChecklistTab workspace={workspace} />,
  'incident-report': ({ workspace }) => <IncidentReportTab workspace={workspace} />,
  'team-roster': ({ workspace }) => <TeamRosterTab workspace={workspace} />,
  'ops-report': ({ workspace }) => <OpsReportTab workspace={workspace} />,
  
  // Finance Department
  'budget-overview-finance': ({ workspace }) => <FinanceBudgetOverviewTab workspaceId={workspace.id} />,
  'expense-management-finance': ({ workspace }) => <FinanceExpenseManagementTab workspaceId={workspace.id} />,
  'invoice-management-finance': ({ workspace }) => <FinanceInvoiceManagementTab workspaceId={workspace.id} />,
  'budget-approvals-finance': ({ workspace }) => <FinanceBudgetApprovalsTab workspaceId={workspace.id} />,
  'spending-analysis-finance': ({ workspace }) => <FinanceSpendingAnalysisTab workspaceId={workspace.id} />,
  'financial-reports-finance': ({ workspace }) => <FinanceFinancialReportsTab workspaceId={workspace.id} />,
  'budget-forecast-finance': ({ workspace }) => <FinanceBudgetForecastTab workspaceId={workspace.id} />,
  'finance-audit-trail': ({ workspace }) => <FinanceAuditTrailTab workspaceId={workspace.id} />,
};

interface DepartmentTabRouterProps {
  workspace: Workspace;
  activeTab: WorkspaceTab;
}

export function DepartmentTabRouter({ workspace, activeTab }: DepartmentTabRouterProps) {
  const TabComponent = DEPARTMENT_TAB_MAP[activeTab];
  
  if (!TabComponent) {
    return null;
  }

  return (
    <Suspense fallback={<TabSkeleton />}>
      {TabComponent({ workspace })}
    </Suspense>
  );
}
