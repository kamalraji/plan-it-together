import { Workspace, WorkspaceRole } from '@/types';
import { FinancialSummaryCards } from './FinancialSummaryCards';
import { ExpenseTracker } from './ExpenseTracker';
import { InvoiceManager } from './InvoiceManager';
import { BudgetApprovalQueue } from './BudgetApprovalQueue';
import { SpendingByCategory } from './SpendingByCategory';
import { CommitteeHeaderCard } from '../committee/CommitteeHeaderCard';
import { TaskSummaryCards } from '../TaskSummaryCards';
import { WorkspaceHierarchyMiniMap } from '../WorkspaceHierarchyMiniMap';
import { TeamMemberRoster } from '../TeamMemberRoster';
import { MilestoneTimeline } from '../committee/MilestoneTimeline';
import { useFinanceCommitteeRealtime } from '@/hooks/useCommitteeRealtime';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OverdueItemsWidget, EscalationRulesManager } from '../escalation';

interface FinanceDashboardProps {
  workspace: Workspace;
  orgSlug?: string;
  userRole?: WorkspaceRole | null;
  onViewTasks: () => void;
  onDelegateRole?: () => void;
  onInviteMember?: () => void;
  onRequestBudget?: () => void;
  onRequestResource?: () => void;
}

export function FinanceDashboard({
  workspace,
  orgSlug,
  userRole: _userRole,
  onViewTasks,
  onDelegateRole: _onDelegateRole,
  onInviteMember: _onInviteMember,
  onRequestBudget: _onRequestBudget,
  onRequestResource: _onRequestResource,
}: FinanceDashboardProps) {
  // Enable real-time updates for finance committee data
  useFinanceCommitteeRealtime({ workspaceId: workspace.id });

  // Fetch team members count
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['finance-team-members', workspace.id],
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
    queryKey: ['finance-tasks', workspace.id],
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
    queryKey: ['finance-teams', workspace.id],
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
      {/* Finance Header */}
      <CommitteeHeaderCard
        workspaceName={workspace.name}
        memberCount={teamMembers.length}
        tasksCompleted={tasksCompleted}
        tasksTotal={tasks.length}
        teamsCount={teams.length}
      />

      {/* Financial Summary Cards */}
      <FinancialSummaryCards workspaceId={workspace.id} />

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Expense Tracker */}
        <div className="lg:col-span-2 space-y-6">
          <ExpenseTracker workspaceId={workspace.id} />
          <BudgetApprovalQueue 
            workspaceId={workspace.id} 
            parentWorkspaceId={workspace.parentWorkspaceId}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <SpendingByCategory workspaceId={workspace.id} />
          <InvoiceManager workspaceId={workspace.id} />
        </div>
      </div>

      {/* Escalation & Overdue Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OverdueItemsWidget workspaceId={workspace.id} />
        <EscalationRulesManager workspaceId={workspace.id} />
      </div>

      {/* Timeline */}
      <MilestoneTimeline workspaceId={workspace.id} />

      {/* Team Members */}
      <TeamMemberRoster workspace={workspace} showActions={false} maxMembers={6} />
    </div>
  );
}
