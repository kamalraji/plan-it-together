import { lazy, Suspense } from 'react';
import { Workspace, WorkspaceRole, WorkspaceType, WorkspaceRoleScope } from '@/types';
import { WorkspaceTab } from '@/types/workspace-tabs';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load core tabs
const TaskManagementInterface = lazy(() => import('../TaskManagementInterface').then(m => ({ default: m.TaskManagementInterface })));
const TeamManagement = lazy(() => import('../TeamManagement').then(m => ({ default: m.TeamManagement })));
const WorkspaceCommunication = lazy(() => import('../WorkspaceCommunication').then(m => ({ default: m.WorkspaceCommunication })));
const WorkspaceAnalyticsDashboard = lazy(() => import('../WorkspaceAnalyticsDashboard').then(m => ({ default: m.WorkspaceAnalyticsDashboard })));
const WorkspaceReportExport = lazy(() => import('../WorkspaceReportExport').then(m => ({ default: m.WorkspaceReportExport })));
const WorkspaceTemplateManagement = lazy(() => import('../WorkspaceTemplateManagement').then(m => ({ default: m.WorkspaceTemplateManagement })));
const WorkspaceAuditLog = lazy(() => import('../WorkspaceAuditLog').then(m => ({ default: m.WorkspaceAuditLog })));
const WorkspaceSettingsContent = lazy(() => import('../WorkspaceSettingsContent').then(m => ({ default: m.WorkspaceSettingsContent })));

// Lazy load dashboard types
const RootDashboard = lazy(() => import('../root').then(m => ({ default: m.RootDashboard })));
const DepartmentDashboard = lazy(() => import('../department').then(m => ({ default: m.DepartmentDashboard })));
const CommitteeDashboard = lazy(() => import('../committee').then(m => ({ default: m.CommitteeDashboard })));
const TeamDashboard = lazy(() => import('../team').then(m => ({ default: m.TeamDashboard })));

// Lazy load other core components
const EventMarketplaceIntegration = lazy(() => import('@/components/marketplace').then(m => ({ default: m.EventMarketplaceIntegration })));
const RoleBasedActions = lazy(() => import('../RoleBasedActions').then(m => ({ default: m.RoleBasedActions })));
const WorkspaceRoleAssignment = lazy(() => import('../WorkspaceRoleAssignment').then(m => ({ default: m.WorkspaceRoleAssignment })));
const WorkspaceRoleAnalytics = lazy(() => import('../WorkspaceRoleAnalytics').then(m => ({ default: m.WorkspaceRoleAnalytics })));
const EventSettingsTabContent = lazy(() => import('../event-settings').then(m => ({ default: m.EventSettingsTabContent })));
const ApprovalsTabContent = lazy(() => import('../approvals').then(m => ({ default: m.ApprovalsTabContent })));
const ChecklistsTabContent = lazy(() => import('../checklists').then(m => ({ default: m.ChecklistsTabContent })));
const MemberDirectoryPage = lazy(() => import('../MemberDirectoryPage').then(m => ({ default: m.MemberDirectoryPage })));
const WorkspaceManagementTab = lazy(() => import('./WorkspaceManagementTab').then(m => ({ default: m.WorkspaceManagementTab })));
const PageBuilderTab = lazy(() => import('./PageBuilderTab').then(m => ({ default: m.PageBuilderTab })));

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

interface WorkspaceTabRouterProps {
  workspace: Workspace;
  activeTab: WorkspaceTab;
  orgSlug?: string;
  tasks: any[];
  teamMembers: any[];
  isTasksLoading: boolean;
  taskIdFromUrl?: string | null;
  activeRoleSpace: WorkspaceRoleScope;
  permissions: {
    currentMember?: { role: string } | null;
    canManageTasks: boolean;
    canInviteMembers: boolean;
    canManageSettings: boolean;
    isGlobalWorkspaceManager: boolean;
  };
  actions: {
    setActiveTab: (tab: WorkspaceTab) => void;
    handleInviteTeamMember: () => void;
    handleManageSettings: () => void;
    handleViewTasks: () => void;
    handleTaskDelete: (taskId: string) => void;
    handleTaskStatusChange: (taskId: string, status: any) => void;
    setShowSubWorkspaceModal: (show: boolean) => void;
  };
}

