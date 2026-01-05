import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Workspace } from '@/types';
import { MilestoneTimeline } from './MilestoneTimeline';
import { GoalTracker } from './GoalTracker';
import { CommitteeChecklist } from './CommitteeChecklist';
import { CommitteeHeaderCard } from './CommitteeHeaderCard';
import { BudgetRequestForm } from './BudgetRequestForm';
import { ResourceRequestForm } from './ResourceRequestForm';
import { ResourceRequestsList } from './ResourceRequestsList';
import { TaskSummaryCards } from '../TaskSummaryCards';
import { TeamMemberRoster } from '../TeamMemberRoster';
import { WorkspaceHierarchyMiniMap } from '../WorkspaceHierarchyMiniMap';
import { useWorkspaceBudget } from '@/hooks/useWorkspaceBudget';
import { BudgetTrackerConnected } from '../department/BudgetTrackerConnected';

interface CommitteeDashboardProps {
  workspace: Workspace;
  orgSlug?: string;
  onViewTasks: () => void;
}

export function CommitteeDashboard({ workspace, orgSlug, onViewTasks }: CommitteeDashboardProps) {
  const { isLoading: isBudgetLoading } = useWorkspaceBudget(workspace.id);

  // Extract committee type from workspace name
  const committeeType = workspace.name
    .toLowerCase()
    .replace(/\s+committee$/i, '')
    .trim();

  // Fetch team members count
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['committee-team-members', workspace.id],
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
    queryKey: ['committee-tasks', workspace.id],
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
    queryKey: ['committee-teams', workspace.id],
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
          <MilestoneTimeline workspaceId={workspace.id} />
          <GoalTracker workspaceId={workspace.id} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <CommitteeChecklist workspaceId={workspace.id} committeeType={committeeType} />
          
          {/* Budget Section */}
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
      </div>

      {/* Resource Requests Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
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
