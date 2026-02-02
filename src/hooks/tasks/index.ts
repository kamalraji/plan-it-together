/**
 * Task Hooks - Task management and tracking hooks
 * 
 * Re-exports hooks from the flat structure for backwards compatibility
 * while providing organized imports.
 */

// Core task operations
export { useTaskComments } from '../useTaskComments';
export { useTaskActivities } from '../useTaskActivities';
export { useTaskDraft } from '../useTaskDraft';
export { useTaskNotifications } from '../useTaskNotifications';
export { useSubtaskProgress } from '../useSubtaskProgress';
export { useRecurringTasks } from '../useRecurringTasks';
export { useCrossWorkspaceTasks } from '../useCrossWorkspaceTasks';
export { useMyAssignments } from '../useMyAssignments';

// Task approvals
export { useTaskApprovalCheck } from '../useTaskApprovalCheck';
export { useTaskApprovalPolicies } from '../useTaskApprovalPolicies';
export { useTaskApprovalRequests } from '../useTaskApprovalRequests';

// Task AI
export { useTaskAISuggestions } from '../useTaskAISuggestions';

// Time tracking
export { useTimeTracking } from '../useTimeTracking';
export { useTimeReports } from '../useTimeReports';

// Automation
export { useAutomationRules } from '../useAutomationRules';

// Committee stats
export { useCommitteeStats, useDepartmentStats } from '../useCommitteeStats';

// Volunteer timesheets
export { useVolunteerTimesheets } from '../useVolunteerTimesheets';
