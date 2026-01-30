import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface WorkspaceSettings {
  id?: string;
  workspace_id: string;
  notify_task_updates: boolean;
  notify_new_members: boolean;
  notify_messages: boolean;
  notify_weekly_digest: boolean;
  allow_member_invites: boolean;
  allow_task_creation: boolean;
  public_visibility: boolean;
  default_task_priority: 'low' | 'medium' | 'high' | 'urgent';
  auto_archive_after_event: boolean;
  auto_archive_days_after: number;
}

const DEFAULT_SETTINGS: Omit<WorkspaceSettings, 'workspace_id'> = {
  notify_task_updates: true,
  notify_new_members: true,
  notify_messages: true,
  notify_weekly_digest: false,
  allow_member_invites: true,
  allow_task_creation: true,
  public_visibility: false,
  default_task_priority: 'medium',
  auto_archive_after_event: false,
  auto_archive_days_after: 7,
};

export function useWorkspaceSettings(workspaceId: string | undefined) {
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!workspaceId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('workspace_settings')
        .select('*')
        .eq('workspace_id', workspaceId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data as WorkspaceSettings);
      } else {
        // No settings exist yet, use defaults
        setSettings({ ...DEFAULT_SETTINGS, workspace_id: workspaceId });
      }
    } catch (_error) {
      setSettings({ ...DEFAULT_SETTINGS, workspace_id: workspaceId });
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSetting = async <K extends keyof WorkspaceSettings>(
    key: K,
    value: WorkspaceSettings[K]
  ) => {
    if (!workspaceId || !settings) return;

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setIsSaving(true);

    try {
      const { id: _id, ...settingsWithoutId } = newSettings;
      const { error } = await supabase
        .from('workspace_settings')
        .upsert({
          ...settingsWithoutId,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'workspace_id',
        });

      if (error) throw error;
    } catch (_error) {
      toast.error('Failed to save setting');
      // Revert on error
      fetchSettings();
    } finally {
      setIsSaving(false);
    }
  };

  return {
    settings,
    isLoading,
    isSaving,
    updateSetting,
    refetch: fetchSettings,
  };
}
