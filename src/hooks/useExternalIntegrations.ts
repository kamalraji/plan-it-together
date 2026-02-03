import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ExternalIntegration {
  id: string;
  workspace_id: string;
  integration_type: 'google_calendar' | 'github' | 'jira' | 'zapier';
  name: string;
  config: Record<string, any>;
  is_active: boolean;
  last_sync_at: string | null;
  sync_status: 'idle' | 'syncing' | 'error' | 'success';
  sync_error: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ZapierWebhook {
  id: string;
  workspace_id: string;
  name: string;
  webhook_url: string;
  trigger_event: string;
  is_active: boolean;
  last_triggered_at: string | null;
  trigger_count: number;
  created_by: string;
  created_at: string;
}

export interface GitHubLink {
  id: string;
  workspace_id: string;
  task_id: string;
  integration_id: string;
  github_repo: string;
  github_issue_number: number;
  github_issue_url: string;
  github_issue_state: string | null;
  synced_at: string;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  workspace_id: string;
  task_id: string | null;
  integration_id: string;
  external_event_id: string;
  event_title: string;
  event_start: string;
  event_end: string | null;
  event_url: string | null;
  is_all_day: boolean;
  synced_at: string;
  created_at: string;
}

export function useExternalIntegrations(workspaceId: string) {
  const [integrations, setIntegrations] = useState<ExternalIntegration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchIntegrations = useCallback(async () => {
    if (!workspaceId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('workspace_external_integrations')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIntegrations((data as unknown as ExternalIntegration[]) || []);
    } catch (error) {
      console.error('Error fetching integrations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const createIntegration = useCallback(
    async (
      type: ExternalIntegration['integration_type'],
      name: string,
      config: Record<string, any> = {}
    ) => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('Not authenticated');

        const { data, error } = await supabase
          .from('workspace_external_integrations')
          .insert({
            workspace_id: workspaceId,
            integration_type: type,
            name,
            config,
            created_by: userData.user.id,
          })
          .select()
          .single();

        if (error) throw error;
        await fetchIntegrations();
        toast({ title: 'Integration added' });
        return data as unknown as ExternalIntegration;
      } catch (error) {
        console.error('Error creating integration:', error);
        toast({
          title: 'Error',
          description: 'Failed to add integration',
          variant: 'destructive',
        });
        return null;
      }
    },
    [workspaceId, toast, fetchIntegrations]
  );

  const updateIntegration = useCallback(
    async (id: string, updates: Partial<ExternalIntegration>) => {
      try {
        const { error } = await supabase
          .from('workspace_external_integrations')
          .update(updates)
          .eq('id', id);

        if (error) throw error;
        await fetchIntegrations();
        return true;
      } catch (error) {
        console.error('Error updating integration:', error);
        toast({
          title: 'Error',
          description: 'Failed to update integration',
          variant: 'destructive',
        });
        return false;
      }
    },
    [toast, fetchIntegrations]
  );

  const deleteIntegration = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase
          .from('workspace_external_integrations')
          .delete()
          .eq('id', id);

        if (error) throw error;
        await fetchIntegrations();
        toast({ title: 'Integration removed' });
        return true;
      } catch (error) {
        console.error('Error deleting integration:', error);
        toast({
          title: 'Error',
          description: 'Failed to remove integration',
          variant: 'destructive',
        });
        return false;
      }
    },
    [toast, fetchIntegrations]
  );

  return {
    integrations,
    isLoading,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    refetch: fetchIntegrations,
  };
}

export function useZapierWebhooks(workspaceId: string) {
  const [webhooks, setWebhooks] = useState<ZapierWebhook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchWebhooks = useCallback(async () => {
    if (!workspaceId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('workspace_zapier_webhooks')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWebhooks((data as unknown as ZapierWebhook[]) || []);
    } catch (error) {
      console.error('Error fetching webhooks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const createWebhook = useCallback(
    async (name: string, webhookUrl: string, triggerEvent: string) => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('Not authenticated');

        const { data, error } = await supabase
          .from('workspace_zapier_webhooks')
          .insert({
            workspace_id: workspaceId,
            name,
            webhook_url: webhookUrl,
            trigger_event: triggerEvent,
            created_by: userData.user.id,
          })
          .select()
          .single();

        if (error) throw error;
        await fetchWebhooks();
        toast({ title: 'Webhook added' });
        return data as unknown as ZapierWebhook;
      } catch (error) {
        console.error('Error creating webhook:', error);
        toast({
          title: 'Error',
          description: 'Failed to add webhook',
          variant: 'destructive',
        });
        return null;
      }
    },
    [workspaceId, toast, fetchWebhooks]
  );

  const triggerWebhook = useCallback(
    async (webhook: ZapierWebhook, payload: Record<string, any> = {}) => {
      try {
        await fetch(webhook.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          mode: 'no-cors',
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            workspace_id: workspaceId,
            trigger_event: webhook.trigger_event,
            ...payload,
          }),
        });

        // Update trigger count
        await supabase
          .from('workspace_zapier_webhooks')
          .update({
            last_triggered_at: new Date().toISOString(),
            trigger_count: webhook.trigger_count + 1,
          })
          .eq('id', webhook.id);

        toast({ title: 'Webhook triggered' });
        await fetchWebhooks();
      } catch (error) {
        console.error('Error triggering webhook:', error);
        toast({
          title: 'Error',
          description: 'Failed to trigger webhook',
          variant: 'destructive',
        });
      }
    },
    [workspaceId, toast, fetchWebhooks]
  );

  const deleteWebhook = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase
          .from('workspace_zapier_webhooks')
          .delete()
          .eq('id', id);

        if (error) throw error;
        await fetchWebhooks();
        toast({ title: 'Webhook removed' });
        return true;
      } catch (error) {
        console.error('Error deleting webhook:', error);
        toast({
          title: 'Error',
          description: 'Failed to remove webhook',
          variant: 'destructive',
        });
        return false;
      }
    },
    [toast, fetchWebhooks]
  );

  return {
    webhooks,
    isLoading,
    createWebhook,
    triggerWebhook,
    deleteWebhook,
    refetch: fetchWebhooks,
  };
}
