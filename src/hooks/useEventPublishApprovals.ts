import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/looseClient';
import { toast } from 'sonner';

export interface EventPublishApprovalItem {
  id: string;
  eventId: string;
  eventName: string;
  workspaceId: string;
  requestedBy: string;
  requesterName: string | null;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  checklistSnapshot: Record<string, any> | null;
  requestedAt: string;
  reviewedAt: string | null;
  type: 'event-publish';
}

export function useEventPublishApprovals(workspaceId: string) {
  const queryClient = useQueryClient();

  // Fetch pending event publish requests for this ROOT workspace
  const pendingRequestsQuery = useQuery({
    queryKey: ['event-publish-approvals', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_publish_requests')
        .select(`
          id,
          event_id,
          workspace_id,
          requested_by,
          status,
          priority,
          checklist_snapshot,
          requested_at,
          reviewed_at
        `)
        .eq('workspace_id', workspaceId)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch event names
      const eventIds = [...new Set(data.map((r: any) => r.event_id))];
      const userIds = [...new Set(data.map((r: any) => r.requested_by).filter(Boolean))] as string[];

      const [eventsRes, profilesRes] = await Promise.all([
        supabase.from('events').select('id, name').in('id', eventIds),
        userIds.length > 0 
          ? supabase.from('user_profiles').select('id, full_name').in('id', userIds)
          : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
      ]);

      const eventMap = new Map((eventsRes.data || []).map((e: any) => [e.id, e.name]));
      const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p.full_name]));

      return data.map((r: any) => ({
        id: r.id,
        eventId: r.event_id,
        eventName: eventMap.get(r.event_id) || 'Unknown Event',
        workspaceId: r.workspace_id,
        requestedBy: r.requested_by,
        requesterName: r.requested_by ? profileMap.get(r.requested_by) || null : null,
        status: r.status as 'pending' | 'approved' | 'rejected',
        priority: (r.priority || 'medium') as 'low' | 'medium' | 'high' | 'urgent',
        checklistSnapshot: r.checklist_snapshot as Record<string, any> | null,
        requestedAt: r.requested_at,
        reviewedAt: r.reviewed_at,
        type: 'event-publish' as const,
      })) as EventPublishApprovalItem[];
    },
    enabled: !!workspaceId,
  });

  // Approve request and publish event
  const approveMutation = useMutation({
    mutationFn: async ({ requestId, eventId, notes }: { requestId: string; eventId: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update the request status
      const { error: requestError } = await supabase
        .from('event_publish_requests')
        .update({
          status: 'approved',
          reviewer_id: user.id,
          review_notes: notes || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (requestError) throw requestError;

      // Publish the event
      const { error: eventError } = await supabase
        .from('events')
        .update({ status: 'PUBLISHED' })
        .eq('id', eventId);

      if (eventError) throw eventError;
    },
    onSuccess: () => {
      toast.success('Event approved and published!');
      queryClient.invalidateQueries({ queryKey: ['event-publish-approvals', workspaceId] });
    },
    onError: (error) => {
      toast.error(`Failed to approve: ${error.message}`);
    },
  });

  // Reject request
  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, notes }: { requestId: string; notes: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('event_publish_requests')
        .update({
          status: 'rejected',
          reviewer_id: user.id,
          review_notes: notes,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Request rejected');
      queryClient.invalidateQueries({ queryKey: ['event-publish-approvals', workspaceId] });
    },
    onError: (error) => {
      toast.error(`Failed to reject: ${error.message}`);
    },
  });

  return {
    pendingRequests: pendingRequestsQuery.data || [],
    totalPending: pendingRequestsQuery.data?.length || 0,
    isLoading: pendingRequestsQuery.isLoading,
    approveRequest: approveMutation.mutateAsync,
    rejectRequest: rejectMutation.mutateAsync,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
    refetch: pendingRequestsQuery.refetch,
  };
}
