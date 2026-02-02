import { Workspace } from '@/types';
import { MediaStatsCards } from './MediaStatsCards';
import { PhotographerRoster } from './PhotographerRoster';
import { PressCredentialManager } from './PressCredentialManager';
import { CoverageSchedule } from './CoverageSchedule';
import { MediaAssetGallery } from './MediaAssetGallery';
import { MediaQuickActions } from './MediaQuickActions';
import { DeliverableTracker } from './DeliverableTracker';
import { TaskSummaryCards } from '../TaskSummaryCards';
import { TeamMemberRoster } from '../TeamMemberRoster';
import { WorkspaceHierarchyMiniMap } from '../WorkspaceHierarchyMiniMap';
import { OverdueItemsWidget, EscalationRulesManager } from '../escalation';
import { useMediaCommitteeRealtime } from '@/hooks/useCommitteeRealtime';

interface MediaDashboardProps {
  workspace: Workspace;
  orgSlug?: string;
  onViewTasks: () => void;
}

export function MediaDashboard({
  workspace,
  orgSlug,
  onViewTasks,
}: MediaDashboardProps) {
  // Enable real-time updates for media committee data
  useMediaCommitteeRealtime({ workspaceId: workspace.id });

  // Mock stats - in production, fetch from database
  const stats = {
    photographers: 4,
    videographers: 2,
    pressCredentials: 12,
    mediaAssets: 248,
    coverageHours: 16,
    deliverables: 6,
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <MediaStatsCards
        photographers={stats.photographers}
        videographers={stats.videographers}
        pressCredentials={stats.pressCredentials}
        mediaAssets={stats.mediaAssets}
        coverageHours={stats.coverageHours}
        deliverables={stats.deliverables}
      />

      {/* Quick Actions */}
      <MediaQuickActions workspaceId={workspace.id} onViewTasks={onViewTasks} />


      {/* Task Summary with Mini-Map */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <TaskSummaryCards workspace={workspace} onViewTasks={onViewTasks} />
        </div>
        <WorkspaceHierarchyMiniMap
          workspaceId={workspace.id}
          eventId={workspace.eventId}
          orgSlug={orgSlug}
          orientation="vertical"
          showLabels={false}
        />
      </div>

      {/* Escalation & Overdue Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OverdueItemsWidget workspaceId={workspace.id} />
        <EscalationRulesManager workspaceId={workspace.id} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <CoverageSchedule workspaceId={workspace.id} />
          <MediaAssetGallery workspaceId={workspace.id} />
          <DeliverableTracker />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <PhotographerRoster workspaceId={workspace.id} />
          <PressCredentialManager workspaceId={workspace.id} />
        </div>
      </div>

      {/* Team Members */}
      <TeamMemberRoster workspace={workspace} showActions={false} maxMembers={6} />
    </div>
  );
}
