import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface PresenceState {
  oderId: string;
  userName: string;
  isTyping: boolean;
  lastSeen: string;
}

interface UseChannelPresenceOptions {
  channelId: string;
  userId: string;
  userName: string;
}

export function useChannelPresence({ channelId, userId, userName }: UseChannelPresenceOptions) {
  const [onlineMembers, setOnlineMembers] = useState<PresenceState[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!channelId || !userId) return;

    // Create presence channel
    channelRef.current = supabase.channel(`presence:${channelId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channelRef.current
      .on('presence', { event: 'sync' }, () => {
        const state = channelRef.current?.presenceState() || {};
        const members: PresenceState[] = [];
        const typing: string[] = [];

        Object.values(state).forEach((presences: any[]) => {
          presences.forEach((presence: any) => {
            members.push(presence);
            if (presence.isTyping && presence.userId !== userId) {
              typing.push(presence.userName);
            }
          });
        });

        setOnlineMembers(members);
        setTypingUsers(typing);
      })
      .on('presence', { event: 'join' }, ({ newPresences: _newPresences }) => {
        // User joined - presence state updated automatically
      })
      .on('presence', { event: 'leave' }, ({ leftPresences: _leftPresences }) => {
        // User left - presence state updated automatically
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channelRef.current?.track({
            userId,
            userName,
            isTyping: false,
            lastSeen: new Date().toISOString(),
          });
        }
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [channelId, userId, userName]);

  // Broadcast typing status
  const setTyping = useCallback(
    async (isTyping: boolean) => {
      if (!channelRef.current) return;

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      await channelRef.current.track({
        userId,
        userName,
        isTyping,
        lastSeen: new Date().toISOString(),
      });

      // Auto-stop typing after 3 seconds
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(async () => {
          await channelRef.current?.track({
            userId,
            userName,
            isTyping: false,
            lastSeen: new Date().toISOString(),
          });
        }, 3000);
      }
    },
    [userId, userName]
  );

  return {
    onlineMembers,
    typingUsers,
    setTyping,
  };
}
