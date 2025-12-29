import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import type { Notification } from '@/components/routing/NotificationCenter';

// Hook to load and subscribe to notification feed from Supabase
export const useNotificationFeed = () => {
  type DbNotification = Tables<'notifications'>;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (fetchError) throw fetchError;
        if (data) {
          setNotifications(data.map(mapDbNotification));
        }
      } catch (err) {
        console.error('Error fetching notifications from Supabase:', err);
        setError('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    const channel = supabase
      .channel('notifications-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload: any) => {
          const newRow = payload.new as DbNotification;
          setNotifications((current) => [mapDbNotification(newRow), ...current]);
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications' },
        (payload: any) => {
          const updatedRow = payload.new as DbNotification;
          setNotifications((current) =>
            current.map((n) => (n.id === updatedRow.id ? mapDbNotification(updatedRow) : n)),
          );
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'notifications' },
        (payload: any) => {
          const deletedRow = payload.old as DbNotification;
          setNotifications((current) => current.filter((n) => n.id !== deletedRow.id));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = async (notificationId: string) => {
    setNotifications((current) =>
      current.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
    );
    await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
  };

  const markAllAsRead = async () => {
    setNotifications((current) => current.map((n) => ({ ...n, read: true })));
    await supabase.from('notifications').update({ read: true }).eq('read', false);
  };

  const deleteNotification = async (notificationId: string) => {
    setNotifications((current) => current.filter((n) => n.id !== notificationId));
    await supabase.from('notifications').delete().eq('id', notificationId);
  };

  const clearAll = async () => {
    setNotifications([]);
    await supabase.from('notifications').delete();
  };

  return {
    notifications,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  };
};
