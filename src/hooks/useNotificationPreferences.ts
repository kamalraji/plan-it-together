import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NotificationPreferences {
  id: string;
  user_id: string;
  batch_enabled: boolean;
  batch_window_minutes: number;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  email_digest_enabled: boolean;
  email_digest_frequency: string;
  push_enabled: boolean;
  channel_overrides: Record<string, any>;
}

export function useNotificationPreferences(userId: string) {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const { data, error } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setPreferences(data as unknown as NotificationPreferences);
        } else {
          // Create default preferences
          const { data: newData, error: insertError } = await supabase
            .from('notification_preferences')
            .insert({
              user_id: userId,
              batch_enabled: true,
              batch_window_minutes: 5,
              quiet_hours_enabled: false,
              email_digest_enabled: true,
              email_digest_frequency: 'daily',
              push_enabled: true,
            })
            .select()
            .single();

          if (insertError) throw insertError;
          setPreferences(newData as unknown as NotificationPreferences);
        }
      } catch (err) {
        console.error('Error fetching notification preferences:', err);
        toast({
          title: 'Error',
          description: 'Failed to load notification preferences',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchPreferences();
    }
  }, [userId, toast]);

  // Update a single preference
  const updatePreference = useCallback(async (key: keyof NotificationPreferences, value: any) => {
    if (!preferences) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update({ [key]: value })
        .eq('user_id', userId);

      if (error) throw error;

      setPreferences(prev => prev ? { ...prev, [key]: value } : null);
    } catch (err) {
      console.error('Error updating preference:', err);
      toast({
        title: 'Error',
        description: 'Failed to save preference',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [preferences, userId, toast]);

  // Update channel-specific override
  const updateChannelOverride = useCallback(async (channelId: string, settings: any) => {
    if (!preferences) return;

    const newOverrides = {
      ...preferences.channel_overrides,
      [channelId]: settings,
    };

    await updatePreference('channel_overrides', newOverrides);
  }, [preferences, updatePreference]);

  return {
    preferences,
    isLoading,
    isSaving,
    updatePreference,
    updateChannelOverride,
  };
}
