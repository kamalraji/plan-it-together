/**
 * Workspace Hooks - Workspace management and data hooks
 * 
 * Re-exports hooks from the flat structure for backwards compatibility
 * while providing organized imports.
 */

// Core workspace data
export { useWorkspaceData } from '../useWorkspaceData';
export { useMyWorkspaces } from '../useMyWorkspaces';
export { useAllWorkspacesData } from '../useAllWorkspacesData';
export { useWorkspaceShell } from '../useWorkspaceShell';
export { useWorkspaceQueryParams } from '../useWorkspaceQueryParams';
export { useWorkspaceUrlResolver } from '../useWorkspaceUrlResolver';

// Workspace operations
export { useWorkspaceMutations } from '../useWorkspaceMutations';
export { useWorkspaceProvisioning } from '../useWorkspaceProvisioning';

// Budget and finances
export { useWorkspaceBudget } from '../useWorkspaceBudget';
export { useWorkspaceExpenses } from '../useWorkspaceExpenses';
export { useWorkspaceInvoices } from '../useWorkspaceInvoices';

// Resources and settings
export { useWorkspaceResources } from '../useWorkspaceResources';
export { useWorkspaceSettings } from '../useWorkspaceSettings';
export { useWorkspaceIntegrations } from '../useWorkspaceIntegrations';

// Access and permissions
export { useWorkspaceAccess } from '../useWorkspaceAccess';
export { useWorkspacePermissions } from '../useWorkspacePermissions';
export { useWorkspaceRBAC } from '../useWorkspaceRBAC';

// Communication
export { useWorkspaceChannels } from '../useWorkspaceChannels';
export { useChannelPresence } from '../useChannelPresence';
export { useRealtimeMessages } from '../useRealtimeMessages';

// Approvals
export { useWorkspaceApprovals } from '../useWorkspaceApprovals';
export { useAllPendingApprovals } from '../useAllPendingApprovals';
export { useApprovalComments } from '../useApprovalComments';
export { useOutgoingRequests } from '../useOutgoingRequests';
export { useResourceRequests } from '../useResourceRequests';

// Certificates
export { useWorkspaceCertificates } from '../useWorkspaceCertificates';
export { useCertificateDelegation, useMyDelegatedPermissions } from '../useCertificateDelegation';
export { useCertificateTemplates } from '../useCertificateTemplates';

// Checklists and delegation
export { useChecklistDelegation } from '../useChecklistDelegation';
export { useSharedChecklists } from '../useSharedChecklists';
export { useDelegationProgress } from '../useDelegationProgress';
export { useDeadlineExtensions } from '../useDeadlineExtensions';
export { useVenueSetupChecklist } from '../useVenueSetupChecklist';

// Team and members
export { useChildWorkspaceMembers } from '../useChildWorkspaceMembers';
export { useMemberDirectory } from '../useMemberDirectory';
