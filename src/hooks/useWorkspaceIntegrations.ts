import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { WORKSPACE_INTEGRATION_COLUMNS } from '@/lib/supabase-columns';
import { logger } from '@/lib/logger';

export type Platform = 'slack' | 'discord' | 'teams' | 'webhook';
export type NotificationType = 'broadcast' | 'task_assignment' | 'deadline_reminder' | 'channel_message';

export interface WorkspaceIntegration {
  id: string;
  workspace_id: string;
  platform: Platform;
  name: string;
  webhook_url: string;
  is_active: boolean;
  notification_types: NotificationType[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateIntegrationInput {
  workspace_id: string;
  platform: Platform;
  name: string;
  webhook_url: string;
  notification_types: NotificationType[];
}

export function useWorkspaceIntegrations(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['workspace-integrations', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      
      const { data, error } = await supabase
        .from('workspace_integrations')
        .select(WORKSPACE_INTEGRATION_COLUMNS.detail)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WorkspaceIntegration[];
    },
    enabled: !!workspaceId,
  });

  const createIntegration = useMutation({
    mutationFn: async (input: CreateIntegrationInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('workspace_integrations')
        .insert({
          ...input,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-integrations', workspaceId] });
      toast.success('Integration added successfully');
    },
    onError: (error) => {
      logger.error('Failed to create integration:', error);
      toast.error('Failed to add integration');
    },
  });

  const updateIntegration = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WorkspaceIntegration> & { id: string }) => {
      const { data, error } = await supabase
        .from('workspace_integrations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-integrations', workspaceId] });
      toast.success('Integration updated');
    },
    onError: (error) => {
      logger.error('Failed to update integration:', error);
      toast.error('Failed to update integration');
    },
  });

  const deleteIntegration = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_integrations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-integrations', workspaceId] });
      toast.success('Integration removed');
    },
    onError: (error) => {
      logger.error('Failed to delete integration:', error);
      toast.error('Failed to remove integration');
    },
  });

  const testIntegration = useMutation({
    mutationFn: async (integration: WorkspaceIntegration) => {
      const { data, error } = await supabase.functions.invoke('send-webhook-notification', {
        body: {
          workspace_id: integration.workspace_id,
          notification_type: 'broadcast',
          title: '🔔 Test Notification',
          message: `This is a test notification from your ${integration.name} integration.`,
          metadata: {
            sender_name: 'System',
          },
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Test notification sent!');
    },
    onError: (error) => {
      logger.error('Test notification failed:', error);
      toast.error('Failed to send test notification');
    },
  });

  return {
    integrations,
    isLoading,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    testIntegration,
  };
}
