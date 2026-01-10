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
import { 
  AssignShiftsTab, 
  SendBriefTab, 
  CheckInVolunteerTab, 
  CreateTeamTab, 
  TrainingStatusTab, 
  PerformanceReviewTab,
  ViewCommitteesTab,
  ShiftOverviewTab,
  MassAnnouncementTab,
  HoursReportTab,
  ApproveTimesheetsTab,
  TrainingScheduleTab,
  RecognitionTab,
  RecruitmentTab,
} from './committee-tabs';
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
      </div>
    </WorkspaceLayout>
  );
}
