import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { WorkspaceDashboardSkeleton } from './WorkspaceDashboardSkeleton';
import { WorkspaceStatus } from '../../types';
import { WorkspaceLayout } from './WorkspaceLayout';
import { CreateSubWorkspaceModal } from './CreateSubWorkspaceModal';
import { useWorkspaceShell } from '@/hooks/useWorkspaceShell';
import { useWorkspaceSettingsRealtime } from '@/hooks/useWorkspaceSettingsRealtime';
import { WorkspaceTabRouter, CommitteeTabRouter, DepartmentTabRouter } from './tabs';

interface WorkspaceDashboardProps {
  workspaceId?: string;
  orgSlug?: string;
}

export function WorkspaceDashboard({ workspaceId, orgSlug }: WorkspaceDashboardProps) {
  const { state, actions, permissions } = useWorkspaceShell({ workspaceId, orgSlug });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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

  // Enable real-time settings sync
  useWorkspaceSettingsRealtime(workspace?.id);

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
    return <WorkspaceDashboardSkeleton />;
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
            onClick={() => navigate(orgSlug ? `/${orgSlug}/dashboard` : '/dashboard')}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Build common props for routers
  const routerPermissions = {
    currentMember: permissions.currentMember,
    canManageTasks: permissions.canManageTasks,
    canInviteMembers: permissions.canInviteMembers,
    canManageSettings: permissions.canManageSettings,
    isGlobalWorkspaceManager: permissions.isGlobalWorkspaceManager,
  };

  const routerActions = {
    setActiveTab: actions.setActiveTab,
    handleInviteTeamMember: actions.handleInviteTeamMember,
    handleManageSettings: actions.handleManageSettings,
    handleViewTasks: actions.handleViewTasks,
    handleTaskDelete: actions.handleTaskDelete,
    handleTaskStatusChange: actions.handleTaskStatusChange,
    setShowSubWorkspaceModal: actions.setShowSubWorkspaceModal,
  };

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
        {/* Try core tab router first */}
        <WorkspaceTabRouter
          workspace={workspace}
          activeTab={activeTab}
          orgSlug={orgSlug}
          tasks={tasks}
          teamMembers={teamMembers}
          isTasksLoading={isTasksLoading}
          taskIdFromUrl={taskIdFromUrl}
          activeRoleSpace={activeRoleSpace}
          permissions={routerPermissions}
          actions={routerActions}
        />

        {/* Try committee tab router for committee-specific tabs */}
        <CommitteeTabRouter
          workspace={workspace}
          activeTab={activeTab}
        />

        {/* Try department tab router for department-specific tabs */}
        <DepartmentTabRouter
          workspace={workspace}
          activeTab={activeTab}
        />
      </div>
    </WorkspaceLayout>
  );
}
