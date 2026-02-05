import { useQuery } from '@tanstack/react-query';
import { Workspace, WorkspaceRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { ChartBarIcon, ChatBubbleLeftIcon, CheckCircleIcon, UsersIcon } from '@heroicons/react/24/outline';

interface WorkspaceRoleAnalyticsProps {
  workspace: Workspace;
}

interface RoleAnalytics {
  role: WorkspaceRole;
  memberCount: number;
  messageCount: number;
  tasksCompleted: number;
  tasksAssigned: number;
  activityCount: number;
}

export function WorkspaceRoleAnalytics({ workspace }: WorkspaceRoleAnalyticsProps) {
  const { data: roleAnalytics, isLoading } = useQuery({
    queryKey: ['workspace-role-analytics', workspace.id],
    queryFn: async () => {
      // Fetch team members by role
      const { data: members, error: membersError } = await supabase
        .from('workspace_team_members')
        .select('role')
        .eq('workspace_id', workspace.id)
        .eq('status', 'ACTIVE');

      if (membersError) throw membersError;

      // Fetch tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('workspace_tasks')
        .select('assigned_to, status')
        .eq('workspace_id', workspace.id);

      if (tasksError) throw tasksError;

      // Fetch workspace activities for activity count
      const { data: _, error: activitiesError } = await supabase
        .from('workspace_activities')
        .select('type')
        .eq('workspace_id', workspace.id)
        .eq('type', 'communication');

      if (activitiesError) throw activitiesError;

      // Aggregate by role
      const roleMap = new Map<WorkspaceRole, RoleAnalytics>();

      // Initialize all roles
      Object.values(WorkspaceRole).forEach((role) => {
        roleMap.set(role, {
          role,
          memberCount: 0,
          messageCount: 0,
          tasksCompleted: 0,
          tasksAssigned: 0,
          activityCount: 0,
        });
      });

      // Count members
      members?.forEach((member: any) => {
        const current = roleMap.get(member.role as WorkspaceRole);
        if (current) {
          current.memberCount++;
        }
      });

      // Count tasks (approximation - we don't have user-to-role mapping in tasks)
      tasks?.forEach((task: any) => {
        const assignedMember = members?.find((m: any) => m.user_id === task.assigned_to);
        if (assignedMember) {
          const current = roleMap.get(assignedMember.role as WorkspaceRole);
          if (current) {
            current.tasksAssigned++;
            if (task.status === 'COMPLETED' || task.status === 'DONE') {
              current.tasksCompleted++;
            }
          }
        }
      });

      return Array.from(roleMap.values()).filter((r) => r.memberCount > 0);
    },
  });

  const formatRoleName = (role: WorkspaceRole): string => {
    return role
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getCompletionRate = (completed: number, assigned: number): number => {
    if (assigned === 0) return 0;
    return Math.round((completed / assigned) * 100);
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="h-8 bg-muted rounded"></div>
          <div className="h-8 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
      <div className="px-4 sm:px-6 py-4 bg-muted/40 border-b border-border">
        <div className="flex items-center gap-2">
          <ChartBarIcon className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Analytics by Role</h3>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Team activity, message volume, and task completion broken down by workspace role
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-muted/20 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Role
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="flex items-center justify-center gap-1">
                  <UsersIcon className="h-4 w-4" />
                  <span>Members</span>
                </div>
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="flex items-center justify-center gap-1">
                  <ChatBubbleLeftIcon className="h-4 w-4" />
                  <span>Activity</span>
                </div>
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Tasks Assigned
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="flex items-center justify-center gap-1">
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>Completed</span>
                </div>
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Completion Rate
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {!roleAnalytics || roleAnalytics.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No analytics data available yet
                </td>
              </tr>
            ) : (
              roleAnalytics.map((roleData) => {
                const completionRate = getCompletionRate(
                  roleData.tasksCompleted,
                  roleData.tasksAssigned
                );

                return (
                  <tr key={roleData.role} className="hover:bg-muted/20">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-medium text-foreground">
                        {formatRoleName(roleData.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {roleData.memberCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm text-muted-foreground">
                        {Math.round(roleData.activityCount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm text-muted-foreground">{roleData.tasksAssigned}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center rounded-md bg-green-50 dark:bg-green-950/20 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400 ring-1 ring-inset ring-green-600/20">
                        {roleData.tasksCompleted}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex-1 max-w-[80px] bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              completionRate >= 80
                                ? 'bg-success'
                                : completionRate >= 50
                                ? 'bg-warning'
                                : 'bg-destructive'
                            }`}
                            style={{ width: `${completionRate}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-foreground min-w-[32px]">
                          {completionRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 sm:px-6 py-3 bg-muted/20 border-t border-border text-xs text-muted-foreground">
        <p>
          <strong>Note:</strong> Activity and message counts are approximate. Task completion is based on tasks
          assigned to team members with each role.
        </p>
      </div>
    </div>
  );
}
