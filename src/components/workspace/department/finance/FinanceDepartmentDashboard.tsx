import { Workspace, WorkspaceRole } from '@/types';
import { FinanceDepartmentStatsCards } from './FinanceDepartmentStatsCards';
import { FinanceDepartmentQuickActions } from './FinanceDepartmentQuickActions';
import { FinanceCommitteeConnectionsPanel } from './FinanceCommitteeConnectionsPanel';
import { BudgetRequestsOverview } from './BudgetRequestsOverview';
import { BudgetTrackerConnected } from '../BudgetTrackerConnected';
import { ResourceManager } from '../ResourceManager';
import { ResourceApprovalPanel } from '../ResourceApprovalPanel';
import { DepartmentKPICard } from '../DepartmentKPICard';
import { TaskSummaryCards } from '../../TaskSummaryCards';
import { TeamMemberRoster } from '../../TeamMemberRoster';
import { WorkspaceHierarchyMiniMap } from '../../WorkspaceHierarchyMiniMap';
import { RoleBasedActions } from '../../RoleBasedActions';
import { DollarSign, Users, LayoutGrid } from 'lucide-react';
import { useWorkspaceBudget } from '@/hooks/useWorkspaceBudget';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FinanceDepartmentDashboardProps {
  workspace: Workspace;
  orgSlug?: string;
  userRole?: WorkspaceRole | null;
  onViewTasks?: () => void;
  onDelegateRole?: () => void;
  onInviteMember?: () => void;
}

export function FinanceDepartmentDashboard({
  workspace,
  orgSlug,
  userRole,
  onViewTasks,
  onDelegateRole,
  onInviteMember,
}: FinanceDepartmentDashboardProps) {
  const { pendingRequests } = useWorkspaceBudget(workspace.id);

  // Fetch child committees count
  const { data: committees = [] } = useQuery({
    queryKey: ['finance-dept-committees-count', workspace.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id')
        .eq('parent_workspace_id', workspace.id)
        .eq('workspace_type', 'COMMITTEE');
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      {/* Finance Department Header */}
      <div className="bg-gradient-to-br from-green-500/10 via-card to-emerald-500/5 rounded-xl border border-border shadow-sm p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-green-500/20">
            <DollarSign className="h-6 w-6 text-green-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold text-foreground">{workspace.name}</h2>
              <span className="px-2 py-0.5 text-xs font-medium bg-green-500/20 text-green-600 rounded-full">
                Finance Department
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Manage budgets, expenses, invoices, and financial operations across all event committees
            </p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <LayoutGrid className="h-4 w-4" />
                <span>{committees.length} Committees</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{workspace.teamMembers?.length || 0} Members</span>
              </div>
              {pendingRequests.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-yellow-500/20 text-yellow-600 rounded-full">
                  {pendingRequests.length} pending requests
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <FinanceDepartmentStatsCards workspaceId={workspace.id} />

      {/* Quick Actions */}
      <FinanceDepartmentQuickActions />

      {/* Role-Based Actions */}
      <RoleBasedActions
        workspace={workspace}
        userRole={userRole || null}
        onDelegateRole={onDelegateRole}
        onInviteMember={onInviteMember}
        onViewReport={() => {}}
      />

      {/* Task Summary */}
      <TaskSummaryCards workspace={workspace} onViewTasks={onViewTasks} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Budget Overview */}
          <BudgetTrackerConnected
            workspaceId={workspace.id}
            showBreakdown={true}
          />
          
          {/* Budget Requests Overview */}
          <BudgetRequestsOverview workspaceId={workspace.id} />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <WorkspaceHierarchyMiniMap
            workspaceId={workspace.id}
            eventId={workspace.eventId}
            orgSlug={orgSlug}
            orientation="vertical"
            showLabels={false}
          />
          <FinanceCommitteeConnectionsPanel
            workspaceId={workspace.id}
            eventId={workspace.eventId}
            orgSlug={orgSlug}
          />
        </div>
      </div>

      {/* KPIs */}
      <DepartmentKPICard workspaceId={workspace.id} departmentId={workspace.departmentId} />

      {/* Resources Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ResourceManager departmentId={workspace.departmentId} workspaceId={workspace.id} />
        <ResourceApprovalPanel workspaceId={workspace.id} />
      </div>

      {/* Team Members */}
      <TeamMemberRoster workspace={workspace} showActions={false} maxMembers={8} />
    </div>
  );
}
