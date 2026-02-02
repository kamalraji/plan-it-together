/**
 * Notification Snooze Hook
 * Manages snoozing and un-snoozing of notifications
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/looseClient';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { addMinutes, addHours, setHours, setMinutes, startOfTomorrow } from 'date-fns';

export type SnoozeDuration = '15min' | '1hour' | '4hours' | 'tomorrow' | 'custom';

export interface SnoozedNotification {
  id: string;
  userId: string;
  notificationId: string;
  notificationType: string;
  snoozedUntil: string;
  originalData: Record<string, unknown>;
  createdAt: string;
}

export function useNotificationSnooze() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const queryKey = ['snoozed-notifications', user?.id];

  // Fetch active snoozes
  const { data: snoozedNotifications = [], isLoading } = useQuery({
    queryKey,
    queryFn: async (): Promise<SnoozedNotification[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('notification_snoozes')
        .select('*')
        .eq('user_id', user.id)
        .gte('snoozed_until', new Date().toISOString())
        .order('snoozed_until', { ascending: true });

      if (error) throw error;

      return (data || []).map((s: Record<string, unknown>) => ({
        id: s.id as string,
        userId: s.user_id as string,
        notificationId: s.notification_id as string,
        notificationType: s.notification_type as string,
        snoozedUntil: s.snoozed_until as string,
        originalData: (s.original_data as Record<string, unknown>) || {},
        createdAt: s.created_at as string,
      }));
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // Refetch every minute to check for expired snoozes
  });

  // Calculate snooze end time
  const calculateSnoozeUntil = (duration: SnoozeDuration, customTime?: Date): Date => {
    const now = new Date();
    switch (duration) {
      case '15min':
        return addMinutes(now, 15);
      case '1hour':
        return addHours(now, 1);
      case '4hours':
        return addHours(now, 4);
      case 'tomorrow':
        return setMinutes(setHours(startOfTomorrow(), 9), 0); // 9:00 AM tomorrow
      case 'custom':
        return customTime || addHours(now, 1);
      default:
        return addHours(now, 1);
    }
  };

  // Snooze a notification
  const snoozeMutation = useMutation({
    mutationFn: async ({
      notificationId,
      notificationType,
      duration,
      customTime,
      originalData,
    }: {
      notificationId: string;
      notificationType: string;
      duration: SnoozeDuration;
      customTime?: Date;
      originalData?: Record<string, unknown>;
    }) => {
      if (!user?.id) throw new Error('User required');

      const snoozedUntil = calculateSnoozeUntil(duration, customTime);

      const { data, error } = await supabase
        .from('notification_snoozes')
        .insert({
          user_id: user.id,
          notification_id: notificationId,
          notification_type: notificationType,
          snoozed_until: snoozedUntil.toISOString(),
          original_data: originalData || {},
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey });
      const durationLabels: Record<SnoozeDuration, string> = {
        '15min': '15 minutes',
        '1hour': '1 hour',
        '4hours': '4 hours',
        'tomorrow': 'tomorrow at 9 AM',
        'custom': 'the selected time',
      };
      toast.success(`Notification snoozed for ${durationLabels[variables.duration]}`);
    },
    onError: () => {
      toast.error('Failed to snooze notification');
    },
  });

  // Unsnooze a notification
  const unsnoozeMutation = useMutation({
    mutationFn: async (snoozeId: string) => {
      const { error } = await supabase
        .from('notification_snoozes')
        .delete()
        .eq('id', snoozeId);

      if (error) throw error;
      return snoozeId;
    },
    onMutate: async (snoozeId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<SnoozedNotification[]>(queryKey);
      queryClient.setQueryData(queryKey, (old: SnoozedNotification[] = []) =>
        old.filter((s) => s.id !== snoozeId)
      );
      return { previous };
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error('Failed to unsnooze notification');
    },
    onSuccess: () => {
      toast.success('Notification unsnoozed');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Check if a notification is snoozed
  const isNotificationSnoozed = (notificationId: string): boolean => {
    return snoozedNotifications.some((s) => s.notificationId === notificationId);
  };

  // Get snooze info for a notification
  const getSnoozeInfo = (notificationId: string): SnoozedNotification | undefined => {
    return snoozedNotifications.find((s) => s.notificationId === notificationId);
  };

  return {
    snoozedNotifications,
    isLoading,
    snoozeNotification: (params: {
      notificationId: string;
      notificationType: string;
      duration: SnoozeDuration;
      customTime?: Date;
      originalData?: Record<string, unknown>;
    }) => snoozeMutation.mutate(params),
    unsnoozeNotification: (snoozeId: string) => unsnoozeMutation.mutate(snoozeId),
    isNotificationSnoozed,
    getSnoozeInfo,
    isSnozing: snoozeMutation.isPending,
    isUnsnozing: unsnoozeMutation.isPending,
    snoozedCount: snoozedNotifications.length,
  };
}
