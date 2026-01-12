import { Workspace, WorkspaceRole } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CommitteeHeaderCard } from '../committee/CommitteeHeaderCard';
import { RoleBasedActions } from '../RoleBasedActions';
import { TaskSummaryCards } from '../TaskSummaryCards';
import { WorkspaceHierarchyMiniMap } from '../WorkspaceHierarchyMiniMap';
import { TeamMemberRoster } from '../TeamMemberRoster';
import { ContentStatsCards } from './ContentStatsCards';
import { ContentCalendar } from './ContentCalendar';
import { SocialMediaTracker } from './SocialMediaTracker';
import { MediaAssetsLibrary } from './MediaAssetsLibrary';
import { BlogArticleTracker } from './BlogArticleTracker';
import { PageBuilderStatusCard } from './PageBuilderStatusCard';
import { PublicationPipeline } from './PublicationPipeline';

interface ContentDashboardProps {
  workspace: Workspace;
  orgSlug?: string;
  userRole?: WorkspaceRole | null;
  onViewTasks: () => void;
  onDelegateRole?: () => void;
  onInviteMember?: () => void;
  onRequestBudget?: () => void;
  onRequestResource?: () => void;
}

export function ContentDashboard({
  workspace,
  orgSlug,
  userRole,
  onViewTasks,
  onDelegateRole,
  onInviteMember,
  onRequestBudget,
  onRequestResource,
}: ContentDashboardProps) {
  // Fetch team members count
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['content-team-members', workspace.id],
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
    queryKey: ['content-tasks', workspace.id],
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
    queryKey: ['content-teams', workspace.id],
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
      {/* Committee Header */}
      <CommitteeHeaderCard
        workspaceName={workspace.name}
        memberCount={teamMembers.length}
        tasksCompleted={tasksCompleted}
        tasksTotal={tasks.length}
        teamsCount={teams.length}
      />

      {/* Content Stats */}
      <ContentStatsCards
        publishedPosts={24}
        scheduledPosts={8}
        mediaAssets={156}
        socialReach={12500}
      />

      {/* Page Builder Status */}
      <PageBuilderStatusCard workspaceId={workspace.id} eventId={workspace.eventId} />

      {/* Role-Based Actions */}
      <RoleBasedActions
        workspace={workspace}
        userRole={userRole || null}
        onDelegateRole={onDelegateRole}
        onInviteMember={onInviteMember}
        onRequestBudget={onRequestBudget}
        onRequestResource={onRequestResource}
      />

      {/* Social Media */}
      <SocialMediaTracker />

      {/* Content Calendar - Full Width */}
      <ContentCalendar />

      {/* Publication Pipeline */}
      <PublicationPipeline />

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

      {/* Blog Articles and Media Library */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BlogArticleTracker />
        <MediaAssetsLibrary />
      </div>

      {/* Team Members */}
      <TeamMemberRoster workspace={workspace} showActions={false} maxMembers={6} />
    </div>
  );
}