export function WorkspaceTabRouter({
  workspace,
  activeTab,
  orgSlug,
  tasks,
  teamMembers,
  isTasksLoading,
  taskIdFromUrl,
  activeRoleSpace,
  permissions,
  actions,
}: WorkspaceTabRouterProps) {
  // Overview tab - render workspace-type-specific dashboard
  if (activeTab === 'overview') {
    return (
      <Suspense fallback={<TabSkeleton />}>
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
            onRequestBudget={() => {
              const el = document.getElementById('budget');
              el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            onRequestResource={() => {
              const el = document.getElementById('resources');
              el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          />
        ) : workspace.workspaceType === WorkspaceType.TEAM ? (
          <TeamDashboard 
            workspace={workspace} 
            orgSlug={orgSlug}
            userRole={permissions.currentMember?.role as WorkspaceRole}
            onViewTasks={actions.handleViewTasks}
            onLogHours={() => {
              const el = document.getElementById('time-tracking');
              el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            onSubmitForApproval={() => {
              const el = document.getElementById('time-tracking');
              el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          />
        ) : (
          <RootDashboard 
            workspace={workspace} 
            orgSlug={orgSlug}
            userRole={permissions.currentMember?.role as WorkspaceRole}
            onDelegateRole={() => actions.setActiveTab('role-management')}
            onInviteMember={permissions.canInviteMembers ? actions.handleInviteTeamMember : undefined}
            onManageSettings={permissions.canManageSettings ? actions.handleManageSettings : undefined}
          />
        )}
      </Suspense>
    );
  }

  // Core tabs
  if (activeTab === 'tasks') {
    return (
      <Suspense fallback={<TabSkeleton />}>
        <div className="bg-card rounded-lg shadow-sm border border-border p-3 sm:p-6">
          <TaskManagementInterface
            tasks={tasks}
            teamMembers={teamMembers}
            workspaceId={workspace.id}
            roleScope={activeRoleSpace}
            onTaskEdit={() => {}}
            onTaskDelete={actions.handleTaskDelete}
            onTaskStatusChange={actions.handleTaskStatusChange}
            isLoading={isTasksLoading}
            initialTaskId={taskIdFromUrl ?? undefined}
          />
        </div>
      </Suspense>
    );
  }

  if (activeTab === 'marketplace' && workspace.event) {
    return (
      <Suspense fallback={<TabSkeleton />}>
        <EventMarketplaceIntegration eventId={workspace.event.id} eventName={workspace.event.name} />
      </Suspense>
    );
  }

  if (activeTab === 'team') {
    return (
      <Suspense fallback={<TabSkeleton />}>
        <TeamManagement workspace={workspace} roleScope={activeRoleSpace} />
      </Suspense>
    );
  }

  if (activeTab === 'communication') {
    return (
      <Suspense fallback={<TabSkeleton />}>
        <WorkspaceCommunication
          workspaceId={workspace.id}
          teamMembers={teamMembers}
          roleScope={activeRoleSpace}
        />
      </Suspense>
    );
  }

  if (activeTab === 'analytics') {
    return (
      <Suspense fallback={<TabSkeleton />}>
        <WorkspaceAnalyticsDashboard workspace={workspace} roleScope={activeRoleSpace} />
      </Suspense>
    );
  }

  if (activeTab === 'reports') {
    return (
      <Suspense fallback={<TabSkeleton />}>
        <WorkspaceReportExport workspace={workspace} teamMembers={teamMembers} />
      </Suspense>
    );
  }

  if (activeTab === 'templates') {
    return (
      <Suspense fallback={<TabSkeleton />}>
        <WorkspaceTemplateManagement
          workspaceId={workspace.id}
          mode="library"
          onTemplateApplied={() => {}}
          onTemplateCreated={() => {}}
        />
      </Suspense>
    );
  }

  if (activeTab === 'audit') {
    return (
      <Suspense fallback={<TabSkeleton />}>
        <WorkspaceAuditLog workspace={workspace} teamMembers={teamMembers} />
      </Suspense>
    );
  }

  if (activeTab === 'role-management') {
    return (
      <Suspense fallback={<TabSkeleton />}>
        <div className="space-y-6">
          <RoleBasedActions
            workspace={workspace}
            userRole={permissions.currentMember?.role as WorkspaceRole || null}
            onDelegateRole={() => {}}
            onInviteMember={permissions.canInviteMembers ? actions.handleInviteTeamMember : undefined}
            onManageSettings={permissions.canManageSettings ? actions.handleManageSettings : undefined}
            onViewReport={() => {}}
          />
          <WorkspaceRoleAssignment
            workspaceId={workspace.id}
            teamMembers={teamMembers}
            currentUserRole={permissions.currentMember?.role as WorkspaceRole}
            isGlobalManager={permissions.isGlobalWorkspaceManager}
          />
          <WorkspaceRoleAnalytics workspace={workspace} />
        </div>
      </Suspense>
    );
  }

  if (activeTab === 'settings') {
    return (
      <Suspense fallback={<TabSkeleton />}>
        <WorkspaceSettingsContent
          workspace={workspace}
          teamMembers={teamMembers}
          canManageSettings={permissions.canManageSettings}
          currentUserRole={permissions.currentMember?.role as WorkspaceRole}
        />
      </Suspense>
    );
  }

  if (activeTab === 'event-settings' && workspace.eventId) {
    return (
      <Suspense fallback={<TabSkeleton />}>
        <EventSettingsTabContent
          workspace={workspace}
          userRole={permissions.currentMember?.role as WorkspaceRole}
        />
      </Suspense>
    );
  }

  if (activeTab === 'approvals') {
    return (
      <Suspense fallback={<TabSkeleton />}>
        <ApprovalsTabContent
          workspace={workspace}
          userRole={permissions.currentMember?.role as WorkspaceRole}
        />
      </Suspense>
    );
  }

  if (activeTab === 'checklists') {
    return (
      <Suspense fallback={<TabSkeleton />}>
        <ChecklistsTabContent workspace={workspace} />
      </Suspense>
    );
  }

  if (activeTab === 'directory' && workspace.eventId) {
    return (
      <Suspense fallback={<TabSkeleton />}>
        <MemberDirectoryPage eventId={workspace.eventId} />
      </Suspense>
    );
  }

  if (activeTab === 'page-builder') {
    return (
      <Suspense fallback={<TabSkeleton />}>
        <PageBuilderTab workspace={workspace} />
      </Suspense>
    );
  }

  if (activeTab === 'workspace-management' && workspace.workspaceType === WorkspaceType.ROOT) {
    return (
      <Suspense fallback={<TabSkeleton />}>
        <WorkspaceManagementTab 
          workspace={workspace} 
          orgSlug={orgSlug}
          onCreateSubWorkspace={() => actions.setShowSubWorkspaceModal(true)}
        />
      </Suspense>
    );
  }

  // Dynamic committee/department tabs are handled by specialized routers
  return null;
}
