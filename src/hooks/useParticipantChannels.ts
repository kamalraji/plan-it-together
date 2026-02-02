import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ParticipantChannel {
  id: string;
  registration_id: string;
  channel_id: string;
  user_id: string;
  event_id: string;
  permissions: {
    can_read: boolean;
    can_write: boolean;
  };
  joined_at: string;
  left_at: string | null;
  is_active: boolean;
}

export interface ChannelWithParticipantInfo {
  id: string;
  name: string;
  description: string | null;
  type: string;
  is_participant_channel: boolean;
  participant_permissions: {
    can_read: boolean;
    can_write: boolean;
  };
  auto_join_on_registration: boolean;
  participant_count?: number;
}

interface ManageParticipantsParams {
  action: 'join' | 'leave' | 'sync';
  eventId: string;
  channelIds?: string[];
  userIds?: string[];
}

export function useParticipantChannels(eventId: string, workspaceId?: string) {
  const queryClient = useQueryClient();

  // Fetch participant channels for an event's workspace
  const {
    data: participantChannels = [],
    isLoading: isLoadingChannels,
    error: channelsError,
    refetch: refetchChannels,
  } = useQuery({
    queryKey: ['participant-channels', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from('workspace_channels')
        .select(`
          id,
          name,
          description,
          type,
          is_participant_channel,
          participant_permissions,
          auto_join_on_registration
        `)
        .eq('workspace_id', workspaceId)
        .eq('is_participant_channel', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as ChannelWithParticipantInfo[];
    },
    enabled: !!workspaceId,
  });

  // Fetch participant count per channel
  const {
    data: participantCounts = {},
    isLoading: isLoadingCounts,
  } = useQuery({
    queryKey: ['participant-channel-counts', eventId],
    queryFn: async () => {
      if (!eventId) return {};

      const { data, error } = await supabase
        .from('participant_channels')
        .select('channel_id')
        .eq('event_id', eventId)
        .eq('is_active', true);

      if (error) throw error;

      // Count participants per channel
      const counts: Record<string, number> = {};
      data?.forEach(pc => {
        counts[pc.channel_id] = (counts[pc.channel_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!eventId,
  });

  // Get channels with participant counts
  const channelsWithCounts = participantChannels.map(ch => ({
    ...ch,
    participant_count: participantCounts[ch.id] || 0,
  }));

  // Toggle channel participant visibility
  const toggleParticipantChannelMutation = useMutation({
    mutationFn: async ({ channelId, isParticipantChannel }: { channelId: string; isParticipantChannel: boolean }) => {
      const { error } = await supabase
        .from('workspace_channels')
        .update({ 
          is_participant_channel: isParticipantChannel,
          auto_join_on_registration: isParticipantChannel,
        })
        .eq('id', channelId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participant-channels', workspaceId] });
    },
  });

  // Update channel participant permissions
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ 
      channelId, 
      permissions 
    }: { 
      channelId: string; 
      permissions: { can_read: boolean; can_write: boolean } 
    }) => {
      const { error } = await supabase
        .from('workspace_channels')
        .update({ participant_permissions: permissions })
        .eq('id', channelId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participant-channels', workspaceId] });
    },
  });

  // Manage participants via edge function
  const manageParticipantsMutation = useMutation({
    mutationFn: async (params: ManageParticipantsParams) => {
      const { data, error } = await supabase.functions.invoke('participant-channel-join', {
        body: params,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participant-channel-counts', eventId] });
      queryClient.invalidateQueries({ queryKey: ['participant-channels', workspaceId] });
    },
  });

  // Sync all participants to auto-join channels
  const syncParticipants = async () => {
    return manageParticipantsMutation.mutateAsync({
      action: 'sync',
      eventId,
    });
  };

  // Add participants to channels
  const addParticipantsToChannels = async (channelIds: string[], userIds: string[]) => {
    return manageParticipantsMutation.mutateAsync({
      action: 'join',
      eventId,
      channelIds,
      userIds,
    });
  };

  // Remove participants from channels
  const removeParticipantsFromChannels = async (channelIds: string[], userIds: string[]) => {
    return manageParticipantsMutation.mutateAsync({
      action: 'leave',
      eventId,
      channelIds,
      userIds,
    });
  };

  return {
    participantChannels: channelsWithCounts,
    isLoading: isLoadingChannels || isLoadingCounts,
    error: channelsError,
    refetch: refetchChannels,
    
    // Mutations
    toggleParticipantChannel: toggleParticipantChannelMutation.mutateAsync,
    updateChannelPermissions: updatePermissionsMutation.mutateAsync,
    syncParticipants,
    addParticipantsToChannels,
    removeParticipantsFromChannels,
    
    // Loading states
    isUpdating: toggleParticipantChannelMutation.isPending || 
                updatePermissionsMutation.isPending ||
                manageParticipantsMutation.isPending,
  };
}

// Hook for participants to view their accessible channels
export function useMyParticipantChannels(eventId: string) {
  return useQuery({
    queryKey: ['my-participant-channels', eventId],
    queryFn: async () => {
      if (!eventId) return [];

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const { data, error } = await supabase
        .from('participant_channels')
        .select(`
          id,
          channel_id,
          permissions,
          is_active,
          workspace_channels!inner (
            id,
            name,
            description,
            type,
            participant_permissions
          )
        `)
        .eq('event_id', eventId)
        .eq('user_id', userData.user.id)
        .eq('is_active', true);

      if (error) throw error;

      return data?.map(pc => {
        const permissions = pc.permissions as { can_read?: boolean; can_write?: boolean } | null;
        return {
          id: pc.channel_id,
          name: (pc.workspace_channels as { name: string }).name,
          description: (pc.workspace_channels as { description: string | null }).description,
          type: (pc.workspace_channels as { type: string }).type,
          canRead: permissions?.can_read ?? true,
          canWrite: permissions?.can_write ?? true,
        };
      }) || [];
    },
    enabled: !!eventId,
  });
}
