/**
 * Centralized WorkspaceTab Type Definition
 * Single source of truth for all workspace tab types
 * 
 * @description This file contains the complete type definition for all workspace tabs
 * organized by workspace level and department. Import from here instead of defining
 * locally in components or hooks.
 */

// ============================================
// CORE TABS (Available in all workspace types)
// ============================================
export type CoreWorkspaceTab =
  | 'overview'
  | 'tasks'
  | 'team'
  | 'communication'
  | 'analytics'
  | 'reports'
  | 'marketplace'
  | 'templates'
  | 'audit'
  | 'role-management'
  | 'settings'
  | 'event-settings'
  | 'approvals'
  | 'checklists'
  | 'directory';

// ============================================
// L1 ROOT WORKSPACE TABS
// ============================================
export type RootWorkspaceTab =
  | 'workspace-management'
  | 'page-builder';

// ============================================
// L2 DEPARTMENT TABS
// ============================================

// Volunteer Department
export type VolunteerDepartmentTab =
  | 'assign-shifts'
  | 'send-brief'
  | 'check-in'
  | 'create-team'
  | 'training-status'
  | 'performance-review'
  | 'view-committees'
  | 'shift-overview'
  | 'mass-announcement'
  | 'hours-report'
  | 'approve-timesheets'
  | 'training-schedule'
  | 'recognition'
  | 'recruitment';

// Tech Department
export type TechDepartmentTab =
  | 'system-check'
  | 'network-status'
  | 'security-audit'
  | 'equipment-report'
  | 'backup-status'
  | 'report-incident'
  | 'config-review'
  | 'documentation';

// Finance Department
export type FinanceDepartmentTab =
  | 'budget-overview-finance'
  | 'expense-management-finance'
  | 'invoice-management-finance'
  | 'budget-approvals-finance'
  | 'spending-analysis-finance'
  | 'financial-reports-finance'
  | 'budget-forecast-finance'
  | 'payment-schedule-finance'
  | 'vendor-payments-finance'
  | 'finance-audit-trail';

// Content Department
export type ContentDepartmentTab =
  | 'create-content'
  | 'assign-judges'
  | 'enter-score'
  | 'upload-media'
  | 'add-speaker'
  | 'schedule-session'
  | 'view-rubrics';

// Growth Department
export type GrowthDepartmentTab =
  | 'launch-campaign'
  | 'schedule-content'
  | 'add-sponsor'
  | 'send-announcement'
  | 'view-analytics'
  | 'set-goals'
  | 'manage-partners'
  | 'pr-outreach';

// Operations Department
export type OperationsDepartmentTab =
  | 'event-briefing'
  | 'logistics-status'
  | 'catering-update'
  | 'facility-check'
  | 'master-checklist'
  | 'incident-report'
  | 'team-roster'
  | 'ops-report';

// Combined Department Tabs
export type DepartmentTab =
  | VolunteerDepartmentTab
  | TechDepartmentTab
  | FinanceDepartmentTab
  | ContentDepartmentTab
  | GrowthDepartmentTab
  | OperationsDepartmentTab;

// ============================================
// L3 COMMITTEE TABS
// ============================================

// IT Committee
export type ITCommitteeTab =
  | 'check-systems'
  | 'update-credentials'
  | 'service-status'
  | 'ticket-queue';

// Technical Committee
export type TechnicalCommitteeTab =
  | 'test-equipment'
  | 'update-runsheet'
  | 'tech-check'
  | 'issue-report'
  | 'incident-log'
  | 'equipment-checkout'
  | 'power-distribution'
  | 'contingency';

// Registration Committee
export type RegistrationCommitteeTab =
  | 'scan-checkin'
  | 'add-attendee'
  | 'export-list'
  | 'send-reminders'
  | 'view-waitlist'
  | 'id-cards'
  | 'certificates';

// Finance Committee
export type FinanceCommitteeTab =
  | 'record-expense'
  | 'generate-report'
  | 'approve-request'
  | 'view-budget'
  | 'export-data';

// Media Committee
export type MediaCommitteeTab =
  | 'upload-media-committee'
  | 'create-shot-list'
  | 'gallery-review'
  | 'export-assets';

// Judge Committee
export type JudgeCommitteeTab =
  | 'assign-judges-committee'
  | 'setup-rubrics-committee'
  | 'view-scores-committee'
  | 'export-results-committee'
  | 'judge-scoring-portal';

