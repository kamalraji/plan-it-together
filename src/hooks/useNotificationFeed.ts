import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import type { Notification } from '@/components/routing/NotificationCenter';
import { queryPresets } from '@/lib/query-config';

type DbNotification = Tables<'notifications'>;

const mapDbNotification = (row: DbNotification): Notification => ({
  id: row.id,
  title: row.title,
  message: row.message,
  type: (row.type as Notification['type']) ?? 'info',
  category: (row.category as Notification['category']) ?? 'system',
  timestamp: new Date(row.created_at),
  read: row.read,
  actionUrl: row.action_url ?? undefined,
  actionLabel: row.action_label ?? undefined,
  metadata: (row.metadata as Record<string, any> | null) ?? undefined,
});

// Hook to load and subscribe to notification feed from Supabase
export const useNotificationFeed = () => {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, user_id, title, message, type, category, created_at, read, action_url, action_label, avatar_url, metadata, group_key')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data?.map(mapDbNotification) ?? [];
    },
    staleTime: queryPresets.realtime.staleTime,
    gcTime: queryPresets.realtime.gcTime,
  });

  // Set up real-time subscription for updates
  useEffect(() => {
    const channel = supabase
      .channel('notifications-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      if (error) throw error;
    },
    onMutate: async (notificationId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previous = queryClient.getQueryData<Notification[]>(['notifications']);
      queryClient.setQueryData<Notification[]>(['notifications'], (old) =>
        old?.map((n) => (n.id === notificationId ? { ...n, read: true } : n)) ?? []
      );
      return { previous };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(['notifications'], context?.previous);
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('read', false);
      if (error) throw error;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previous = queryClient.getQueryData<Notification[]>(['notifications']);
      queryClient.setQueryData<Notification[]>(['notifications'], (old) =>
        old?.map((n) => ({ ...n, read: true })) ?? []
      );
      return { previous };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(['notifications'], context?.previous);
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      if (error) throw error;
    },
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previous = queryClient.getQueryData<Notification[]>(['notifications']);
      queryClient.setQueryData<Notification[]>(['notifications'], (old) =>
        old?.filter((n) => n.id !== notificationId) ?? []
      );
      return { previous };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(['notifications'], context?.previous);
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('notifications').delete().neq('id', '');
      if (error) throw error;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previous = queryClient.getQueryData<Notification[]>(['notifications']);
      queryClient.setQueryData<Notification[]>(['notifications'], []);
      return { previous };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(['notifications'], context?.previous);
    },
  });

  return {
    notifications: notificationsQuery.data ?? [],
    loading: notificationsQuery.isLoading,
    error: notificationsQuery.error ? 'Failed to load notifications' : null,
    markAsRead: (notificationId: string) => markAsReadMutation.mutate(notificationId),
    markAllAsRead: () => markAllAsReadMutation.mutate(),
    deleteNotification: (notificationId: string) => deleteNotificationMutation.mutate(notificationId),
    clearAll: () => clearAllMutation.mutate(),
  };
};
