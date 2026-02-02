import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export interface ScheduledReport {
  id: string;
  workspaceId: string;
  reportType: string;
  frequency: string;
  recipients: string[];
  nextRunAt: string | null;
  lastRunAt: string | null;
  isActive: boolean;
  includeChildren: boolean;
  format: string;
  createdBy: string;
}

interface CreateReportInput {
  reportType: string;
  frequency: string;
  recipients: string[];
  includeChildren?: boolean;
  format?: string;
}

export function useScheduledReports(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch scheduled reports
  const reportsQuery = useQuery({
    queryKey: ['scheduled-reports', workspaceId],
    queryFn: async (): Promise<ScheduledReport[]> => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch scheduled reports:', error);
        return [];
      }

      return (data || []).map(row => ({
        id: row.id,
        workspaceId: row.workspace_id,
        reportType: row.report_type,
        frequency: row.frequency,
        recipients: row.recipients || [],
        nextRunAt: row.next_run_at,
        lastRunAt: row.last_run_at,
        isActive: row.is_active ?? true,
        includeChildren: row.include_children ?? true,
        format: row.format,
        createdBy: row.created_by,
      }));
    },
    enabled: !!workspaceId,
  });

  // Create scheduled report
  const createMutation = useMutation({
    mutationFn: async (input: CreateReportInput) => {
      if (!workspaceId || !user?.id) throw new Error('Missing workspace or user');

      // Calculate first run time (next day at 9 AM)
      const nextRun = new Date();
      nextRun.setDate(nextRun.getDate() + 1);
      nextRun.setHours(9, 0, 0, 0);

      const { data, error } = await supabase
        .from('scheduled_reports')
        .insert({
          workspace_id: workspaceId,
          report_type: input.reportType,
          frequency: input.frequency,
          recipients: input.recipients,
          include_children: input.includeChildren ?? true,
          format: input.format || 'csv',
          is_active: true,
          next_run_at: nextRun.toISOString(),
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports', workspaceId] });
      toast.success('Scheduled report created');
    },
    onError: (error: Error) => {
      toast.error('Failed to create scheduled report: ' + error.message);
    },
  });

  // Update scheduled report
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<{
      frequency: string;
      recipients: string[];
      isActive: boolean;
      includeChildren: boolean;
    }>) => {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency;
      if (updates.recipients !== undefined) dbUpdates.recipients = updates.recipients;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
      if (updates.includeChildren !== undefined) dbUpdates.include_children = updates.includeChildren;

      const { error } = await supabase
        .from('scheduled_reports')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports', workspaceId] });
      toast.success('Scheduled report updated');
    },
    onError: () => {
      toast.error('Failed to update scheduled report');
    },
  });

  // Delete scheduled report
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('scheduled_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports', workspaceId] });
      toast.success('Scheduled report deleted');
    },
    onError: () => {
      toast.error('Failed to delete scheduled report');
    },
  });

  return {
    reports: reportsQuery.data || [],
    isLoading: reportsQuery.isLoading,
    createReport: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateReport: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteReport: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
