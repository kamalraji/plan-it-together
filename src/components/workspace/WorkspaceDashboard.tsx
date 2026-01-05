import { WorkspaceStatus, WorkspaceRole, WorkspaceType } from '../../types';
import { WorkspaceHeader } from './WorkspaceHeader';
import { WorkspaceNavigation } from './WorkspaceNavigation';
import { TeamManagement } from './TeamManagement';
import { WorkspaceCommunication } from './WorkspaceCommunication';
import { WorkspaceAnalyticsDashboard } from './WorkspaceAnalyticsDashboard';
import { WorkspaceReportExport } from './WorkspaceReportExport';
import { WorkspaceTemplateManagement } from './WorkspaceTemplateManagement';
import { EventMarketplaceIntegration } from '../marketplace';

import { TaskManagementInterface } from './TaskManagementInterface';
import { WorkspaceAuditLog } from './WorkspaceAuditLog';
import { WorkspaceRoleAssignment } from './WorkspaceRoleAssignment';
import { WorkspaceRoleAnalytics } from './WorkspaceRoleAnalytics';
import { CreateSubWorkspaceModal } from './CreateSubWorkspaceModal';
import { DepartmentDashboard } from './department';
import { CommitteeDashboard } from './committee';
import { TeamDashboard } from './team';
import { RootDashboard } from './root';
import { useWorkspaceShell } from '@/hooks/useWorkspaceShell';

interface WorkspaceDashboardProps {
  workspaceId?: string;
  orgSlug?: string;
}

export function WorkspaceDashboard({ workspaceId, orgSlug }: WorkspaceDashboardProps) {
  const { state, actions, permissions } = useWorkspaceShell({ workspaceId, orgSlug });

  const {
    workspace,
    userWorkspaces,
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
    <div className="min-h-screen w-full bg-background flex flex-col">
      <WorkspaceHeader
        workspace={workspace}
        orgSlug={orgSlug}
        onInviteTeamMember={permissions.canInviteMembers ? actions.handleInviteTeamMember : undefined}
        onCreateTask={permissions.canManageTasks ? actions.handleCreateTask : undefined}
        onManageSettings={permissions.canManageSettings ? actions.handleManageSettings : undefined}
        onCreateSubWorkspace={permissions.canCreateSubWorkspace ? () => actions.setShowSubWorkspaceModal(true) : undefined}
      />

      {/* Sub-Workspace Creation Modal */}
      {workspace?.eventId && (
        <CreateSubWorkspaceModal
          open={showSubWorkspaceModal}
          onOpenChange={actions.setShowSubWorkspaceModal}
          parentWorkspaceId={workspace.id}
          eventId={workspace.eventId}
        />
      )}


      <WorkspaceNavigation
        workspace={workspace}
        userWorkspaces={userWorkspaces}
        activeTab={activeTab}
        onTabChange={actions.setActiveTab}
        onWorkspaceSwitch={actions.handleWorkspaceSwitch}
      />

      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {activeTab === 'overview' && (
          <>
            {/* Level-specific dashboards */}
            {workspace.workspaceType === WorkspaceType.ROOT ? (
              <RootDashboard 
                workspace={workspace} 
                orgSlug={orgSlug}
                onViewTasks={actions.handleViewTasks} 
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
                onViewTasks={actions.handleViewTasks} 
              />
            ) : workspace.workspaceType === WorkspaceType.TEAM ? (
              <TeamDashboard 
                workspace={workspace} 
                orgSlug={orgSlug}
                onViewTasks={actions.handleViewTasks} 
              />
            ) : (
              /* Fallback for legacy workspaces without workspace_type */
              <RootDashboard 
                workspace={workspace} 
                orgSlug={orgSlug}
                onViewTasks={actions.handleViewTasks} 
              />
            )}
          </>
        )}

        {activeTab === 'tasks' && (
          <div className="bg-card rounded-lg shadow-sm border border-border p-3 sm:p-6">
            <TaskManagementInterface
              tasks={tasks}
              teamMembers={teamMembers}
              roleScope={activeRoleSpace}
              onTaskEdit={(task) => {
                if (!permissions.canManageTasks) return;
                console.log('Edit task:', task);
              }}
              onTaskDelete={actions.handleTaskDelete}
              onTaskStatusChange={actions.handleTaskStatusChange}
              onCreateTask={actions.handleCreateTask}
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
            <WorkspaceRoleAssignment
              workspaceId={workspace.id}
              teamMembers={teamMembers}
              currentUserRole={permissions.currentMember?.role as WorkspaceRole}
              isGlobalManager={permissions.isGlobalWorkspaceManager}
            />
            <WorkspaceRoleAnalytics workspace={workspace} />
          </div>
        )}
      </div>
    </div>
  );
}
