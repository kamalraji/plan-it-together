import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ResourceRequestStatus = 'pending' | 'approved' | 'rejected' | 'returned';

export interface ResourceRequest {
  id: string;
  requesting_workspace_id: string;
  target_workspace_id: string;
  resource_id: string;
  requested_by: string;
  quantity: number;
  start_date: string | null;
  end_date: string | null;
  purpose: string | null;
  status: ResourceRequestStatus;
  review_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResourceRequestWithDetails extends ResourceRequest {
  resource?: {
    name: string;
    type: string;
    available: number;
  };
  requesting_workspace?: {
    name: string;
  };
  requester?: {
    full_name: string;
    avatar_url: string;
  };
}

// Hook for committees to manage their resource requests
export function useResourceRequests(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const requestsQuery = useQuery({
    queryKey: ['resource-requests', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('workspace_resource_requests')
        .select(`
          id, requesting_workspace_id, target_workspace_id, resource_id, requested_by, quantity, start_date, end_date, purpose, status, review_notes, reviewed_by, reviewed_at, created_at, updated_at,
          workspace_resources:resource_id (name, type, available)
        `)
        .eq('requesting_workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(r => ({
        ...r,
        resource: r.workspace_resources,
      })) as ResourceRequestWithDetails[];
    },
    enabled: !!workspaceId,
  });

  const createRequestMutation = useMutation({
    mutationFn: async (request: Omit<ResourceRequest, 'id' | 'status' | 'review_notes' | 'reviewed_by' | 'reviewed_at' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('workspace_resource_requests')
        .insert(request)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resource-requests', workspaceId] });
      toast({ title: 'Resource request submitted' });
    },
  });

  const cancelRequestMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_resource_requests')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resource-requests', workspaceId] });
      toast({ title: 'Request cancelled' });
    },
  });

  const returnResourceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_resource_requests')
        .update({ status: 'returned' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resource-requests', workspaceId] });
      toast({ title: 'Resource marked as returned' });
    },
  });

  return {
    requests: requestsQuery.data ?? [],
    isLoading: requestsQuery.isLoading,
    createRequest: createRequestMutation.mutate,
    cancelRequest: cancelRequestMutation.mutate,
    returnResource: returnResourceMutation.mutate,
    isCreating: createRequestMutation.isPending,
  };
}

// Hook for departments to manage incoming resource requests
export function useIncomingResourceRequests(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const requestsQuery = useQuery({
    queryKey: ['incoming-resource-requests', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      // First get resource requests with explicit columns
      const { data: requests, error: requestsError } = await supabase
        .from('workspace_resource_requests')
        .select('id, requesting_workspace_id, target_workspace_id, resource_id, requested_by, quantity, start_date, end_date, purpose, status, review_notes, reviewed_by, reviewed_at, created_at, updated_at')
        .eq('target_workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      if (requestsError) throw requestsError;

      // Get unique resource ids, workspace ids, and user ids
      const resourceIds = [...new Set(requests.map(r => r.resource_id))];
      const workspaceIds = [...new Set(requests.map(r => r.requesting_workspace_id))];
      const userIds = [...new Set(requests.map(r => r.requested_by))];

      // Fetch related data
      const [resourcesRes, workspacesRes, profilesRes] = await Promise.all([
        supabase.from('workspace_resources').select('id, name, type, available').in('id', resourceIds),
        supabase.from('workspaces').select('id, name').in('id', workspaceIds),
        supabase.from('user_profiles').select('id, full_name, avatar_url').in('id', userIds),
      ]);

      const resourceMap = new Map((resourcesRes.data ?? []).map(r => [r.id, r]));
      const workspaceMap = new Map((workspacesRes.data ?? []).map(w => [w.id, w]));
      const profileMap = new Map((profilesRes.data ?? []).map(p => [p.id, p]));

      return requests.map(r => ({
        ...r,
        resource: resourceMap.get(r.resource_id),
        requesting_workspace: workspaceMap.get(r.requesting_workspace_id),
        requester: profileMap.get(r.requested_by),
      })) as ResourceRequestWithDetails[];
    },
    enabled: !!workspaceId,
  });

  const reviewRequestMutation = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      reviewNotes, 
      reviewerId,
      resourceId,
      quantity 
    }: { 
      id: string; 
      status: 'approved' | 'rejected';
      reviewNotes?: string;
      reviewerId: string;
      resourceId: string;
      quantity: number;
    }) => {
      // Update request status
      const { error: requestError } = await supabase
        .from('workspace_resource_requests')
        .update({
          status,
          review_notes: reviewNotes,
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (requestError) throw requestError;

      // If approved, update resource availability
      if (status === 'approved') {
        const { data: resource, error: fetchError } = await supabase
          .from('workspace_resources')
          .select('available')
          .eq('id', resourceId)
          .single();
        if (fetchError) throw fetchError;

        const newAvailable = Math.max(0, resource.available - quantity);
        const { error: updateError } = await supabase
          .from('workspace_resources')
          .update({ 
            available: newAvailable,
            status: newAvailable === 0 ? 'reserved' : 'available',
          })
          .eq('id', resourceId);
        if (updateError) throw updateError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['incoming-resource-requests', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-resources'] });
      toast({ 
        title: variables.status === 'approved' 
          ? 'Request approved - resources allocated' 
          : 'Request rejected' 
      });
    },
  });

  const pendingRequests = requestsQuery.data?.filter(r => r.status === 'pending') ?? [];

  return {
    requests: requestsQuery.data ?? [],
    pendingRequests,
    isLoading: requestsQuery.isLoading,
    reviewRequest: reviewRequestMutation.mutate,
    isReviewing: reviewRequestMutation.isPending,
  };
}
