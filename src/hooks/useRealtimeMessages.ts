import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface ChannelMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  sender_name: string | null;
  content: string;
  message_type: 'text' | 'task_update' | 'system' | 'broadcast';
  attachments: any[];
  is_edited: boolean;
  edited_at: string | null;
  created_at: string;
}

interface UseRealtimeMessagesOptions {
  channelId: string;
  onNewMessage?: (message: ChannelMessage) => void;
}

export function useRealtimeMessages({ channelId, onNewMessage }: UseRealtimeMessagesOptions) {
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    if (!channelId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('channel_messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (fetchError) throw fetchError;
      setMessages((data as ChannelMessage[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch messages'));
    } finally {
      setIsLoading(false);
    }
  }, [channelId]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!channelId) return;

    fetchMessages();

    // Create realtime subscription
    channelRef.current = supabase
      .channel(`channel-messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'channel_messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChannelMessage;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
          onNewMessage?.(newMessage);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'channel_messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as ChannelMessage;
          setMessages((prev) =>
            prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'channel_messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          const deletedId = payload.old.id;
          setMessages((prev) => prev.filter((m) => m.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [channelId, fetchMessages, onNewMessage]);

  // Send message with optimistic update
  const sendMessage = useCallback(
    async (content: string, senderName: string, messageType: ChannelMessage['message_type'] = 'text') => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const optimisticId = `temp-${Date.now()}`;
      const optimisticMessage: ChannelMessage = {
        id: optimisticId,
        channel_id: channelId,
        sender_id: userData.user.id,
        sender_name: senderName,
        content,
        message_type: messageType,
        attachments: [],
        is_edited: false,
        edited_at: null,
        created_at: new Date().toISOString(),
      };

      // Optimistic update
      setMessages((prev) => [...prev, optimisticMessage]);

      try {
        const { data, error: insertError } = await supabase
          .from('channel_messages')
          .insert({
            channel_id: channelId,
            sender_id: userData.user.id,
            sender_name: senderName,
            content,
            message_type: messageType,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Replace optimistic message with real one
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticId ? (data as ChannelMessage) : m))
        );

        return data as ChannelMessage;
      } catch (err) {
        // Rollback optimistic update
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        throw err;
      }
    },
    [channelId]
  );

  // Edit message
  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    const { error: updateError } = await supabase
      .from('channel_messages')
      .update({
        content: newContent,
        is_edited: true,
        edited_at: new Date().toISOString(),
      })
      .eq('id', messageId);

    if (updateError) throw updateError;
  }, []);

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    const { error: deleteError } = await supabase
      .from('channel_messages')
      .delete()
      .eq('id', messageId);

    if (deleteError) throw deleteError;
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    editMessage,
    deleteMessage,
    refetch: fetchMessages,
  };
}
