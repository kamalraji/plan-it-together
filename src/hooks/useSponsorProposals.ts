/**
 * Sponsor Proposals Hook - Database-backed proposal pipeline
 * Replaces mock data in ProposalPipeline component
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys, queryPresets } from '@/lib/query-config';
import { toast } from 'sonner';

// ============================================
// Types
// ============================================

export type ProposalStage = 'draft' | 'sent' | 'negotiation' | 'closed-won' | 'closed-lost';

export interface SponsorProposal {
  id: string;
  workspaceId: string;
  sponsorId: string | null;
  company: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  tier: string;
  value: number;
  stage: ProposalStage;
  proposalDocumentUrl: string | null;
  nextFollowUpDate: string | null;
  assignedTo: string | null;
  notes: string | null;
  stageEnteredAt: string | null;
  createdAt: string;
  updatedAt: string;
  daysInStage: number;
}

export interface CreateProposalInput {
  workspaceId: string;
  company: string;
  tier: string;
  value: number;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  stage?: ProposalStage;
  notes?: string;
}

export interface UpdateProposalInput {
  company?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  tier?: string;
  value?: number;
  stage?: ProposalStage;
  proposalDocumentUrl?: string;
  nextFollowUpDate?: string;
  notes?: string;
}

// ============================================
// Helper Functions
// ============================================

function calculateDaysInStage(stageEnteredAt: string | null, createdAt: string): number {
  const referenceDate = stageEnteredAt || createdAt;
  if (!referenceDate) return 0;
  const diffMs = Date.now() - new Date(referenceDate).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function mapProposalFromDb(row: Record<string, unknown>): SponsorProposal {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    sponsorId: row.sponsor_id as string | null,
    company: row.company_name as string,
    contactName: row.contact_name as string | null,
    contactEmail: row.contact_email as string | null,
    contactPhone: row.contact_phone as string | null,
    tier: (row.proposed_tier as string) || 'Bronze',
    value: Number(row.proposed_value) || 0,
    stage: (row.stage as ProposalStage) || 'draft',
    proposalDocumentUrl: row.proposal_document_url as string | null,
    nextFollowUpDate: row.next_follow_up_date as string | null,
    assignedTo: row.assigned_to as string | null,
    notes: row.notes as string | null,
    stageEnteredAt: row.stage_entered_at as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    daysInStage: calculateDaysInStage(
      row.stage_entered_at as string | null,
      row.created_at as string
    ),
  };
}

// ============================================
// Hooks
// ============================================

/**
 * Hook for fetching proposals for a workspace
 */
export function useSponsorProposals(workspaceId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workspaces.sponsorProposals(workspaceId || ''),
    queryFn: async (): Promise<SponsorProposal[]> => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from('workspace_sponsor_proposals')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapProposalFromDb);
    },
    enabled: !!workspaceId,
    ...queryPresets.dynamic,
  });
}

/**
 * Hook for proposal mutations
 */
export function useProposalMutations(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.workspaces.sponsorProposals(workspaceId || '');

  const createProposal = useMutation({
    mutationFn: async (input: CreateProposalInput) => {
      const { data: userData } = await supabase.auth.getUser();

      const insertData = {
        workspace_id: input.workspaceId,
        company_name: input.company,
        contact_name: input.contactName ?? null,
        contact_email: input.contactEmail ?? null,
        contact_phone: input.contactPhone ?? null,
        proposed_tier: input.tier,
        proposed_value: input.value,
        stage: input.stage ?? 'draft',
        stage_entered_at: new Date().toISOString(),
        notes: input.notes ?? null,
        created_by: userData?.user?.id ?? null,
      };

      const { data, error } = await supabase
        .from('workspace_sponsor_proposals')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return mapProposalFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Proposal created');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create proposal: ${error.message}`);
    },
  });

  const updateProposal = useMutation({
    mutationFn: async ({ id, ...input }: UpdateProposalInput & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      if (input.company !== undefined) updateData.company_name = input.company;
      if (input.contactName !== undefined) updateData.contact_name = input.contactName;
      if (input.contactEmail !== undefined) updateData.contact_email = input.contactEmail;
      if (input.contactPhone !== undefined) updateData.contact_phone = input.contactPhone;
      if (input.tier !== undefined) updateData.proposed_tier = input.tier;
      if (input.value !== undefined) updateData.proposed_value = input.value;
      if (input.stage !== undefined) {
        updateData.stage = input.stage;
        updateData.stage_entered_at = new Date().toISOString();
      }
      if (input.proposalDocumentUrl !== undefined) updateData.proposal_document_url = input.proposalDocumentUrl;
      if (input.nextFollowUpDate !== undefined) updateData.next_follow_up_date = input.nextFollowUpDate;
      if (input.notes !== undefined) updateData.notes = input.notes;

      const { data, error } = await supabase
        .from('workspace_sponsor_proposals')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapProposalFromDb(data);
    },
    onMutate: async ({ id, ...input }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<SponsorProposal[]>(queryKey);

      queryClient.setQueryData(queryKey, (old: SponsorProposal[] | undefined) =>
        old?.map((p) => (p.id === id ? { ...p, ...input } : p))
      );

      return { previous };
    },
    onError: (error: Error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(`Failed to update proposal: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onSuccess: () => {
      toast.success('Proposal updated');
    },
  });

  const moveToStage = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: ProposalStage }) => {
      const { data, error } = await supabase
        .from('workspace_sponsor_proposals')
        .update({ 
          stage,
          stage_entered_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapProposalFromDb(data);
    },
    onSuccess: (_, { stage }) => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(`Proposal moved to ${stage.replace('-', ' ')}`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to move proposal: ${error.message}`);
    },
  });

  const deleteProposal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_sponsor_proposals')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<SponsorProposal[]>(queryKey);

      queryClient.setQueryData(queryKey, (old: SponsorProposal[] | undefined) =>
        old?.filter((p) => p.id !== id)
      );

      return { previous };
    },
    onError: (error: Error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(`Failed to delete proposal: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onSuccess: () => {
      toast.success('Proposal deleted');
    },
  });

  return {
    createProposal,
    updateProposal,
    moveToStage,
    deleteProposal,
  };
}

/**
 * Hook for proposal pipeline statistics
 */
export function useProposalStats(workspaceId: string | undefined) {
  const { data: proposals = [], isLoading } = useSponsorProposals(workspaceId);

  const getStageStats = (stage: ProposalStage) => {
    const stageProposals = proposals.filter((p) => p.stage === stage);
    return {
      count: stageProposals.length,
      value: stageProposals.reduce((sum, p) => sum + p.value, 0),
    };
  };

  const stats = {
    total: proposals.length,
    totalValue: proposals.reduce((sum, p) => sum + p.value, 0),
    draft: getStageStats('draft'),
    sent: getStageStats('sent'),
    negotiation: getStageStats('negotiation'),
    closedWon: getStageStats('closed-won'),
    closedLost: getStageStats('closed-lost'),
    conversionRate: proposals.length > 0
      ? Math.round((getStageStats('closed-won').count / proposals.length) * 100)
      : 0,
  };

  return { stats, isLoading };
}
