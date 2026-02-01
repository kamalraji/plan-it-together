import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WorkspaceType } from '@/types';

export type ApprovalPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface BudgetApprovalRequest {
  id: string;
  requestingWorkspaceId: string;
  requestingWorkspaceName: string;
  requestedAmount: number;
  reason: string;
  requestedBy: string;
  requesterName: string | null;
  status: string;
  priority: ApprovalPriority;
  createdAt: string;
  type: 'budget';
}

export interface ResourceApprovalRequest {
  id: string;
  resourceId: string;
  resourceName: string;
  requestingWorkspaceId: string;
  requestingWorkspaceName: string;
  quantity: number;
  purpose: string;
  startDate: string | null;
  endDate: string | null;
  requestedBy: string;
  requesterName: string | null;
  status: string;
  priority: ApprovalPriority;
  createdAt: string;
  type: 'resource';
}

export interface AccessApprovalRequest {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  avatarUrl: string | null;
  requestedRole: string | null;
  message: string | null;
  status: string | null;
  priority: ApprovalPriority;
  createdAt: string;
  type: 'access';
}

export interface EventPublishApprovalRequest {
  id: string;
  eventId: string;
  eventName: string;
  workspaceId: string;
  requestedBy: string;
  requesterName: string | null;
  status: string;
  priority: ApprovalPriority;
  checklistSnapshot: Record<string, any> | null;
  createdAt: string;
  reviewedAt: string | null;
  type: 'event-publish';
}

export type ApprovalRequest = BudgetApprovalRequest | ResourceApprovalRequest | AccessApprovalRequest | EventPublishApprovalRequest;

export function useWorkspaceApprovals(workspaceId: string, workspaceType?: WorkspaceType) {
  const isTeam = workspaceType === WorkspaceType.TEAM;

  // Fetch pending budget requests where this workspace is the target (approver)
  const budgetRequestsQuery = useQuery({
    queryKey: ['pending-budget-requests', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_budget_requests')
        .select(`
          id,
          requesting_workspace_id,
          requested_amount,
          reason,
          requested_by,
          status,
          priority,
          created_at
        `)
        .eq('target_workspace_id', workspaceId)
        .eq('status', 'pending');

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch workspace names and requester profiles
      const workspaceIds = [...new Set(data.map(r => r.requesting_workspace_id))];
      const userIds = [...new Set(data.map(r => r.requested_by))];

      const [workspacesRes, profilesRes] = await Promise.all([
        supabase.from('workspaces').select('id, name').in('id', workspaceIds),
        supabase.from('user_profiles').select('id, full_name').in('id', userIds),
      ]);

      const workspaceMap = new Map((workspacesRes.data || []).map(w => [w.id, w.name]));
      const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p.full_name]));

      return data.map(r => ({
        id: r.id,
        requestingWorkspaceId: r.requesting_workspace_id,
        requestingWorkspaceName: workspaceMap.get(r.requesting_workspace_id) || 'Unknown',
        requestedAmount: r.requested_amount,
        reason: r.reason,
        requestedBy: r.requested_by,
        requesterName: profileMap.get(r.requested_by) || null,
        status: r.status,
        priority: (r.priority || 'medium') as ApprovalPriority,
        createdAt: r.created_at,
        type: 'budget' as const,
      }));
    },
    enabled: !!workspaceId && !isTeam,
  });

  // Fetch pending resource requests where this workspace owns the resource
  const resourceRequestsQuery = useQuery({
    queryKey: ['pending-resource-requests', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_resource_requests')
        .select(`
          id,
          resource_id,
          requesting_workspace_id,
          quantity,
          purpose,
          start_date,
          end_date,
          requested_by,
          status,
          priority,
          created_at
        `)
        .eq('owning_workspace_id', workspaceId)
        .eq('status', 'pending');

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch resource names, workspace names, and requester profiles
      const resourceIds = [...new Set(data.map(r => r.resource_id))];
      const workspaceIds = [...new Set(data.map(r => r.requesting_workspace_id))];
      const userIds = [...new Set(data.map(r => r.requested_by))];

      const [resourcesRes, workspacesRes, profilesRes] = await Promise.all([
        supabase.from('workspace_resources').select('id, name').in('id', resourceIds),
        supabase.from('workspaces').select('id, name').in('id', workspaceIds),
        supabase.from('user_profiles').select('id, full_name').in('id', userIds),
      ]);

      const resourceMap = new Map((resourcesRes.data || []).map(r => [r.id, r.name]));
      const workspaceMap = new Map((workspacesRes.data || []).map(w => [w.id, w.name]));
      const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p.full_name]));

      return data.map(r => ({
        id: r.id,
        resourceId: r.resource_id,
        resourceName: resourceMap.get(r.resource_id) || 'Unknown Resource',
        requestingWorkspaceId: r.requesting_workspace_id,
        requestingWorkspaceName: workspaceMap.get(r.requesting_workspace_id) || 'Unknown',
        quantity: r.quantity,
        purpose: r.purpose || '',
        startDate: r.start_date,
        endDate: r.end_date,
        requestedBy: r.requested_by,
        requesterName: profileMap.get(r.requested_by) || null,
        status: r.status,
        priority: (r.priority || 'medium') as ApprovalPriority,
        createdAt: r.created_at,
        type: 'resource' as const,
      }));
    },
    enabled: !!workspaceId && !isTeam,
  });

  // Fetch pending access requests for this workspace
  const accessRequestsQuery = useQuery({
    queryKey: ['pending-access-requests', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_access_requests')
        .select(`
          id,
          user_id,
          requested_role,
          message,
          status,
          priority,
          created_at
        `)
        .eq('workspace_id', workspaceId)
        .eq('status', 'PENDING');

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch user profiles
      const userIds = [...new Set(data.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      // Fetch user emails from auth metadata if needed
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      return data.map(r => ({
        id: r.id,
        userId: r.user_id,
        userName: profileMap.get(r.user_id)?.full_name || null,
        userEmail: null, // Would need edge function to get email
        avatarUrl: profileMap.get(r.user_id)?.avatar_url || null,
        requestedRole: r.requested_role,
        message: r.message,
        status: r.status,
        priority: (r.priority || 'medium') as ApprovalPriority,
        createdAt: r.created_at,
        type: 'access' as const,
      }));
    },
    enabled: !!workspaceId,
  });

  const budgetRequests = budgetRequestsQuery.data || [];
  const resourceRequests = resourceRequestsQuery.data || [];
  const accessRequests = accessRequestsQuery.data || [];

  // Combine all requests sorted by date
  const allRequests: ApprovalRequest[] = [
    ...budgetRequests,
    ...resourceRequests,
    ...accessRequests,
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    budgetRequests,
    resourceRequests,
    accessRequests,
    allRequests,
    totalPending: budgetRequests.length + resourceRequests.length + accessRequests.length,
    isLoading: budgetRequestsQuery.isLoading || resourceRequestsQuery.isLoading || accessRequestsQuery.isLoading,
    refetch: () => {
      budgetRequestsQuery.refetch();
      resourceRequestsQuery.refetch();
      accessRequestsQuery.refetch();
    },
  };
}
