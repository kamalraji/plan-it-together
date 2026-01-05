import { Workspace, WorkspaceRole } from '@/types';
import { ITStatsCards } from './ITStatsCards';
import { ITQuickActions } from './ITQuickActions';
import { SystemHealthMonitor } from './SystemHealthMonitor';
import { HelpdeskTickets } from './HelpdeskTickets';
import { SecurityAlerts } from './SecurityAlerts';
import { AccessManagement } from './AccessManagement';
import { SoftwareLicenses } from './SoftwareLicenses';
import { WorkspaceHierarchyMiniMap } from '../WorkspaceHierarchyMiniMap';
import { RoleBasedActions } from '../RoleBasedActions';
import { TeamMemberRoster } from '../TeamMemberRoster';

interface ITDashboardProps {
  workspace: Workspace;
  orgSlug?: string;
  userRole?: WorkspaceRole | null;
  onViewTasks: () => void;
  onDelegateRole?: () => void;
  onInviteMember?: () => void;
  onRequestBudget?: () => void;
  onRequestResource?: () => void;
}

export function ITDashboard({
  workspace,
  orgSlug,
  userRole,
  onViewTasks: _onViewTasks,
  onDelegateRole,
  onInviteMember,
  onRequestBudget,
  onRequestResource,
}: ITDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <ITStatsCards />

      {/* Quick Actions */}
      <ITQuickActions />

      {/* Role-Based Actions */}
      <RoleBasedActions
        workspace={workspace}
        userRole={userRole || null}
        onDelegateRole={onDelegateRole}
        onInviteMember={onInviteMember}
        onRequestBudget={onRequestBudget}
        onRequestResource={onRequestResource}
      />

      {/* Main Grid with Mini-Map */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {/* System Health & Security */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SystemHealthMonitor />
            <SecurityAlerts />
          </div>

          {/* Helpdesk & Access Management */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <HelpdeskTickets />
            <AccessManagement />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <WorkspaceHierarchyMiniMap
            workspaceId={workspace.id}
            eventId={workspace.eventId}
            orgSlug={orgSlug}
            orientation="vertical"
            showLabels={false}
          />
          <SoftwareLicenses />
        </div>
      </div>

      {/* Team Members */}
      <TeamMemberRoster workspace={workspace} showActions={false} maxMembers={6} />
    </div>
  );
}
