import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ScheduledMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  attachments: unknown[];
  scheduled_for: string;
  status: 'pending' | 'sent' | 'cancelled' | 'failed';
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateScheduledMessageParams {
  channelId: string;
  content: string;
  scheduledFor: Date;
  attachments?: unknown[];
}

export function useScheduledMessages(channelId?: string) {
  const queryClient = useQueryClient();

  // Fetch scheduled messages for a channel
  const {
    data: scheduledMessages = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['scheduled-messages', channelId],
    queryFn: async () => {
      if (!channelId) return [];

      const { data, error } = await supabase
        .from('scheduled_messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('scheduled_for', { ascending: true });

      if (error) throw error;
      return data as ScheduledMessage[];
    },
    enabled: !!channelId,
  });

  // Create scheduled message
  const createMutation = useMutation({
    mutationFn: async ({ channelId, content, scheduledFor, attachments = [] }: CreateScheduledMessageParams) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // Use rpc or raw insert to bypass type checking issues with channel_id text type
      const { data, error } = await supabase
        .from('scheduled_messages')
        .insert({
          channel_id: channelId as string,
          sender_id: userData.user.id,
          content,
          scheduled_for: scheduledFor.toISOString(),
          attachments: attachments as unknown[],
          status: 'pending' as const,
        } as never)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as ScheduledMessage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-messages', channelId] });
    },
  });

  // Cancel scheduled message
  const cancelMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('scheduled_messages')
        .update({ status: 'cancelled' })
        .eq('id', messageId)
        .eq('status', 'pending');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-messages', channelId] });
    },
  });

  // Delete scheduled message
  const deleteMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('scheduled_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-messages', channelId] });
    },
  });

  // Get pending messages
  const pendingMessages = scheduledMessages.filter(m => m.status === 'pending');
  const sentMessages = scheduledMessages.filter(m => m.status === 'sent');
  const failedMessages = scheduledMessages.filter(m => m.status === 'failed');

  return {
    scheduledMessages,
    pendingMessages,
    sentMessages,
    failedMessages,
    isLoading,
    error,
    refetch,
    
    // Mutations
    createScheduledMessage: createMutation.mutateAsync,
    cancelScheduledMessage: cancelMutation.mutateAsync,
    deleteScheduledMessage: deleteMutation.mutateAsync,
    
    // Loading states
    isCreating: createMutation.isPending,
    isCancelling: cancelMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
