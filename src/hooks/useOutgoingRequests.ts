import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type OutgoingRequestStatus = 'pending' | 'approved' | 'rejected';

export interface OutgoingBudgetRequest {
  id: string;
  targetWorkspaceId: string;
  targetWorkspaceName: string;
  requestedAmount: number;
  reason: string;
  status: OutgoingRequestStatus;
  reviewNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  type: 'budget';
}

export interface OutgoingResourceRequest {
  id: string;
  resourceId: string;
  resourceName: string;
  owningWorkspaceId: string;
  owningWorkspaceName: string;
  quantity: number;
  purpose: string;
  startDate: string | null;
  endDate: string | null;
  status: OutgoingRequestStatus;
  reviewNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  type: 'resource';
}

export type OutgoingRequest = OutgoingBudgetRequest | OutgoingResourceRequest;

export function useOutgoingRequests(workspaceId: string | undefined) {
  // Fetch outgoing budget requests (where this workspace is the requester)
  const outgoingBudgetQuery = useQuery({
    queryKey: ['outgoing-budget-requests', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_budget_requests')
        .select(`
          id,
          target_workspace_id,
          requested_amount,
          reason,
          status,
          review_notes,
          reviewed_by,
          reviewed_at,
          created_at
        `)
        .eq('requesting_workspace_id', workspaceId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch target workspace names
      const workspaceIds = [...new Set(data.map(r => r.target_workspace_id))];
      const { data: workspaces } = await supabase
        .from('workspaces')
        .select('id, name')
        .in('id', workspaceIds);

      const workspaceMap = new Map((workspaces || []).map(w => [w.id, w.name]));

      return data.map(r => ({
        id: r.id,
        targetWorkspaceId: r.target_workspace_id,
        targetWorkspaceName: workspaceMap.get(r.target_workspace_id) || 'Unknown',
        requestedAmount: r.requested_amount,
        reason: r.reason,
        status: r.status as OutgoingRequestStatus,
        reviewNotes: r.review_notes,
        reviewedBy: r.reviewed_by,
        reviewedAt: r.reviewed_at,
        createdAt: r.created_at,
        type: 'budget' as const,
      }));
    },
    enabled: !!workspaceId,
  });

  // Fetch outgoing resource requests (where this workspace is the requester)
  const outgoingResourceQuery = useQuery({
    queryKey: ['outgoing-resource-requests', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_resource_requests')
        .select(`
          id,
          resource_id,
          target_workspace_id,
          quantity,
          purpose,
          start_date,
          end_date,
          status,
          review_notes,
          reviewed_by,
          reviewed_at,
          created_at
        `)
        .eq('requesting_workspace_id', workspaceId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch resource names and target workspace names
      const resourceIds = [...new Set(data.map(r => r.resource_id))];
      const workspaceIds = [...new Set(data.map(r => r.target_workspace_id))];

      const [resourcesRes, workspacesRes] = await Promise.all([
        supabase.from('workspace_resources').select('id, name').in('id', resourceIds),
        supabase.from('workspaces').select('id, name').in('id', workspaceIds),
      ]);

      const resourceMap = new Map((resourcesRes.data || []).map(r => [r.id, r.name]));
      const workspaceMap = new Map((workspacesRes.data || []).map(w => [w.id, w.name]));

      return data.map(r => ({
        id: r.id,
        resourceId: r.resource_id,
        resourceName: resourceMap.get(r.resource_id) || 'Unknown Resource',
        owningWorkspaceId: r.target_workspace_id,
        owningWorkspaceName: workspaceMap.get(r.target_workspace_id) || 'Unknown',
        quantity: r.quantity,
        purpose: r.purpose || '',
        startDate: r.start_date,
        endDate: r.end_date,
        status: r.status as OutgoingRequestStatus,
        reviewNotes: r.review_notes,
        reviewedBy: r.reviewed_by,
        reviewedAt: r.reviewed_at,
        createdAt: r.created_at,
        type: 'resource' as const,
      }));
    },
    enabled: !!workspaceId,
  });

  const outgoingBudgetRequests = outgoingBudgetQuery.data || [];
  const outgoingResourceRequests = outgoingResourceQuery.data || [];

  // Combine all requests sorted by date
  const allOutgoingRequests: OutgoingRequest[] = [
    ...outgoingBudgetRequests,
    ...outgoingResourceRequests,
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Calculate counts
  const pendingCount = allOutgoingRequests.filter(r => r.status === 'pending').length;
  const approvedCount = allOutgoingRequests.filter(r => r.status === 'approved').length;
  const rejectedCount = allOutgoingRequests.filter(r => r.status === 'rejected').length;

  return {
    outgoingBudgetRequests,
    outgoingResourceRequests,
    allOutgoingRequests,
    pendingCount,
    approvedCount,
    rejectedCount,
    isLoading: outgoingBudgetQuery.isLoading || outgoingResourceQuery.isLoading,
    refetch: () => {
      outgoingBudgetQuery.refetch();
      outgoingResourceQuery.refetch();
    },
  };
}
