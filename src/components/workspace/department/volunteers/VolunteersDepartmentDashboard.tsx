import { Workspace } from '@/types';
import { VolunteersDeptStatsCards } from './VolunteersDeptStatsCards';
import { VolunteersDeptCommitteePanel } from './VolunteersDeptCommitteePanel';
import { VolunteersDeptOverview } from './VolunteersDeptOverview';
import { BudgetTrackerConnected } from '../BudgetTrackerConnected';
import { ResourceManager } from '../ResourceManager';
import { ResourceApprovalPanel } from '../ResourceApprovalPanel';
import { DepartmentKPICard } from '../DepartmentKPICard';
import { TaskSummaryCards } from '../../TaskSummaryCards';
import { TeamMemberRoster } from '../../TeamMemberRoster';
import { WorkspaceHierarchyMiniMap } from '../../WorkspaceHierarchyMiniMap';

import { Users, LayoutGrid } from 'lucide-react';
import { useWorkspaceBudget } from '@/hooks/useWorkspaceBudget';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VolunteersDepartmentDashboardProps {
  workspace: Workspace;
  orgSlug?: string;
  onViewTasks?: () => void;
}

export function VolunteersDepartmentDashboard({
  workspace,
  orgSlug,
  onViewTasks,
}: VolunteersDepartmentDashboardProps) {
  const { pendingRequests } = useWorkspaceBudget(workspace.id);

  // Fetch child committees count
  const { data: committees = [] } = useQuery({
    queryKey: ['volunteers-dept-committees-count', workspace.id],
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
      {/* Volunteers Department Header */}
      <div className="bg-gradient-to-br from-rose-500/10 via-card to-pink-500/5 rounded-xl border border-border shadow-sm p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-rose-500/20">
            <Users className="h-6 w-6 text-rose-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold text-foreground">{workspace.name}</h2>
              <span className="px-2 py-0.5 text-xs font-medium bg-rose-500/20 text-rose-600 rounded-full">
                Volunteers Department
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Manage volunteer recruitment, training, scheduling, and recognition across all volunteer committees
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
      <VolunteersDeptStatsCards workspaceId={workspace.id} />

      {/* Task Summary */}
      <TaskSummaryCards workspace={workspace} onViewTasks={onViewTasks} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Volunteers Overview */}
          <VolunteersDeptOverview workspaceId={workspace.id} />
          
          {/* Budget Section */}
          <BudgetTrackerConnected
            workspaceId={workspace.id}
            showBreakdown={true}
          />
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
          <VolunteersDeptCommitteePanel
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
