import { Workspace, WorkspaceRole } from '@/types';
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
import { RoleBasedActions } from '../RoleBasedActions';

interface MediaDashboardProps {
  workspace: Workspace;
  orgSlug?: string;
  userRole?: WorkspaceRole | null;
  onViewTasks: () => void;
  onDelegateRole?: () => void;
  onInviteMember?: () => void;
  onRequestBudget?: () => void;
  onRequestResource?: () => void;
}

export function MediaDashboard({
  workspace,
  orgSlug,
  userRole,
  onViewTasks,
  onDelegateRole,
  onInviteMember,
  onRequestBudget,
  onRequestResource,
}: MediaDashboardProps) {
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

      {/* Role-Based Actions */}
      <RoleBasedActions
        workspace={workspace}
        userRole={userRole || null}
        onDelegateRole={onDelegateRole}
        onInviteMember={onInviteMember}
        onRequestBudget={onRequestBudget}
        onRequestResource={onRequestResource}
      />

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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <CoverageSchedule />
          <MediaAssetGallery workspaceId={workspace.id} />
          <DeliverableTracker />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <PhotographerRoster />
          <PressCredentialManager />
        </div>
      </div>

      {/* Team Members */}
      <TeamMemberRoster workspace={workspace} showActions={false} maxMembers={6} />
    </div>
  );
}
