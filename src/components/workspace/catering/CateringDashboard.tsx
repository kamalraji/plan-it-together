import { Workspace } from '@/types';
import { CommitteeHeaderCard } from '../committee/CommitteeHeaderCard';
import { TaskSummaryCards } from '../TaskSummaryCards';
import { WorkspaceHierarchyMiniMap } from '../WorkspaceHierarchyMiniMap';
import { TeamMemberRoster } from '../TeamMemberRoster';
import { MilestoneTimeline } from '../committee/MilestoneTimeline';
import { GoalTracker } from '../committee/GoalTracker';
import { BudgetTrackerConnected } from '../department/BudgetTrackerConnected';
import { BudgetRequestForm } from '../committee/BudgetRequestForm';
import { CateringStatsCards } from './CateringStatsCards';
import { MenuPlanner } from './MenuPlanner';
import { DietaryRequirementsTracker } from './DietaryRequirementsTracker';
import { VendorManagement } from './VendorManagement';
import { MealSchedule } from './MealSchedule';
import { InventoryTracker } from './InventoryTracker';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspaceBudget } from '@/hooks/useWorkspaceBudget';

interface CateringDashboardProps {
  workspace: Workspace;
  orgSlug?: string;
  onViewTasks: () => void;
}

export function CateringDashboard({
  workspace,
  orgSlug,
  onViewTasks,
}: CateringDashboardProps) {
  const { isLoading: isBudgetLoading } = useWorkspaceBudget(workspace.id);

  // Fetch team members count
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['catering-committee-team-members', workspace.id],
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
    queryKey: ['catering-committee-tasks', workspace.id],
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
    queryKey: ['catering-committee-teams', workspace.id],
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
      {/* Catering Committee Header */}
      <CommitteeHeaderCard
        workspaceName={workspace.name}
        memberCount={teamMembers.length}
        tasksCompleted={tasksCompleted}
        tasksTotal={tasks.length}
        teamsCount={teams.length}
      />


      {/* Catering Stats Overview */}
      <CateringStatsCards workspaceId={workspace.id} />

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

      {/* Main Catering Management Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Menu & Schedule */}
        <div className="lg:col-span-2 space-y-6">
          <MenuPlanner workspaceId={workspace.id} />
          <MealSchedule workspaceId={workspace.id} />
        </div>

        {/* Right Column - Dietary */}
        <div className="space-y-6">
          <DietaryRequirementsTracker workspaceId={workspace.id} />
        </div>
      </div>

      {/* Vendor & Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VendorManagement workspaceId={workspace.id} />
        <InventoryTracker workspaceId={workspace.id} />
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
