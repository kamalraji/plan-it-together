/**
 * Email Campaigns Hook - Database-backed email campaign management
 * Replaces mock data in EmailCampaignTracker component
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys, queryPresets } from '@/lib/query-config';
import { toast } from 'sonner';

// ============================================
// Types
// ============================================

export type EmailCampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'completed' | 'failed';

export interface EmailCampaign {
  id: string;
  workspaceId: string;
  name: string;
  subject: string;
  status: EmailCampaignStatus;
  recipients: number;
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  scheduledFor: string | null;
  sentAt: string | null;
  templateId: string | null;
  segmentId: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmailCampaignInput {
  workspaceId: string;
  name: string;
  subject: string;
  templateId?: string;
  segmentId?: string;
  scheduledFor?: string;
}

export interface UpdateEmailCampaignInput {
  name?: string;
  subject?: string;
  status?: EmailCampaignStatus;
  scheduledFor?: string;
  recipients?: number;
}

// ============================================
// Helper Functions
// ============================================

function mapEmailCampaignFromDb(row: Record<string, unknown>): EmailCampaign {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    name: row.name as string,
    subject: row.subject as string,
    status: (row.status as EmailCampaignStatus) || 'draft',
    recipients: Number(row.recipients) || 0,
    sentCount: Number(row.sent_count) || 0,
    openedCount: Number(row.opened_count) || 0,
    clickedCount: Number(row.clicked_count) || 0,
    bouncedCount: Number(row.bounced_count) || 0,
    scheduledFor: row.scheduled_for as string | null,
    sentAt: row.sent_at as string | null,
    templateId: row.template_id as string | null,
    segmentId: row.segment_id as string | null,
    createdBy: row.created_by as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ============================================
// Hooks
// ============================================

/**
 * Hook for fetching email campaigns for a workspace
 */
export function useEmailCampaigns(workspaceId: string | undefined, filters?: { status?: EmailCampaignStatus }) {
  return useQuery({
    queryKey: [...queryKeys.workspaces.emailCampaigns(workspaceId || ''), filters],
    queryFn: async (): Promise<EmailCampaign[]> => {
      if (!workspaceId) return [];

      let query = supabase
        .from('workspace_email_campaigns')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(mapEmailCampaignFromDb);
    },
    enabled: !!workspaceId,
    ...queryPresets.dynamic,
  });
}

/**
 * Hook for email campaign mutations
 */
export function useEmailCampaignMutations(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.workspaces.emailCampaigns(workspaceId || '');

  const createCampaign = useMutation({
    mutationFn: async (input: CreateEmailCampaignInput) => {
      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('workspace_email_campaigns')
        .insert({
          workspace_id: input.workspaceId,
          name: input.name,
          subject: input.subject,
          template_id: input.templateId,
          segment_id: input.segmentId,
          scheduled_for: input.scheduledFor,
          status: input.scheduledFor ? 'scheduled' : 'draft',
          created_by: userData?.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return mapEmailCampaignFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Email campaign created');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create campaign: ${error.message}`);
    },
  });

  const updateCampaign = useMutation({
    mutationFn: async ({ id, ...input }: UpdateEmailCampaignInput & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.subject !== undefined) updateData.subject = input.subject;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.scheduledFor !== undefined) updateData.scheduled_for = input.scheduledFor;
      if (input.recipients !== undefined) updateData.recipients = input.recipients;

      const { data, error } = await supabase
        .from('workspace_email_campaigns')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapEmailCampaignFromDb(data);
    },
    onMutate: async ({ id, ...input }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<EmailCampaign[]>(queryKey);

      queryClient.setQueryData(queryKey, (old: EmailCampaign[] | undefined) =>
        old?.map((c) => (c.id === id ? { ...c, ...input } : c))
      );

      return { previous };
    },
    onError: (error: Error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(`Failed to update campaign: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onSuccess: () => {
      toast.success('Campaign updated');
    },
  });

  const sendCampaign = useMutation({
    mutationFn: async (id: string) => {
      // In a real implementation, this would trigger an edge function
      const { data, error } = await supabase
        .from('workspace_email_campaigns')
        .update({
          status: 'sending',
          sent_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapEmailCampaignFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Campaign sending started');
    },
    onError: (error: Error) => {
      toast.error(`Failed to send campaign: ${error.message}`);
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_email_campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<EmailCampaign[]>(queryKey);

      queryClient.setQueryData(queryKey, (old: EmailCampaign[] | undefined) =>
        old?.filter((c) => c.id !== id)
      );

      return { previous };
    },
    onError: (error: Error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(`Failed to delete campaign: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onSuccess: () => {
      toast.success('Campaign deleted');
    },
  });

  return {
    createCampaign,
    updateCampaign,
    sendCampaign,
    deleteCampaign,
  };
}

/**
 * Hook for email campaign statistics
 */
export function useEmailCampaignStats(workspaceId: string | undefined) {
  const { data: campaigns = [], isLoading } = useEmailCampaigns(workspaceId);

  const sentCampaigns = campaigns.filter((c) => c.status === 'sent' || c.status === 'completed');
  const totalSent = sentCampaigns.reduce((sum, c) => sum + c.sentCount, 0);
  const totalOpened = sentCampaigns.reduce((sum, c) => sum + c.openedCount, 0);
  const totalClicked = sentCampaigns.reduce((sum, c) => sum + c.clickedCount, 0);

  const stats = {
    total: campaigns.length,
    draft: campaigns.filter((c) => c.status === 'draft').length,
    scheduled: campaigns.filter((c) => c.status === 'scheduled').length,
    sent: sentCampaigns.length,
    totalRecipients: campaigns.reduce((sum, c) => sum + c.recipients, 0),
    totalSent,
    totalOpened,
    totalClicked,
    avgOpenRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0,
    avgClickRate: totalOpened > 0 ? Math.round((totalClicked / totalOpened) * 100) : 0,
  };

  return { stats, isLoading };
}
