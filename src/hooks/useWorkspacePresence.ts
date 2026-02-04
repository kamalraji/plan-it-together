/**
 * Workspace Presence Hook
 * Tracks user presence at the workspace level with online/away status
 * Provides heartbeat mechanism and auto-cleanup
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface WorkspacePresenceUser {
  userId: string;
  userName: string;
  avatarUrl?: string;
  status: 'online' | 'away' | 'busy';
  currentView?: string;
  lastSeen: string;
}

interface UseWorkspacePresenceOptions {
  workspaceId: string;
  userId?: string;
  userName?: string;
  avatarUrl?: string;
  enabled?: boolean;
  currentView?: string;
}

const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const AWAY_THRESHOLD = 60000; // 1 minute without activity = away

export function useWorkspacePresence({
  workspaceId,
  userId,
  userName,
  avatarUrl,
  enabled = true,
  currentView = 'dashboard',
}: UseWorkspacePresenceOptions) {
  const [onlineUsers, setOnlineUsers] = useState<WorkspacePresenceUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Track user activity
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Update presence in database and broadcast
  const updatePresence = useCallback(async (status: 'online' | 'away' | 'busy') => {
    if (!channelRef.current || !userId) return;

    const presenceState = {
      userId,
      userName: userName || 'Unknown',
      avatarUrl,
      status,
      currentView,
      lastSeen: new Date().toISOString(),
    };

    await channelRef.current.track(presenceState);

    // Also update the database for persistence
    try {
      await supabase
        .from('workspace_presence')
        .upsert({
          workspace_id: workspaceId,
          user_id: userId,
          status,
          current_view: currentView,
          last_heartbeat: new Date().toISOString(),
        }, {
          onConflict: 'workspace_id,user_id',
        });
    } catch (error) {
      // Non-critical, presence still works via realtime
      console.debug('Presence DB update failed:', error);
    }
  }, [userId, userName, avatarUrl, currentView, workspaceId]);

  // Set user status
  const setStatus = useCallback((status: 'online' | 'away' | 'busy') => {
    updatePresence(status);
  }, [updatePresence]);

  useEffect(() => {
    if (!enabled || !workspaceId || !userId) return;

    // Create presence channel
    channelRef.current = supabase.channel(`workspace-presence:${workspaceId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    // Handle presence sync
    channelRef.current
      .on('presence', { event: 'sync' }, () => {
        const state = channelRef.current?.presenceState() || {};
        const users: WorkspacePresenceUser[] = [];

        Object.values(state).forEach((presences: any[]) => {
          presences.forEach((presence: WorkspacePresenceUser) => {
            users.push(presence);
          });
        });

        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        // User joined
        console.debug('User joined workspace:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        // User left
        console.debug('User left workspace:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          // Initial presence track
          await channelRef.current?.track({
            userId,
            userName: userName || 'Unknown',
            avatarUrl,
            status: 'online',
            currentView,
            lastSeen: new Date().toISOString(),
          });
        }
      });

    // Heartbeat mechanism
    heartbeatRef.current = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      const newStatus = timeSinceActivity > AWAY_THRESHOLD ? 'away' : 'online';
      updatePresence(newStatus);
    }, HEARTBEAT_INTERVAL);

    // Track user activity
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    // Cleanup on unmount or tab close
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        updatePresence('away');
      } else {
        updatePresence('online');
        updateActivity();
      }
    };

    const handleBeforeUnload = async () => {
      // Try to clean up presence from database
      if (userId) {
        await supabase
          .from('workspace_presence')
          .delete()
          .eq('workspace_id', workspaceId)
          .eq('user_id', userId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // Clear heartbeat
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }

      // Remove activity listeners
      activityEvents.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });

      // Remove visibility/unload listeners
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // Cleanup channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Clean up database presence
      if (userId) {
        supabase
          .from('workspace_presence')
          .delete()
          .eq('workspace_id', workspaceId)
          .eq('user_id', userId)
          .then(() => {});
      }

      setIsConnected(false);
    };
  }, [workspaceId, userId, userName, avatarUrl, currentView, enabled, updatePresence, updateActivity]);

  // Filter helpers
  const onlineCount = onlineUsers.filter(u => u.status === 'online').length;
  const awayCount = onlineUsers.filter(u => u.status === 'away').length;
  const busyCount = onlineUsers.filter(u => u.status === 'busy').length;

  return {
    onlineUsers,
    onlineCount,
    awayCount,
    busyCount,
    totalActive: onlineUsers.length,
    isConnected,
    setStatus,
  };
}