// Speaker Liaison Committee
export type SpeakerLiaisonCommitteeTab =
  | 'speaker-roster-committee'
  | 'materials-collection-committee'
  | 'session-schedule-committee'
  | 'travel-coordination-committee'
  | 'communication-log-committee';

// Content Committee
export type ContentCommitteeTab =
  | 'review-content-committee'
  | 'create-template-committee'
  | 'assign-reviewer-committee'
  | 'publish-content-committee'
  | 'content-calendar-committee'
  | 'content-pipeline-committee';

// Social Media Committee
export type SocialMediaCommitteeTab =
  | 'schedule-content-social'
  | 'monitor-hashtags-social'
  | 'engagement-report-social'
  | 'post-now-social'
  | 'manage-platforms-social'
  | 'content-library-social';

// Communication Committee
export type CommunicationCommitteeTab =
  | 'send-announcement-communication'
  | 'create-email-communication'
  | 'draft-press-release-communication'
  | 'broadcast-message-communication'
  | 'schedule-update-communication'
  | 'contact-stakeholders-communication';

// Marketing Committee
export type MarketingCommitteeTab =
  | 'schedule-post-marketing'
  | 'view-analytics-marketing'
  | 'create-campaign-marketing'
  | 'ab-test-marketing';

// Facility Committee
export type FacilityCommitteeTab =
  | 'safety-check-facility'
  | 'venue-walkthrough-facility'
  | 'report-issue-facility'
  | 'room-status-facility';

// Logistics Committee
export type LogisticsCommitteeTab =
  | 'track-shipment-logistics'
  | 'add-equipment-logistics'
  | 'schedule-transport-logistics'
  | 'add-venue-logistics'
  | 'create-checklist-logistics'
  | 'generate-report-logistics'
  | 'report-issue-logistics'
  | 'view-timeline-logistics';

// Catering Committee
export type CateringCommitteeTab =
  | 'update-menu-catering'
  | 'check-inventory-catering'
  | 'dietary-report-catering'
  | 'confirm-headcount-catering';

// Event Committee
export type EventCommitteeTab =
  | 'update-schedule-event'
  | 'brief-teams-event'
  | 'vip-tracker-event'
  | 'run-of-show-event';

// Combined Committee Tabs
export type CommitteeTab =
  | ITCommitteeTab
  | TechnicalCommitteeTab
  | RegistrationCommitteeTab
  | FinanceCommitteeTab
  | MediaCommitteeTab
  | JudgeCommitteeTab
  | SpeakerLiaisonCommitteeTab
  | ContentCommitteeTab
  | SocialMediaCommitteeTab
  | CommunicationCommitteeTab
  | MarketingCommitteeTab
  | FacilityCommitteeTab
  | LogisticsCommitteeTab
  | CateringCommitteeTab
  | EventCommitteeTab;

// ============================================
// UNIFIED WORKSPACE TAB TYPE
// ============================================
/**
 * Complete WorkspaceTab type combining all tab categories
 * Use this as the primary type for workspace tab navigation
 */
export type WorkspaceTab =
  | CoreWorkspaceTab
  | RootWorkspaceTab
  | DepartmentTab
  | CommitteeTab;

// ============================================
// TAB GROUPINGS FOR UI
// ============================================
export const CORE_TABS: CoreWorkspaceTab[] = [
  'overview',
  'tasks',
  'team',
  'communication',
  'analytics',
  'reports',
  'marketplace',
  'templates',
  'audit',
  'role-management',
  'settings',
  'event-settings',
  'approvals',
  'checklists',
  'directory',
];

export const ROOT_ONLY_TABS: RootWorkspaceTab[] = [
  'workspace-management',
  'page-builder',
];

// ============================================
// TYPE GUARDS
// ============================================
export function isCoreTab(tab: string): tab is CoreWorkspaceTab {
  return CORE_TABS.includes(tab as CoreWorkspaceTab);
}

export function isRootOnlyTab(tab: string): tab is RootWorkspaceTab {
  return ROOT_ONLY_TABS.includes(tab as RootWorkspaceTab);
}

// ============================================
// DEFAULT TABS BY WORKSPACE TYPE
// ============================================
export const DEFAULT_TAB_BY_WORKSPACE_TYPE: Record<string, WorkspaceTab> = {
  ROOT: 'overview',
  DEPARTMENT: 'overview',
  COMMITTEE: 'tasks',
  TEAM: 'tasks',
};
