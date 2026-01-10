import { Workspace, WorkspaceRole } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CommitteeHeaderCard } from '../committee/CommitteeHeaderCard';
import { RoleBasedActions } from '../RoleBasedActions';
import { TaskSummaryCards } from '../TaskSummaryCards';
import { WorkspaceHierarchyMiniMap } from '../WorkspaceHierarchyMiniMap';
import { TeamMemberRoster } from '../TeamMemberRoster';
import { MarketingStatsCards } from './MarketingStatsCards';
import { CampaignTracker } from './CampaignTracker';
import { AdPerformancePanel } from './AdPerformancePanel';
import { BrandingAssetsManager } from './BrandingAssetsManager';
import { MarketingCalendar } from './MarketingCalendar';
import { MarketingQuickActions } from './MarketingQuickActions';
import { AudienceInsights } from './AudienceInsights';

interface MarketingDashboardProps {
  workspace: Workspace;
  orgSlug?: string;
  userRole?: WorkspaceRole | null;
  onViewTasks: () => void;
  onDelegateRole?: () => void;
  onInviteMember?: () => void;
  onRequestBudget?: () => void;
  onRequestResource?: () => void;
}

export function MarketingDashboard({
  workspace,
  orgSlug,
  userRole,
  onViewTasks,
  onDelegateRole,
  onInviteMember,
  onRequestBudget,
  onRequestResource,
}: MarketingDashboardProps) {
  // Fetch team members count
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['marketing-team-members', workspace.id],
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
    queryKey: ['marketing-tasks', workspace.id],
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
    queryKey: ['marketing-teams', workspace.id],
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

      {/* Marketing Stats */}
      <MarketingStatsCards
        activeCampaigns={5}
        totalReach={45200}
        conversionRate={3.8}
        adSpend={8500}
      />

      {/* Role-Based Actions */}
      <RoleBasedActions
        workspace={workspace}
        userRole={userRole || null}
        onDelegateRole={onDelegateRole}
        onInviteMember={onInviteMember}
        onRequestBudget={onRequestBudget}
        onRequestResource={onRequestResource}
      />

      {/* Quick Actions and Campaign Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MarketingQuickActions />
        <div className="lg:col-span-2">
          <CampaignTracker />
        </div>
      </div>

      {/* Marketing Calendar - Full Width */}
      <MarketingCalendar />

      {/* Ad Performance */}
      <AdPerformancePanel />

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

      {/* Audience Insights and Branding Assets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AudienceInsights />
        <BrandingAssetsManager />
      </div>

      {/* Team Members */}
      <TeamMemberRoster workspace={workspace} showActions={false} maxMembers={6} />
    </div>
  );
}
