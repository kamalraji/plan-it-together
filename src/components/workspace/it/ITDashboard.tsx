import { Workspace } from '@/types';
import { ITStatsCards } from './ITStatsCards';
import { ITQuickActions } from './ITQuickActions';
import { SystemHealthMonitor } from './SystemHealthMonitor';
import { HelpdeskTickets } from './HelpdeskTickets';
import { SecurityAlerts } from './SecurityAlerts';
import { AccessManagement } from './AccessManagement';
import { SoftwareLicenses } from './SoftwareLicenses';
import { WorkspaceHierarchyMiniMap } from '../WorkspaceHierarchyMiniMap';
import { TeamMemberRoster } from '../TeamMemberRoster';
import { useITDashboardData } from '@/hooks/useITDashboardData';

interface ITDashboardProps {
  workspace: Workspace;
  orgSlug?: string;
  onViewTasks: () => void;
}

export function ITDashboard({
  workspace,
  orgSlug,
  onViewTasks: _onViewTasks,
}: ITDashboardProps) {
  const { accessRequests, systems, securityAlerts, stats, isLoading } = useITDashboardData(workspace.id);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Overview - connected to real data */}
      <ITStatsCards stats={stats} isLoading={isLoading} />

      {/* Quick Actions - touch-friendly on mobile */}
      <div className="touch-pan-x">
        <ITQuickActions />
      </div>

      {/* Main Grid with Mini-Map - improved responsive breakpoints */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
        {/* Main content area - full width on mobile/tablet, 3 cols on xl */}
        <div className="xl:col-span-3 space-y-4 sm:space-y-6">
          {/* System Health & Security - stack on mobile, side-by-side on sm+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <SystemHealthMonitor systems={systems} isLoading={isLoading} />
            <SecurityAlerts alerts={securityAlerts} isLoading={isLoading} />
          </div>

          {/* Helpdesk & Access Management */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <HelpdeskTickets workspaceId={workspace.id} eventId={workspace.eventId} />
            <AccessManagement requests={accessRequests} isLoading={isLoading} />
          </div>
        </div>

        {/* Right Sidebar - moves to bottom on mobile, shown as horizontal row on tablet */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4 sm:gap-6">
          <WorkspaceHierarchyMiniMap
            workspaceId={workspace.id}
            eventId={workspace.eventId}
            orgSlug={orgSlug}
            orientation="vertical"
            showLabels={false}
          />
          <SoftwareLicenses workspaceId={workspace.id} eventId={workspace.eventId} />
        </div>
      </div>

      {/* Team Members - responsive max display */}
      <TeamMemberRoster 
        workspace={workspace} 
        showActions={false} 
        maxMembers={6} 
      />
    </div>
  );
}
