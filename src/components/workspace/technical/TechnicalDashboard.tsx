import { Workspace, WorkspaceRole } from '@/types';
import { TechnicalStatsCards } from './TechnicalStatsCards';
import { TechnicalQuickActions } from './TechnicalQuickActions';
import { EquipmentInventory } from './EquipmentInventory';
import { SupportTicketQueue } from './SupportTicketQueue';
import { NetworkStatus } from './NetworkStatus';
import { VenueSetupChecklist } from './VenueSetupChecklist';
import { WorkspaceHierarchyMiniMap } from '../WorkspaceHierarchyMiniMap';
import { RoleBasedActions } from '../RoleBasedActions';
import { TeamMemberRoster } from '../TeamMemberRoster';
import { MilestoneTimeline } from '../committee/MilestoneTimeline';

interface TechnicalDashboardProps {
  workspace: Workspace;
  orgSlug?: string;
  userRole?: WorkspaceRole | null;
  onViewTasks: () => void;
  onDelegateRole?: () => void;
  onInviteMember?: () => void;
  onRequestBudget?: () => void;
  onRequestResource?: () => void;
}

export function TechnicalDashboard({
  workspace,
  orgSlug,
  userRole,
  onViewTasks: _onViewTasks,
  onDelegateRole,
  onInviteMember,
  onRequestBudget,
  onRequestResource,
}: TechnicalDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <TechnicalStatsCards />

      {/* Quick Actions */}
      <TechnicalQuickActions />

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
          {/* Network Status & Support Tickets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <NetworkStatus />
            <SupportTicketQueue />
          </div>

          {/* Equipment & Setup Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EquipmentInventory />
            <VenueSetupChecklist />
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
          <MilestoneTimeline workspaceId={workspace.id} />
        </div>
      </div>

      {/* Team Members */}
      <TeamMemberRoster workspace={workspace} showActions={false} maxMembers={6} />
    </div>
  );
}
