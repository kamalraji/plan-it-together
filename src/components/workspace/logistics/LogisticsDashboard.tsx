import { Workspace } from '@/types';
import { CommitteeHeaderCard } from '../committee/CommitteeHeaderCard';
import { TaskSummaryCards } from '../TaskSummaryCards';
import { WorkspaceHierarchyMiniMap } from '../WorkspaceHierarchyMiniMap';
import { MilestoneTimeline, GoalTracker, BudgetRequestForm, ResourceRequestForm, ResourceRequestsList } from '../committee';
import { BudgetTrackerConnected } from '../department/BudgetTrackerConnected';
import { TeamMemberRoster } from '../TeamMemberRoster';
import { useWorkspaceBudget } from '@/hooks/useWorkspaceBudget';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LogisticsStatsCards } from './LogisticsStatsCards';
import { ShipmentTracker } from './ShipmentTracker';
import { EquipmentManager } from './EquipmentManager';
import { TransportSchedule } from './TransportSchedule';
import { VenueLogistics } from './VenueLogistics';

interface LogisticsDashboardProps {
  workspace: Workspace;
  orgSlug?: string;
  onViewTasks: () => void;
}

export function LogisticsDashboard({
  workspace,
  orgSlug,
  onViewTasks,
}: LogisticsDashboardProps) {
  const { isLoading: isBudgetLoading } = useWorkspaceBudget(workspace.id);

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['logistics-team-members', workspace.id],
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

  const { data: tasks = [] } = useQuery({
    queryKey: ['logistics-tasks', workspace.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_tasks')
        .select('id, status')
        .eq('workspace_id', workspace.id);
      if (error) throw error;
      return data;
    },
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['logistics-teams', workspace.id],
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

      {/* Stats Overview */}
      <LogisticsStatsCards workspaceId={workspace.id} />

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

      {/* Main Logistics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ShipmentTracker workspaceId={workspace.id} />
        <EquipmentManager workspaceId={workspace.id} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TransportSchedule workspaceId={workspace.id} />
        <VenueLogistics workspaceId={workspace.id} />
      </div>

      {/* Milestones and Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MilestoneTimeline workspaceId={workspace.id} />
        <GoalTracker workspaceId={workspace.id} />
      </div>

      {/* Budget */}
      {!isBudgetLoading && (
        <BudgetTrackerConnected workspaceId={workspace.id} showBreakdown={false} />
      )}

      {/* Resource Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <BudgetRequestForm
            workspaceId={workspace.id}
            parentWorkspaceId={workspace.parentWorkspaceId || null}
          />
          <ResourceRequestForm
            workspaceId={workspace.id}
            parentWorkspaceId={workspace.parentWorkspaceId || null}
          />
        </div>
        <ResourceRequestsList workspaceId={workspace.id} />
      </div>

      {/* Team Members */}
      <TeamMemberRoster workspace={workspace} showActions={false} maxMembers={6} />
    </div>
  );
}
