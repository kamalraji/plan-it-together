/**
 * Live Streaming Hooks
 * Industrial-grade hooks for YouTube Live Streaming feature
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryPresets } from '@/lib/query-config';
import { LIVE_STREAM_COLUMNS } from '@/lib/supabase-columns';
import { toast } from 'sonner';
import type { 
  LiveStream, 
  CreateStreamInput, 
  UpdateStreamInput,
  StreamAnalytics,
} from '@/types/livestream.types';

// Query keys for live streaming
export const liveStreamKeys = {
  all: ['live-streams'] as const,
  byWorkspace: (workspaceId: string) => [...liveStreamKeys.all, 'workspace', workspaceId] as const,
  byEvent: (eventId: string) => [...liveStreamKeys.all, 'event', eventId] as const,
  detail: (streamId: string) => [...liveStreamKeys.all, 'detail', streamId] as const,
  analytics: (streamId: string) => [...liveStreamKeys.detail(streamId), 'analytics'] as const,
  youtubeChannel: (workspaceId: string) => ['youtube-channel', workspaceId] as const,
};

/**
 * Fetch live streams for a workspace
 */
export function useLiveStreams(workspaceId: string | undefined) {
  return useQuery({
    queryKey: liveStreamKeys.byWorkspace(workspaceId || ''),
    queryFn: async () => {
      if (!workspaceId) return [];
      
      const { data, error } = await supabase
        .from('event_live_streams')
        .select(LIVE_STREAM_COLUMNS.list)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as LiveStream[];
    },
    enabled: !!workspaceId,
    ...queryPresets.dynamic,
  });
}

/**
 * Fetch live streams for an event
 */
export function useLiveStreamsByEvent(eventId: string | undefined) {
  return useQuery({
    queryKey: liveStreamKeys.byEvent(eventId || ''),
    queryFn: async () => {
      if (!eventId) return [];
      
      const { data, error } = await supabase
        .from('event_live_streams')
        .select(LIVE_STREAM_COLUMNS.list)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as LiveStream[];
    },
    enabled: !!eventId,
    ...queryPresets.dynamic,
  });
}

/**
 * Fetch single live stream details
 */
export function useLiveStreamDetail(streamId: string | undefined) {
  return useQuery({
    queryKey: liveStreamKeys.detail(streamId || ''),
    queryFn: async () => {
      if (!streamId) return null;
      
      const { data, error } = await supabase
        .from('event_live_streams')
        .select(LIVE_STREAM_COLUMNS.detail)
        .eq('id', streamId)
        .single();
      
      if (error) throw error;
      return data as LiveStream;
    },
    enabled: !!streamId,
    ...queryPresets.dynamic,
  });
}

/**
 * Fetch stream analytics
 */
export function useStreamAnalytics(streamId: string | undefined, workspaceId: string | undefined) {
  return useQuery({
    queryKey: liveStreamKeys.analytics(streamId || ''),
    queryFn: async (): Promise<StreamAnalytics | null> => {
      if (!streamId || !workspaceId) return null;
      
      const response = await supabase.functions.invoke('youtube-stream-manage', {
        body: {
          action: 'get_analytics',
          workspace_id: workspaceId,
          stream_id: streamId,
        },
      });
      
      if (response.error) throw new Error(response.error.message);
      if (!response.data?.success) throw new Error(response.data?.error || 'Failed to fetch analytics');
      
      return response.data.analytics as StreamAnalytics;
    },
    enabled: !!streamId && !!workspaceId,
    ...queryPresets.realtime,
  });
}

/**
 * Fetch YouTube channel connection status
 */
export function useYouTubeChannel(workspaceId: string | undefined) {
  return useQuery({
    queryKey: liveStreamKeys.youtubeChannel(workspaceId || ''),
    queryFn: async () => {
      if (!workspaceId) return null;
      
      const { data, error } = await supabase
        .from('workspace_social_api_credentials')
        .select('id, platform, is_active, expires_at, encrypted_credentials')
        .eq('workspace_id', workspaceId)
        .eq('platform', 'youtube')
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;
      
      // Extract channel info from credentials (don't expose sensitive data)
      const creds = data.encrypted_credentials as Record<string, string> | null;
      return {
        connected: true,
        channelId: creds?.channel_id,
        channelName: creds?.channel_name,
        channelThumbnail: creds?.channel_thumbnail,
        expiresAt: data.expires_at,
      };
    },
    enabled: !!workspaceId,
    ...queryPresets.standard,
  });
}

/**
 * Create a new live stream (YouTube broadcast)
 */
