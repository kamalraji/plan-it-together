import { Workspace } from '@/types';
import { TechnicalStatsCards } from './TechnicalStatsCards';
import { TechnicalQuickActions } from './TechnicalQuickActions';
import { EquipmentInventory } from './EquipmentInventory';
import { SupportTicketQueue } from './SupportTicketQueue';
import { NetworkStatus } from './NetworkStatus';
import { VenueSetupChecklist } from './VenueSetupChecklist';
import { WorkspaceHierarchyMiniMap } from '../WorkspaceHierarchyMiniMap';
import { TeamMemberRoster } from '../TeamMemberRoster';
import { MilestoneTimeline } from '../committee/MilestoneTimeline';

interface TechnicalDashboardProps {
  workspace: Workspace;
  orgSlug?: string;
}

export function TechnicalDashboard({
  workspace,
  orgSlug,
}: TechnicalDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <TechnicalStatsCards />

      {/* Quick Actions */}
      <TechnicalQuickActions />


      {/* Main Grid with Mini-Map */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {/* Network Status & Support Tickets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <NetworkStatus workspaceId={workspace.id} />
            <SupportTicketQueue workspaceId={workspace.id} eventId={workspace.eventId} />
          </div>

          {/* Equipment & Setup Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EquipmentInventory />
            <VenueSetupChecklist workspaceId={workspace.id} eventId={workspace.eventId} />
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
