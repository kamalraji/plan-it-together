import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/looseClient';
import { EventStatus } from '@/types';
import { toast } from 'sonner';

export type PublishPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface EventPublishRequest {
  id: string;
  eventId: string;
  workspaceId: string;
  requestedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewerId: string | null;
  reviewNotes: string | null;
  priority: PublishPriority;
  checklistSnapshot: Record<string, any> | null;
  requestedAt: string;
  reviewedAt: string | null;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  status: 'pass' | 'warning' | 'fail';
  required: boolean;
}

export interface PublishChecklist {
  items: ChecklistItem[];
  canPublish: boolean;
  warningCount: number;
  failCount: number;
}

export function useEventPublish(eventId: string) {
  const queryClient = useQueryClient();

  // Fetch ROOT workspace for this event
  const rootWorkspaceQuery = useQuery({
    queryKey: ['event-root-workspace', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, settings')
        .eq('event_id', eventId)
        .eq('workspace_type', 'ROOT')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  // Fetch current event status
  const eventQuery = useQuery({
    queryKey: ['event-status', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, status, description, start_date, end_date, mode, visibility, capacity')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  // Fetch any existing publish request
  const publishRequestQuery = useQuery({
    queryKey: ['event-publish-request', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_publish_requests')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        eventId: data.event_id,
        workspaceId: data.workspace_id,
        requestedBy: data.requested_by,
        status: data.status as 'pending' | 'approved' | 'rejected',
        reviewerId: data.reviewer_id,
        reviewNotes: data.review_notes,
        priority: (data.priority || 'medium') as PublishPriority,
        checklistSnapshot: data.checklist_snapshot as Record<string, any> | null,
        requestedAt: data.requested_at,
        reviewedAt: data.reviewed_at,
        createdAt: data.created_at,
      } as EventPublishRequest;
    },
    enabled: !!eventId,
  });

  // Generate pre-publish checklist
  const generateChecklist = (): PublishChecklist => {
    const event = eventQuery.data;
    const rootWorkspace = rootWorkspaceQuery.data;
    const items: ChecklistItem[] = [];

    // Basic info check
    items.push({
      id: 'basic-info',
      label: 'Basic Information',
      description: 'Event name and description are configured',
      status: event?.name && event?.description ? 'pass' : 'fail',
      required: true,
    });

    // Dates check
    items.push({
      id: 'dates',
      label: 'Event Dates',
      description: 'Start and end dates are set',
      status: event?.start_date && event?.end_date ? 'pass' : 'fail',
      required: true,
    });

    // Future date check
    const startDate = event?.start_date ? new Date(event.start_date) : null;
    const isPastEvent = startDate && startDate < new Date();
    items.push({
      id: 'future-date',
      label: 'Event Date Valid',
      description: 'Event start date is in the future',
      status: isPastEvent ? 'warning' : 'pass',
      required: false,
    });

    // ROOT workspace check
    items.push({
      id: 'root-workspace',
      label: 'ROOT Workspace',
      description: 'A ROOT workspace exists for the event',
      status: rootWorkspace ? 'pass' : 'fail',
      required: true,
    });

    // Visibility check
    items.push({
      id: 'visibility',
      label: 'Event Visibility',
      description: 'Event visibility is configured',
      status: event?.visibility ? 'pass' : 'warning',
      required: false,
    });

    // Capacity check (optional)
    items.push({
      id: 'capacity',
      label: 'Capacity Limit',
      description: 'Event capacity is defined',
      status: event?.capacity ? 'pass' : 'warning',
      required: false,
    });

    const failCount = items.filter(i => i.status === 'fail').length;
    const warningCount = items.filter(i => i.status === 'warning').length;
    const canPublish = failCount === 0;

    return { items, canPublish, warningCount, failCount };
  };

  // Direct publish mutation (no approval required)
  const publishMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('events')
        .update({ status: 'PUBLISHED' })
        .eq('id', eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Event published successfully!');
      queryClient.invalidateQueries({ queryKey: ['event-status', eventId] });
      queryClient.invalidateQueries({ queryKey: ['organizer-event', eventId] });
    },
    onError: (error) => {
      toast.error(`Failed to publish event: ${error.message}`);
    },
  });

  // Request approval mutation
  const requestApprovalMutation = useMutation({
    mutationFn: async ({ priority, notes }: { priority: PublishPriority; notes?: string }) => {
      const rootWorkspace = rootWorkspaceQuery.data;
      if (!rootWorkspace) throw new Error('No ROOT workspace found for this event');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const checklist = generateChecklist();

      const { error } = await supabase
        .from('event_publish_requests')
        .insert({
          event_id: eventId,
          workspace_id: rootWorkspace.id,
          requested_by: user.id,
          priority,
          checklist_snapshot: {
            items: checklist.items,
            canPublish: checklist.canPublish,
            notes,
          },
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Approval request submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['event-publish-request', eventId] });
    },
    onError: (error) => {
      toast.error(`Failed to submit request: ${error.message}`);
    },
  });

  // Cancel pending request
  const cancelRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('event_publish_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Request cancelled');
      queryClient.invalidateQueries({ queryKey: ['event-publish-request', eventId] });
    },
    onError: (error) => {
      toast.error(`Failed to cancel request: ${error.message}`);
    },
  });

  // Unpublish mutation
  const unpublishMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('events')
        .update({ status: 'DRAFT' })
        .eq('id', eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Event unpublished');
      queryClient.invalidateQueries({ queryKey: ['event-status', eventId] });
      queryClient.invalidateQueries({ queryKey: ['organizer-event', eventId] });
    },
    onError: (error) => {
      toast.error(`Failed to unpublish: ${error.message}`);
    },
  });

  // Change status mutation
  const changeStatusMutation = useMutation({
    mutationFn: async ({ newStatus, reason }: { newStatus: EventStatus; reason?: string }) => {
      const { error } = await supabase
        .from('events')
        .update({ status: newStatus })
        .eq('id', eventId);

      if (error) throw error;

      // Add manual history entry if needed (trigger handles automatic logging)
      if (reason) {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('event_status_history').insert({
          event_id: eventId,
          previous_status: eventQuery.data?.status || 'DRAFT',
          new_status: newStatus,
          changed_by: user?.id,
          reason,
        });
      }
    },
    onSuccess: (_, { newStatus }) => {
      toast.success(`Event status changed to ${newStatus}`);
      queryClient.invalidateQueries({ queryKey: ['event-status', eventId] });
      queryClient.invalidateQueries({ queryKey: ['organizer-event', eventId] });
    },
    onError: (error) => {
      toast.error(`Failed to change status: ${error.message}`);
    },
  });

  const rootWorkspace = rootWorkspaceQuery.data;
  const settings = rootWorkspace?.settings as { requireEventPublishApproval?: boolean } | null;
  const requiresApproval = settings?.requireEventPublishApproval === true;

  return {
    event: eventQuery.data,
    rootWorkspace,
    publishRequest: publishRequestQuery.data,
    requiresApproval,
    checklist: generateChecklist(),
    isLoading: eventQuery.isLoading || rootWorkspaceQuery.isLoading || publishRequestQuery.isLoading,
    publishEvent: publishMutation.mutateAsync,
    requestApproval: requestApprovalMutation.mutateAsync,
    cancelRequest: cancelRequestMutation.mutateAsync,
    unpublishEvent: unpublishMutation.mutateAsync,
    changeStatus: changeStatusMutation.mutateAsync,
    isPublishing: publishMutation.isPending,
    isRequestingApproval: requestApprovalMutation.isPending,
  };
}
