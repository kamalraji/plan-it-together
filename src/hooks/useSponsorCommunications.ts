/**
 * Sponsor Communications Hook - Database-backed communication tracking
 * Replaces mock data in SponsorCommunications component
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys, queryPresets } from '@/lib/query-config';
import { toast } from 'sonner';

// ============================================
// Types
// ============================================

export type CommunicationType = 'email' | 'call' | 'meeting' | 'other';
export type CommunicationStatus = 'sent' | 'received' | 'scheduled' | 'completed';
export type CommunicationDirection = 'inbound' | 'outbound';

export interface SponsorCommunication {
  id: string;
  workspaceId: string;
  sponsorId: string;
  sponsorName: string;
  type: CommunicationType;
  subject: string;
  content: string | null;
  direction: CommunicationDirection;
  status: CommunicationStatus;
  sentAt: string | null;
  scheduledFor: string | null;
  recipientEmail: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface CreateCommunicationInput {
  workspaceId: string;
  sponsorId: string;
  type: CommunicationType;
  subject: string;
  content?: string;
  direction?: CommunicationDirection;
  status?: CommunicationStatus;
  scheduledFor?: string;
  recipientEmail?: string;
}

// ============================================
// Helper Functions
// ============================================

function mapCommunicationFromDb(row: Record<string, unknown>, sponsorName?: string): SponsorCommunication {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    sponsorId: row.sponsor_id as string,
    sponsorName: sponsorName || 'Unknown Sponsor',
    type: (row.type as CommunicationType) || 'email',
    subject: row.subject as string,
    content: row.content as string | null,
    direction: (row.direction as CommunicationDirection) || 'outbound',
    status: (row.status as CommunicationStatus) || 'sent',
    sentAt: row.sent_at as string | null,
    scheduledFor: row.scheduled_for as string | null,
    recipientEmail: row.recipient_email as string | null,
    createdBy: row.created_by as string | null,
    createdAt: row.created_at as string,
  };
}

// ============================================
// Hooks
// ============================================

/**
 * Hook for fetching communications for a workspace
 */
export function useSponsorCommunications(workspaceId: string | undefined, limit: number = 10) {
  return useQuery({
    queryKey: [...queryKeys.workspaces.sponsorCommunications(workspaceId || ''), limit],
    queryFn: async (): Promise<SponsorCommunication[]> => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from('workspace_sponsor_communications')
        .select(`
          *,
          workspace_sponsors!inner(name)
        `)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []).map((row) => {
        const sponsor = row.workspace_sponsors as { name: string } | null;
        return mapCommunicationFromDb(row, sponsor?.name);
      });
    },
    enabled: !!workspaceId,
    ...queryPresets.dynamic,
  });
}

/**
 * Hook for communication mutations
 */
export function useCommunicationMutations(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.workspaces.sponsorCommunications(workspaceId || '');

  const logCommunication = useMutation({
    mutationFn: async (input: CreateCommunicationInput) => {
      const { data: userData } = await supabase.auth.getUser();

      const insertData = {
        workspace_id: input.workspaceId,
        sponsor_id: input.sponsorId,
        type: input.type,
        subject: input.subject,
        content: input.content ?? null,
        direction: input.direction ?? 'outbound',
        status: input.status ?? 'sent',
        sent_at: input.status !== 'scheduled' ? new Date().toISOString() : null,
        scheduled_for: input.scheduledFor ?? null,
        recipient_email: input.recipientEmail ?? null,
        created_by: userData?.user?.id ?? null,
      };

      const { data, error } = await supabase
        .from('workspace_sponsor_communications')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return mapCommunicationFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Communication logged');
    },
    onError: (error: Error) => {
      toast.error(`Failed to log communication: ${error.message}`);
    },
  });

  const deleteCommunication = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_sponsor_communications')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<SponsorCommunication[]>(queryKey);

      queryClient.setQueryData(queryKey, (old: SponsorCommunication[] | undefined) =>
        old?.filter((c) => c.id !== id)
      );

      return { previous };
    },
    onError: (error: Error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(`Failed to delete communication: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onSuccess: () => {
      toast.success('Communication deleted');
    },
  });

  return {
    logCommunication,
    deleteCommunication,
  };
}

/**
 * Hook for communication statistics
 */
export function useCommunicationStats(workspaceId: string | undefined) {
  const { data: communications = [], isLoading } = useSponsorCommunications(workspaceId, 100);

  const thisWeek = communications.filter((c) => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const date = c.sentAt || c.createdAt;
    return new Date(date) >= weekAgo;
  });

  const stats = {
    total: communications.length,
    thisWeek: thisWeek.length,
    emails: communications.filter((c) => c.type === 'email').length,
    calls: communications.filter((c) => c.type === 'call').length,
    meetings: communications.filter((c) => c.type === 'meeting').length,
    scheduled: communications.filter((c) => c.status === 'scheduled').length,
  };

  return { stats, isLoading };
}
