import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Workspace, WorkspaceType, WorkspaceStatus, WorkspaceRole } from '@/types';
import { BudgetTrackerConnected } from './BudgetTrackerConnected';
import { ResourceManager } from './ResourceManager';
import { ResourceApprovalPanel } from './ResourceApprovalPanel';
import { CommitteeGrid } from './CommitteeOverviewCard';
import { DepartmentKPICard } from './DepartmentKPICard';
import { TaskSummaryCards } from '../TaskSummaryCards';
import { TeamMemberRoster } from '../TeamMemberRoster';
import { WorkspaceHierarchyMiniMap } from '../WorkspaceHierarchyMiniMap';
import { RoleBasedActions } from '../RoleBasedActions';
import { Building2, Users, LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WORKSPACE_DEPARTMENTS } from '@/lib/workspaceHierarchy';
import { useWorkspaceBudget } from '@/hooks/useWorkspaceBudget';
import { TechDepartmentDashboard } from './tech';
import { FinanceDepartmentDashboard } from './finance';

interface DepartmentDashboardProps {
  workspace: Workspace;
  orgSlug?: string;
  userRole?: WorkspaceRole | null;
  onViewTasks?: () => void;
  onDelegateRole?: () => void;
  onInviteMember?: () => void;
}

export function DepartmentDashboard({ 
  workspace, 
  orgSlug, 
  userRole,
  onViewTasks,
  onDelegateRole,
  onInviteMember,
}: DepartmentDashboardProps) {
  const navigate = useNavigate();
  const { pendingRequests } = useWorkspaceBudget(workspace.id);

  // Extract department type from workspace name
  const departmentType = workspace.name.toLowerCase();

  // Check if this is a tech department - render specialized dashboard
  const isTechDepartment = departmentType.includes('tech') || 
    departmentType.includes('it') ||
    departmentType.includes('technology') ||
    departmentType.includes('infrastructure');

  // Check if this is a finance department - render specialized dashboard
  const isFinanceDepartment = departmentType.includes('finance') || 
    departmentType.includes('accounting') ||
    departmentType.includes('budget') ||
    departmentType.includes('treasury');

  if (isTechDepartment) {
    return (
      <TechDepartmentDashboard
        workspace={workspace}
        orgSlug={orgSlug}
        userRole={userRole}
        onViewTasks={onViewTasks}
        onDelegateRole={onDelegateRole}
        onInviteMember={onInviteMember}
      />
    );
  }

  if (isFinanceDepartment) {
    return (
      <FinanceDepartmentDashboard
        workspace={workspace}
        orgSlug={orgSlug}
        userRole={userRole}
        onViewTasks={onViewTasks}
        onDelegateRole={onDelegateRole}
        onInviteMember={onInviteMember}
      />
    );
  }

  // Fetch child committees for this department
  const { data: committees = [] } = useQuery({
    queryKey: ['department-committees', workspace.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, status, created_at, updated_at, event_id, parent_workspace_id, workspace_type, department_id')
        .eq('parent_workspace_id', workspace.id)
        .eq('workspace_type', 'COMMITTEE')
        .order('name');

      if (error) throw error;

      return (data || []).map((row) => ({
        id: row.id,
        eventId: row.event_id,
        name: row.name,
        status: row.status as WorkspaceStatus,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        parentWorkspaceId: row.parent_workspace_id,
        workspaceType: row.workspace_type as WorkspaceType,
        departmentId: row.department_id || undefined,
      })) as unknown as Workspace[];
    },
    enabled: !!workspace.id,
  });

  // Get department info
  const departmentInfo = WORKSPACE_DEPARTMENTS.find(d => d.id === workspace.departmentId);

  const handleCommitteeClick = (committee: Workspace) => {
    const basePath = orgSlug ? `/${orgSlug}/workspaces` : '/workspaces';
    navigate(`${basePath}/${workspace.eventId}?workspaceId=${committee.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Department Header Card */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold text-foreground">{workspace.name}</h2>
              <span className="px-2 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground rounded-full">
                Department
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {departmentInfo?.description || 'Manage department operations, budgets, and committees'}
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

      {/* Mini-Map & KPIs Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <WorkspaceHierarchyMiniMap
          workspaceId={workspace.id}
          eventId={workspace.eventId}
          orgSlug={orgSlug}
          orientation="horizontal"
          showLabels={false}
        />
        <div className="lg:col-span-2">
          <DepartmentKPICard workspaceId={workspace.id} departmentId={workspace.departmentId} />
        </div>
      </div>

      {/* Budget Section */}
      <BudgetTrackerConnected 
        workspaceId={workspace.id}
        showBreakdown={true}
      />

      {/* Resources Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ResourceManager departmentId={workspace.departmentId} workspaceId={workspace.id} />
        <ResourceApprovalPanel workspaceId={workspace.id} />
      </div>

      {/* Approval Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ResourceApprovalPanel workspaceId={workspace.id} />
      </div>

      {/* Committees Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">Committees Overview</h3>
          <span className="text-sm text-muted-foreground">
            {committees.length} {committees.length === 1 ? 'committee' : 'committees'}
          </span>
        </div>
        <CommitteeGrid 
          committees={committees} 
          onCommitteeClick={handleCommitteeClick}
          emptyMessage="No committees created yet"
        />
      </div>

      {/* Team Members */}
      <TeamMemberRoster workspace={workspace} showActions={false} maxMembers={8} />
    </div>
  );
}
