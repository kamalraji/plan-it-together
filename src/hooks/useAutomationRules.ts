import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { Json } from '@/integrations/supabase/types';
import {
  AutomationRule,
  AutomationExecutionLog,
  AutomationTrigger,
  AutomationAction,
  TriggerConfig,
  ActionConfig,
  AutomationConditions,
} from '@/lib/automationTypes';

interface CreateRuleInput {
  name: string;
  description?: string;
  triggerType: AutomationTrigger;
  triggerConfig: TriggerConfig;
  actionType: AutomationAction;
  actionConfig: ActionConfig;
  conditions?: AutomationConditions;
  isEnabled?: boolean;
}

function mapDbToRule(row: any): AutomationRule {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    description: row.description,
    triggerType: row.trigger_type as AutomationTrigger,
    triggerConfig: row.trigger_config as TriggerConfig,
    actionType: row.action_type as AutomationAction,
    actionConfig: row.action_config as ActionConfig,
    conditions: row.conditions as AutomationConditions,
    isEnabled: row.is_enabled,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDbToLog(row: any): AutomationExecutionLog {
  return {
    id: row.id,
    ruleId: row.rule_id,
    taskId: row.task_id,
    triggeredAt: row.triggered_at,
    actionTaken: row.action_taken,
    success: row.success,
    errorMessage: row.error_message,
    metadata: row.metadata,
  };
}

export function useAutomationRules(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch all automation rules for workspace
  const rulesQuery = useQuery({
    queryKey: ['automation-rules', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('workspace_automation_rules')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapDbToRule);
    },
    enabled: !!workspaceId,
  });

  // Fetch execution logs
  const logsQuery = useQuery({
    queryKey: ['automation-logs', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('automation_execution_logs')
        .select(`
          *,
          rule:workspace_automation_rules!rule_id (name)
        `)
        .order('triggered_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []).map(mapDbToLog);
    },
    enabled: !!workspaceId,
  });

  // Create rule mutation
  const createRuleMutation = useMutation({
    mutationFn: async (input: CreateRuleInput) => {
      if (!workspaceId || !user?.id) throw new Error('Missing workspace or user');
      const { data, error } = await supabase
        .from('workspace_automation_rules')
        .insert([{
          workspace_id: workspaceId,
          name: input.name,
          description: input.description,
          trigger_type: input.triggerType,
          trigger_config: JSON.parse(JSON.stringify(input.triggerConfig)) as Json,
          action_type: input.actionType,
          action_config: JSON.parse(JSON.stringify(input.actionConfig)) as Json,
          conditions: JSON.parse(JSON.stringify(input.conditions || {})) as Json,
          is_enabled: input.isEnabled ?? true,
          created_by: user.id,
        }])
        .select()
        .single();
      if (error) throw error;
      return mapDbToRule(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules', workspaceId] });
      toast({ title: 'Automation rule created' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create rule', description: error.message, variant: 'destructive' });
    },
  });

  // Update rule mutation
  const updateRuleMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CreateRuleInput> & { id: string }) => {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.triggerType !== undefined) dbUpdates.trigger_type = updates.triggerType;
      if (updates.triggerConfig !== undefined) dbUpdates.trigger_config = updates.triggerConfig;
      if (updates.actionType !== undefined) dbUpdates.action_type = updates.actionType;
      if (updates.actionConfig !== undefined) dbUpdates.action_config = updates.actionConfig;
      if (updates.conditions !== undefined) dbUpdates.conditions = updates.conditions;
      if (updates.isEnabled !== undefined) dbUpdates.is_enabled = updates.isEnabled;

      const { data, error } = await supabase
        .from('workspace_automation_rules')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return mapDbToRule(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules', workspaceId] });
      toast({ title: 'Automation rule updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update rule', description: error.message, variant: 'destructive' });
    },
  });

  // Toggle rule enabled/disabled
  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, isEnabled }: { id: string; isEnabled: boolean }) => {
      const { error } = await supabase
        .from('workspace_automation_rules')
        .update({ is_enabled: isEnabled })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { isEnabled }) => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules', workspaceId] });
      toast({ title: isEnabled ? 'Rule enabled' : 'Rule disabled' });
    },
  });

  // Delete rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_automation_rules')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules', workspaceId] });
      toast({ title: 'Automation rule deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete rule', description: error.message, variant: 'destructive' });
    },
  });

  return {
    rules: rulesQuery.data ?? [],
    isLoading: rulesQuery.isLoading,
    executionLogs: logsQuery.data ?? [],
    isLoadingLogs: logsQuery.isLoading,
    createRule: createRuleMutation.mutate,
    isCreating: createRuleMutation.isPending,
    updateRule: updateRuleMutation.mutate,
    isUpdating: updateRuleMutation.isPending,
    toggleRule: (id: string, isEnabled: boolean) => toggleRuleMutation.mutate({ id, isEnabled }),
    deleteRule: deleteRuleMutation.mutate,
    isDeleting: deleteRuleMutation.isPending,
    refetch: () => {
      rulesQuery.refetch();
      logsQuery.refetch();
    },
  };
}
