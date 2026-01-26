import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface EncryptedCredentials {
  access_token?: string;
  refresh_token?: string;
  channel_id?: string;
  channel_name?: string;
  channel_thumbnail?: string;
  subscriber_count?: number;
  is_live_enabled?: boolean;
}

export interface YouTubeChannel {
  id: string;
  channel_id: string;
  channel_name: string;
  channel_thumbnail?: string;
  subscriber_count?: number;
  is_live_enabled: boolean;
  expires_at: string;
  is_active: boolean;
}

interface UseYouTubeOAuthOptions {
  workspaceId: string;
  onSuccess?: (channel: YouTubeChannel) => void;
  onError?: (error: string) => void;
}

function parseEncryptedCredentials(data: unknown): EncryptedCredentials | null {
  if (typeof data === 'object' && data !== null) {
    return data as EncryptedCredentials;
  }
  return null;
}

export function useYouTubeOAuth({ workspaceId, onSuccess, onError }: UseYouTubeOAuthOptions) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [channel, setChannel] = useState<YouTubeChannel | null>(null);

  // Fetch existing channel connection
  const fetchChannel = useCallback(async () => {
    if (!workspaceId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('workspace_social_api_credentials')
        .select('id, encrypted_credentials, expires_at, is_active')
        .eq('workspace_id', workspaceId)
        .eq('platform', 'youtube')
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        const creds = parseEncryptedCredentials(data.encrypted_credentials);
        if (creds) {
          setChannel({
            id: data.id,
            channel_id: creds.channel_id || '',
            channel_name: creds.channel_name || '',
            channel_thumbnail: creds.channel_thumbnail,
            subscriber_count: creds.subscriber_count,
            is_live_enabled: creds.is_live_enabled || false,
            expires_at: data.expires_at || '',
            is_active: data.is_active || false,
          });
        } else {
          setChannel(null);
        }
      } else {
        setChannel(null);
      }
    } catch (err) {
      logger.error('Failed to fetch YouTube channel', err);
      setChannel(null);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchChannel();
  }, [fetchChannel]);

  // Listen for OAuth popup messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'youtube-oauth-success') {
        setIsConnecting(false);
        fetchChannel();
        toast.success('YouTube channel connected successfully!');
        if (event.data.channel) {
          const channelData: YouTubeChannel = {
            id: event.data.channel.id,
            channel_id: event.data.channel.id,
            channel_name: event.data.channel.name,
            channel_thumbnail: event.data.channel.thumbnail,
            subscriber_count: event.data.channel.subscriberCount,
            is_live_enabled: event.data.channel.isLiveEnabled,
            expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
            is_active: true,
          };
          onSuccess?.(channelData);
        }
      } else if (event.data?.type === 'youtube-oauth-error') {
        setIsConnecting(false);
        const errorMessage = event.data.error || 'Failed to connect YouTube channel';
        toast.error(errorMessage);
        onError?.(errorMessage);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [fetchChannel, onSuccess, onError]);

  // Initiate OAuth flow
  const connect = useCallback(async () => {
    if (!workspaceId) {
      toast.error('Workspace ID is required');
      return;
    }

    setIsConnecting(true);
    try {
      const response = await fetch(
        `https://ltsniuflqfahdcirrmjh.supabase.co/functions/v1/youtube-oauth-connect?action=init&workspace_id=${workspaceId}&redirect_uri=${encodeURIComponent(window.location.href)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to initiate OAuth flow');
      }

      const { oauth_url } = await response.json();

      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        oauth_url,
        'youtube-oauth',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
      );

      if (!popup) {
        throw new Error('Popup was blocked. Please allow popups for this site.');
      }

      // Check if popup was closed without completing OAuth
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setIsConnecting(false);
        }
      }, 1000);

    } catch (err) {
      setIsConnecting(false);
      const message = err instanceof Error ? err.message : 'Failed to connect YouTube channel';
      toast.error(message);
      onError?.(message);
    }
  }, [workspaceId, onError]);

  // Disconnect channel
  const disconnect = useCallback(async () => {
    if (!workspaceId) return;

    try {
      const { error } = await supabase
        .from('workspace_social_api_credentials')
        .delete()
        .eq('workspace_id', workspaceId)
        .eq('platform', 'youtube');

      if (error) throw error;

      setChannel(null);
      toast.success('YouTube channel disconnected');
    } catch (err) {
      logger.error('Failed to disconnect YouTube channel', err);
      toast.error('Failed to disconnect YouTube channel');
    }
  }, [workspaceId]);

  // Refresh token
  const refresh = useCallback(async () => {
    // For now, reconnect to refresh
    await connect();
  }, [connect]);

  return {
    channel,
    isLoading,
    isConnecting,
    connect,
    disconnect,
    refresh,
    refetch: fetchChannel,
  };
}
