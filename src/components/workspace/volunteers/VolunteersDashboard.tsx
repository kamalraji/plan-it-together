import { Workspace } from '@/types';
import { CommitteeHeaderCard } from '../committee/CommitteeHeaderCard';
import { TaskSummaryCards } from '../TaskSummaryCards';
import { WorkspaceHierarchyMiniMap } from '../WorkspaceHierarchyMiniMap';
import { TeamMemberRoster } from '../TeamMemberRoster';
import { MilestoneTimeline } from '../committee/MilestoneTimeline';
import { GoalTracker } from '../committee/GoalTracker';
import { BudgetTrackerConnected } from '../department/BudgetTrackerConnected';
import { BudgetRequestForm } from '../committee/BudgetRequestForm';
import { ResourceRequestForm } from '../committee/ResourceRequestForm';
import { VolunteerShiftScheduler } from './VolunteerShiftScheduler';
import { VolunteerRoster } from './VolunteerRoster';
import { VolunteerCheckInStats } from './VolunteerCheckInStats';
import { VolunteerStatsCards } from './VolunteerStatsCards';
import { VolunteerTrainingTracker } from './VolunteerTrainingTracker';
import { VolunteerPerformanceCard } from './VolunteerPerformanceCard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspaceBudget } from '@/hooks/useWorkspaceBudget';

interface VolunteersDashboardProps {
  workspace: Workspace;
  orgSlug?: string;
  onViewTasks: () => void;
}

export function VolunteersDashboard({
  workspace,
  orgSlug,
  onViewTasks,
}: VolunteersDashboardProps) {
  const { isLoading: isBudgetLoading } = useWorkspaceBudget(workspace.id);

  // Fetch team members count
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['volunteers-team-members', workspace.id],
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
    queryKey: ['volunteers-tasks', workspace.id],
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
    queryKey: ['volunteers-teams', workspace.id],
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
      {/* Volunteers Header */}
      <CommitteeHeaderCard
        workspaceName={workspace.name}
        memberCount={teamMembers.length}
        tasksCompleted={tasksCompleted}
        tasksTotal={tasks.length}
        teamsCount={teams.length}
      />

      {/* Volunteer Stats Cards */}
      <VolunteerStatsCards workspaceId={workspace.id} />

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

      {/* Volunteer-Specific Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Shift Scheduler & Training */}
        <div className="lg:col-span-2 space-y-6">
          <VolunteerShiftScheduler workspaceId={workspace.id} />
          <VolunteerTrainingTracker workspaceId={workspace.id} />
        </div>

        {/* Right Column - Check-In Stats */}
        <div className="space-y-6">
          <VolunteerCheckInStats workspaceId={workspace.id} />
        </div>
      </div>

      {/* Volunteer Roster & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <VolunteerRoster workspaceId={workspace.id} />
        </div>
        <VolunteerPerformanceCard workspaceId={workspace.id} />
      </div>

      {/* Goals & Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MilestoneTimeline workspaceId={workspace.id} />
        <GoalTracker workspaceId={workspace.id} />
      </div>

      {/* Budget & Resource Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {!isBudgetLoading && (
          <BudgetTrackerConnected
            workspaceId={workspace.id}
            showBreakdown={false}
          />
        )}
        <div className="space-y-6">
          <BudgetRequestForm
            workspaceId={workspace.id}
            parentWorkspaceId={workspace.parentWorkspaceId || null}
          />
          <ResourceRequestForm
            workspaceId={workspace.id}
            parentWorkspaceId={workspace.parentWorkspaceId || null}
          />
        </div>
      </div>

      {/* Team Members */}
      <TeamMemberRoster workspace={workspace} showActions={false} maxMembers={6} />
    </div>
  );
}
