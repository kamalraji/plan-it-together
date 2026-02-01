import { Workspace } from '@/types';
import { CommitteeHeaderCard } from '../committee/CommitteeHeaderCard';
import { TaskSummaryCards } from '../TaskSummaryCards';
import { WorkspaceHierarchyMiniMap } from '../WorkspaceHierarchyMiniMap';
import { TeamMemberRoster } from '../TeamMemberRoster';
import { MilestoneTimeline } from '../committee/MilestoneTimeline';
import { GoalTracker } from '../committee/GoalTracker';
import { BudgetTrackerConnected } from '../department/BudgetTrackerConnected';
import { BudgetRequestForm } from '../committee/BudgetRequestForm';
import { EventStatsCards } from './EventStatsCards';
import { EventScheduleManager } from './EventScheduleManager';
import { VIPGuestTracker } from './VIPGuestTracker';
import { RunOfShowChecklist } from './RunOfShowChecklist';
import { VenueBriefing } from './VenueBriefing';
import { EventTimeline } from './EventTimeline';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspaceBudget } from '@/hooks/useWorkspaceBudget';

interface EventDashboardProps {
  workspace: Workspace;
  orgSlug?: string;
  onViewTasks: () => void;
}

export function EventDashboard({
  workspace,
  orgSlug,
  onViewTasks,
}: EventDashboardProps) {
  const { isLoading: isBudgetLoading } = useWorkspaceBudget(workspace.id);

  // Fetch team members count
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['event-committee-team-members', workspace.id],
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
    queryKey: ['event-committee-tasks', workspace.id],
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
    queryKey: ['event-committee-teams', workspace.id],
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
      {/* Event Committee Header */}
      <CommitteeHeaderCard
        workspaceName={workspace.name}
        memberCount={teamMembers.length}
        tasksCompleted={tasksCompleted}
        tasksTotal={tasks.length}
        teamsCount={teams.length}
      />

      {/* Event Stats Overview */}
      <EventStatsCards workspaceId={workspace.id} />

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

      {/* Main Event Management Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Schedule & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <EventScheduleManager workspaceId={workspace.id} />
          <VenueBriefing workspaceId={workspace.id} />
        </div>

        {/* Right Column - VIP */}
        <div className="space-y-6">
          <VIPGuestTracker workspaceId={workspace.id} />
        </div>
      </div>

      {/* Run of Show & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RunOfShowChecklist workspaceId={workspace.id} />
        <EventTimeline workspaceId={workspace.id} />
      </div>

      {/* Goals & Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MilestoneTimeline workspaceId={workspace.id} />
        <GoalTracker workspaceId={workspace.id} />
      </div>

      {/* Budget Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {!isBudgetLoading && (
          <BudgetTrackerConnected
            workspaceId={workspace.id}
            showBreakdown={false}
          />
        )}
        <BudgetRequestForm
          workspaceId={workspace.id}
          parentWorkspaceId={workspace.parentWorkspaceId || null}
        />
      </div>

      {/* Team Members */}
      <TeamMemberRoster workspace={workspace} showActions={false} maxMembers={6} />
    </div>
  );
}