export function useCreateLiveStream() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateStreamInput) => {
      const response = await supabase.functions.invoke('youtube-stream-manage', {
        body: {
          action: 'create_broadcast',
          workspace_id: input.workspace_id,
          event_id: input.event_id,
          session_id: input.session_id,
          title: input.title,
          description: input.description,
          privacy_status: input.privacy_status || 'unlisted',
          scheduled_start: input.scheduled_start,
          chat_enabled: input.chat_enabled ?? true,
        },
      });
      
      if (response.error) throw new Error(response.error.message);
      if (!response.data?.success) throw new Error(response.data?.error || 'Failed to create stream');
      
      return response.data.stream as LiveStream & { rtmp_url: string; stream_key: string };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: liveStreamKeys.byWorkspace(variables.workspace_id) });
      queryClient.invalidateQueries({ queryKey: liveStreamKeys.byEvent(variables.event_id) });
      toast.success('Live stream created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create live stream');
    },
  });
}

/**
 * Start a live stream
 */
export function useStartStream() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ workspaceId, streamId }: { workspaceId: string; streamId: string }) => {
      const response = await supabase.functions.invoke('youtube-stream-manage', {
        body: {
          action: 'start_stream',
          workspace_id: workspaceId,
          stream_id: streamId,
        },
      });
      
      if (response.error) throw new Error(response.error.message);
      if (!response.data?.success) throw new Error(response.data?.error || 'Failed to start stream');
      
      return response.data.stream as LiveStream;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: liveStreamKeys.byWorkspace(variables.workspaceId) });
      queryClient.invalidateQueries({ queryKey: liveStreamKeys.detail(variables.streamId) });
      toast.success('Stream is now LIVE!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to start stream');
    },
  });
}

/**
 * End a live stream
 */
export function useEndStream() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ workspaceId, streamId }: { workspaceId: string; streamId: string }) => {
      const response = await supabase.functions.invoke('youtube-stream-manage', {
        body: {
          action: 'end_stream',
          workspace_id: workspaceId,
          stream_id: streamId,
        },
      });
      
      if (response.error) throw new Error(response.error.message);
      if (!response.data?.success) throw new Error(response.data?.error || 'Failed to end stream');
      
      return response.data.stream as LiveStream;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: liveStreamKeys.byWorkspace(variables.workspaceId) });
      queryClient.invalidateQueries({ queryKey: liveStreamKeys.detail(variables.streamId) });
      toast.success('Stream ended successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to end stream');
    },
  });
}

/**
 * Update stream settings
 */
export function useUpdateStream() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ workspaceId, ...input }: UpdateStreamInput & { workspaceId: string }) => {
      const response = await supabase.functions.invoke('youtube-stream-manage', {
        body: {
          action: 'update_stream',
          workspace_id: workspaceId,
          stream_id: input.stream_id,
          title: input.title,
          description: input.description,
          privacy_status: input.privacy_status,
          chat_enabled: input.chat_enabled,
        },
      });
      
      if (response.error) throw new Error(response.error.message);
      if (!response.data?.success) throw new Error(response.data?.error || 'Failed to update stream');
      
      return response.data.stream as LiveStream;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: liveStreamKeys.byWorkspace(variables.workspaceId) });
      queryClient.invalidateQueries({ queryKey: liveStreamKeys.detail(variables.stream_id) });
      toast.success('Stream updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update stream');
    },
  });
}

/**
 * Get live stream status (polling)
 */
export function useLiveStreamStatus(
  streamId: string | undefined, 
  workspaceId: string | undefined,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: [...liveStreamKeys.detail(streamId || ''), 'status'],
    queryFn: async () => {
      if (!streamId || !workspaceId) return null;
      
      const response = await supabase.functions.invoke('youtube-stream-manage', {
        body: {
          action: 'get_status',
          workspace_id: workspaceId,
          stream_id: streamId,
        },
      });
      
      if (response.error) throw new Error(response.error.message);
      return response.data?.status || null;
    },
    enabled: !!streamId && !!workspaceId && enabled,
    refetchInterval: 10000, // Poll every 10 seconds when live
    ...queryPresets.realtime,
  });
}

/**
 * Real-time subscription for stream updates
 */
export function useLiveStreamSubscription(streamId: string | undefined) {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: [...liveStreamKeys.detail(streamId || ''), 'realtime'],
    queryFn: async () => {
      if (!streamId) return null;
      
      // Set up realtime subscription
      const channel = supabase
        .channel(`stream-${streamId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'event_live_streams',
            filter: `id=eq.${streamId}`,
          },
          (_payload) => {
            // Invalidate queries when stream updates
            queryClient.invalidateQueries({ queryKey: liveStreamKeys.detail(streamId) });
          }
        )
        .subscribe();
      
      return { subscribed: true, channel };
    },
    enabled: !!streamId,
    staleTime: Infinity,
  });
}
