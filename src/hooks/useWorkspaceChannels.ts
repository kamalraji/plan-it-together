import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WORKSPACE_CHANNEL_COLUMNS } from '@/lib/supabase-columns';

export interface WorkspaceChannel {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  type: 'general' | 'announcement' | 'private' | 'task';
  is_private: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

interface CreateChannelParams {
  workspaceId: string;
  name: string;
  description?: string;
  type?: WorkspaceChannel['type'];
  isPrivate?: boolean;
}

export function useWorkspaceChannels(workspaceId: string) {
  const queryClient = useQueryClient();

  // Fetch channels
  const {
    data: channels = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['workspace-channels', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      
      const { data, error } = await supabase
        .from('workspace_channels')
        .select(WORKSPACE_CHANNEL_COLUMNS.detail)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as WorkspaceChannel[];
    },
    enabled: !!workspaceId,
  });

  // Create channel mutation
  const createChannelMutation = useMutation({
    mutationFn: async ({ workspaceId, name, description, type = 'general', isPrivate = false }: CreateChannelParams) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('workspace_channels')
        .insert({
          workspace_id: workspaceId,
          name,
          description,
          type,
          is_private: isPrivate,
          created_by: userData.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as WorkspaceChannel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-channels', workspaceId] });
    },
  });

  // Delete channel mutation
  const deleteChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      const { error } = await supabase
        .from('workspace_channels')
        .delete()
        .eq('id', channelId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-channels', workspaceId] });
    },
  });

  // Ensure default general channel exists
  const ensureDefaultChannel = useCallback(async () => {
    if (!workspaceId || channels.length > 0) return null;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;

    // Check if general channel exists
    const { data: existing } = await supabase
      .from('workspace_channels')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('name', 'general')
      .single();

    if (existing) return existing;

    // Create default general channel
    const { data, error } = await supabase
      .from('workspace_channels')
      .insert({
        workspace_id: workspaceId,
        name: 'general',
        description: 'General discussion for the workspace',
        type: 'general',
        is_private: false,
        created_by: userData.user.id,
      })
      .select()
      .single();

    if (error) {
      return null;
    }

    queryClient.invalidateQueries({ queryKey: ['workspace-channels', workspaceId] });
    return data as WorkspaceChannel;
  }, [workspaceId, channels.length, queryClient]);

  return {
    channels,
    isLoading,
    error,
    refetch,
    createChannel: createChannelMutation.mutateAsync,
    deleteChannel: deleteChannelMutation.mutateAsync,
    isCreating: createChannelMutation.isPending,
    isDeleting: deleteChannelMutation.isPending,
    ensureDefaultChannel,
  };
}
