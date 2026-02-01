import { Workspace } from '@/types';
import { SocialMediaStatsCards } from './SocialMediaStatsCards';
import { PlatformManager } from './PlatformManager';
import { ContentCalendar } from './ContentCalendar';
import { EngagementTracker } from './EngagementTracker';
import { HashtagTracker } from './HashtagTracker';
import { InfluencerTracker } from './InfluencerTracker';
import { SocialMediaQuickActions } from './SocialMediaQuickActions';
import { ContentLibrary } from './ContentLibrary';
import { CommitteeHeaderCard } from '../committee/CommitteeHeaderCard';
import { TaskSummaryCards } from '../TaskSummaryCards';
import { WorkspaceHierarchyMiniMap } from '../WorkspaceHierarchyMiniMap';
import { TeamMemberRoster } from '../TeamMemberRoster';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SocialMediaDashboardProps {
  workspace: Workspace;
  orgSlug?: string;
  onViewTasks: () => void;
}

export function SocialMediaDashboard({
  workspace,
  orgSlug,
  onViewTasks,
}: SocialMediaDashboardProps) {
  // Fetch team members count
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['social-media-team-members', workspace.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_team_members')
        .select('id')
        .eq('workspace_id', workspace.id)
        .eq('status', 'ACTIVE');
      if (error) throw error;
      return data;
    },
  });

  // Fetch tasks for progress
  const { data: tasks = [] } = useQuery({
    queryKey: ['social-media-tasks', workspace.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_tasks')
        .select('id, status')
        .eq('workspace_id', workspace.id);
      if (error) throw error;
      return data;
    },
  });

  // Fetch child teams count
  const { data: teams = [] } = useQuery({
    queryKey: ['social-media-teams', workspace.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id')
        .eq('parent_workspace_id', workspace.id)
        .eq('workspace_type', 'TEAM');
      if (error) throw error;
      return data;
    },
  });

  const tasksCompleted = tasks.filter(t => t.status === 'DONE').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <CommitteeHeaderCard
        workspaceName={workspace.name}
        memberCount={teamMembers.length}
        tasksCompleted={tasksCompleted}
        tasksTotal={tasks.length}
        teamsCount={teams.length}
      />


      {/* Stats Cards */}
      <SocialMediaStatsCards />

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

      {/* Quick Actions */}
      <SocialMediaQuickActions />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <PlatformManager />
          <ContentCalendar />
          <HashtagTracker />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <EngagementTracker />
          <InfluencerTracker />
          <ContentLibrary />
        </div>
      </div>

      {/* Team Roster */}
      <TeamMemberRoster workspace={workspace} />
    </div>
  );
}
