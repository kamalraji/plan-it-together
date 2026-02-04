import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { queryPresets } from '@/lib/query-config';
import { getWorkspaceRoleLevel, WorkspaceHierarchyLevel } from '@/lib/workspaceHierarchy';
import { WorkspaceRole } from '@/types';

export type ApprovalCategory = 'budget' | 'resource' | 'access' | 'task';

export interface CrossWorkspaceApproval {
  id: string;
  type: ApprovalCategory;
  title: string;
  subtitle: string;
  workspaceId: string;
  workspaceName: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  requesterName?: string;
  amount?: number;
}

export interface AllPendingApprovalsResult {
  approvals: CrossWorkspaceApproval[];
  byCategory: {
    budget: number;
    resource: number;
    access: number;
    task: number;
  };
  byWorkspace: Map<string, { name: string; count: number }>;
  totalCount: number;
  isLoading: boolean;
  refetch: () => void;
}

/**
 * Hook to fetch all pending approvals across workspaces where user has management role
 */
export function useAllPendingApprovals(): AllPendingApprovalsResult {
  const { user } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['all-pending-approvals', user?.id],
    queryFn: async () => {
      if (!user?.id) return { approvals: [], byCategory: { budget: 0, resource: 0, access: 0, task: 0 } };

      // 1. Get all workspaces where user is a manager or above
      const { data: memberships, error: membershipError } = await supabase
        .from('workspace_team_members')
        .select('workspace_id, role, workspaces!inner(id, name)')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (membershipError) throw membershipError;
      if (!memberships?.length) {
        return { approvals: [], byCategory: { budget: 0, resource: 0, access: 0, task: 0 } };
      }

      // Filter to only workspaces where user is Lead or above
      const managerWorkspaces = memberships.filter(m => {
        const level = getWorkspaceRoleLevel(m.role as WorkspaceRole);
        return level <= WorkspaceHierarchyLevel.LEAD;
      });

      if (!managerWorkspaces.length) {
        return { approvals: [], byCategory: { budget: 0, resource: 0, access: 0, task: 0 } };
      }

      const workspaceIds = managerWorkspaces.map(m => m.workspace_id);
      const workspaceMap = new Map<string, string>();
      managerWorkspaces.forEach(m => {
        const ws = m.workspaces as { id: string; name: string };
        workspaceMap.set(ws.id, ws.name);
      });

      // 2. Fetch all pending approvals in parallel
      const [budgetRes, resourceRes, accessRes, taskRes] = await Promise.all([
        // Budget requests where these workspaces are targets
        supabase
          .from('workspace_budget_requests')
          .select(`
            id, requesting_workspace_id, requested_amount, reason, 
            requested_by, status, priority, created_at, target_workspace_id
          `)
          .in('target_workspace_id', workspaceIds)
          .eq('status', 'pending'),
        
        // Resource requests where these workspaces are targets (own the resource)
        supabase
          .from('workspace_resource_requests')
          .select(`
            id, resource_id, requesting_workspace_id, quantity, purpose,
            requested_by, status, priority, created_at, target_workspace_id
          `)
          .in('target_workspace_id', workspaceIds)
          .eq('status', 'pending'),
        
        // Access requests for these workspaces
        supabase
          .from('workspace_access_requests')
          .select(`
            id, user_id, requested_role, message, status, priority, created_at, workspace_id
          `)
          .in('workspace_id', workspaceIds)
          .eq('status', 'PENDING'),
        
        // Task approval requests for tasks in these workspaces
        supabase
          .from('task_approval_requests')
          .select(`
            id, task_id, requested_by, requested_at, overall_status, created_at,
            workspace_tasks!inner(id, title, workspace_id, priority)
          `)
          .in('workspace_tasks.workspace_id', workspaceIds)
          .eq('overall_status', 'PENDING'),
      ]);

      // 3. Get requester names and workspace names for budget/resource requests
      const allRequesterIds = new Set<string>();
      const allRequestingWorkspaceIds = new Set<string>();
      const allResourceIds = new Set<string>();
      const allAccessUserIds = new Set<string>();

      budgetRes.data?.forEach(r => {
        allRequesterIds.add(r.requested_by);
        allRequestingWorkspaceIds.add(r.requesting_workspace_id);
      });
      resourceRes.data?.forEach(r => {
        allRequesterIds.add(r.requested_by);
        allRequestingWorkspaceIds.add(r.requesting_workspace_id);
        allResourceIds.add(r.resource_id);
      });
      accessRes.data?.forEach(r => allAccessUserIds.add(r.user_id));
      taskRes.data?.forEach(r => allRequesterIds.add(r.requested_by));

      const [profilesRes, , resourcesRes, accessProfilesRes] = await Promise.all([
        allRequesterIds.size > 0
          ? supabase.from('user_profiles').select('id, full_name').in('id', [...allRequesterIds])
          : { data: [] },
        allRequestingWorkspaceIds.size > 0
          ? supabase.from('workspaces').select('id, name').in('id', [...allRequestingWorkspaceIds])
          : { data: [] },
        allResourceIds.size > 0
          ? supabase.from('workspace_resources').select('id, name').in('id', [...allResourceIds])
          : { data: [] },
        allAccessUserIds.size > 0
          ? supabase.from('user_profiles').select('id, full_name').in('id', [...allAccessUserIds])
          : { data: [] },
      ]);

      const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p.full_name]));
      const resourceMap = new Map((resourcesRes.data || []).map(r => [r.id, r.name]));
      const accessProfileMap = new Map((accessProfilesRes.data || []).map(p => [p.id, p.full_name]));

      // 4. Transform into unified format
      const approvals: CrossWorkspaceApproval[] = [];

      // Budget approvals
      (budgetRes.data || []).forEach(r => {
        approvals.push({
          id: r.id,
          type: 'budget',
          title: `Budget Request: $${r.requested_amount.toLocaleString()}`,
          subtitle: r.reason || 'No reason provided',
          workspaceId: r.target_workspace_id,
          workspaceName: workspaceMap.get(r.target_workspace_id) || 'Unknown',
          priority: (r.priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
          createdAt: r.created_at,
          requesterName: profileMap.get(r.requested_by) || undefined,
          amount: r.requested_amount,
        });
      });

      // Resource approvals
      (resourceRes.data || []).forEach(r => {
        const resourceName = resourceMap.get(r.resource_id) || 'Resource';
        approvals.push({
          id: r.id,
          type: 'resource',
          title: `${resourceName} (${r.quantity}x)`,
          subtitle: r.purpose || 'No purpose provided',
          workspaceId: r.target_workspace_id,
          workspaceName: workspaceMap.get(r.target_workspace_id) || 'Unknown',
          priority: (r.priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
          createdAt: r.created_at,
          requesterName: profileMap.get(r.requested_by) || undefined,
        });
      });

      // Access approvals
      (accessRes.data || []).forEach(r => {
        const userName = accessProfileMap.get(r.user_id) || 'Unknown User';
        approvals.push({
          id: r.id,
          type: 'access',
          title: `Access Request: ${userName}`,
          subtitle: r.message || `Requesting ${r.requested_role || 'access'}`,
          workspaceId: r.workspace_id,
          workspaceName: workspaceMap.get(r.workspace_id) || 'Unknown',
          priority: (r.priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
          createdAt: r.created_at,
          requesterName: userName,
        });
      });

      // Task approvals
      (taskRes.data || []).forEach(r => {
        const task = r.workspace_tasks as { id: string; title: string; workspace_id: string; priority: string } | null;
        if (!task) return;
        
        approvals.push({
          id: r.id,
          type: 'task',
          title: task.title,
          subtitle: 'Task completion approval',
          workspaceId: task.workspace_id,
          workspaceName: workspaceMap.get(task.workspace_id) || 'Unknown',
          priority: (task.priority?.toLowerCase() as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
          createdAt: r.created_at,
          requesterName: profileMap.get(r.requested_by) || undefined,
        });
      });

      // Sort by creation date (newest first)
      approvals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Calculate counts
      const byCategory = {
        budget: approvals.filter(a => a.type === 'budget').length,
        resource: approvals.filter(a => a.type === 'resource').length,
        access: approvals.filter(a => a.type === 'access').length,
        task: approvals.filter(a => a.type === 'task').length,
      };

      return { approvals, byCategory };
    },
    enabled: !!user?.id,
    ...queryPresets.standard,
  });

  // Calculate by workspace
  const byWorkspace = new Map<string, { name: string; count: number }>();
  (data?.approvals || []).forEach(a => {
    const existing = byWorkspace.get(a.workspaceId);
    if (existing) {
      existing.count++;
    } else {
      byWorkspace.set(a.workspaceId, { name: a.workspaceName, count: 1 });
    }
  });

  return {
    approvals: data?.approvals || [],
    byCategory: data?.byCategory || { budget: 0, resource: 0, access: 0, task: 0 },
    byWorkspace,
    totalCount: data?.approvals?.length || 0,
    isLoading,
    refetch,
  };
}
