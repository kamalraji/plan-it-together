import { Workspace } from '@/types';
import { MilestoneTimeline } from './MilestoneTimeline';
import { GoalTracker } from './GoalTracker';
import { CommitteeChecklist } from './CommitteeChecklist';
import { BudgetRequestForm } from './BudgetRequestForm';
import { TaskSummaryCards } from '../TaskSummaryCards';
import { TeamMemberRoster } from '../TeamMemberRoster';
import { useWorkspaceBudget } from '@/hooks/useWorkspaceBudget';
import { BudgetTrackerConnected } from '../department/BudgetTrackerConnected';

interface CommitteeDashboardProps {
  workspace: Workspace;
  onViewTasks: () => void;
}

export function CommitteeDashboard({ workspace, onViewTasks }: CommitteeDashboardProps) {
  const { isLoading: isBudgetLoading } = useWorkspaceBudget(workspace.id);

  // Extract committee type from workspace name
  const committeeType = workspace.name
    .toLowerCase()
    .replace(/\s+committee$/i, '')
    .trim();

  return (
    <div className="space-y-6">
      {/* Task Summary */}
      <TaskSummaryCards workspace={workspace} onViewTasks={onViewTasks} />

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

      {/* Team Members */}
      <TeamMemberRoster workspace={workspace} showActions={false} maxMembers={6} />
    </div>
  );
}
