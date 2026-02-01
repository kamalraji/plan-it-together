/**
 * Sponsors Hook - Database-backed sponsor management
 * Replaces mock data in SponsorTracker and related components
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys, queryPresets } from '@/lib/query-config';
import { toast } from 'sonner';

// ============================================
// Types
// ============================================

export type SponsorTier = 'platinum' | 'gold' | 'silver' | 'bronze' | 'partner';
export type SponsorStatus = 'prospect' | 'contacted' | 'negotiating' | 'confirmed' | 'active' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export interface Sponsor {
  id: string;
  workspaceId: string;
  name: string;
  companyName: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  tier: SponsorTier;
  contractValue: number;
  amountPaid: number;
  paymentStatus: PaymentStatus;
  status: SponsorStatus;
  notes: string | null;
  proposalSentAt: string | null;
  contractSignedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSponsorInput {
  workspaceId: string;
  name: string;
  companyName?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  tier: SponsorTier;
  contractValue?: number;
  status?: SponsorStatus;
  notes?: string;
}

export interface UpdateSponsorInput {
  name?: string;
  companyName?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  tier?: SponsorTier;
  contractValue?: number;
  amountPaid?: number;
  paymentStatus?: PaymentStatus;
  status?: SponsorStatus;
  notes?: string;
  proposalSentAt?: string;
  contractSignedAt?: string;
}

// ============================================
// Helper Functions
// ============================================

function mapSponsorFromDb(row: Record<string, unknown>): Sponsor {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    name: row.name as string,
    companyName: row.company_name as string | null,
    contactName: row.contact_name as string | null,
    contactEmail: row.contact_email as string | null,
    contactPhone: row.contact_phone as string | null,
    tier: (row.tier as SponsorTier) || 'bronze',
    contractValue: Number(row.contract_value) || 0,
    amountPaid: Number(row.amount_paid) || 0,
    paymentStatus: (row.payment_status as PaymentStatus) || 'unpaid',
    status: (row.status as SponsorStatus) || 'prospect',
    notes: row.notes as string | null,
    proposalSentAt: row.proposal_sent_at as string | null,
    contractSignedAt: row.contract_signed_at as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ============================================
// Hooks
// ============================================

/**
 * Hook for fetching sponsors for a workspace
 */
export function useSponsors(workspaceId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workspaces.sponsors(workspaceId || ''),
    queryFn: async (): Promise<Sponsor[]> => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from('workspace_sponsors')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapSponsorFromDb);
    },
    enabled: !!workspaceId,
    ...queryPresets.standard,
  });
}

/**
 * Hook for sponsor CRUD operations
 */
export function useSponsorMutations(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.workspaces.sponsors(workspaceId || '');

  const createSponsor = useMutation({
    mutationFn: async (input: CreateSponsorInput) => {
      const { data, error } = await supabase
        .from('workspace_sponsors')
        .insert({
          workspace_id: input.workspaceId,
          name: input.name,
          company_name: input.companyName,
          contact_name: input.contactName,
          contact_email: input.contactEmail,
          contact_phone: input.contactPhone,
          tier: input.tier,
          contract_value: input.contractValue || 0,
          status: input.status || 'prospect',
          notes: input.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return mapSponsorFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Sponsor added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add sponsor: ${error.message}`);
    },
  });

  const updateSponsor = useMutation({
    mutationFn: async ({ id, ...input }: UpdateSponsorInput & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.companyName !== undefined) updateData.company_name = input.companyName;
      if (input.contactName !== undefined) updateData.contact_name = input.contactName;
      if (input.contactEmail !== undefined) updateData.contact_email = input.contactEmail;
      if (input.contactPhone !== undefined) updateData.contact_phone = input.contactPhone;
      if (input.tier !== undefined) updateData.tier = input.tier;
      if (input.contractValue !== undefined) updateData.contract_value = input.contractValue;
      if (input.amountPaid !== undefined) updateData.amount_paid = input.amountPaid;
      if (input.paymentStatus !== undefined) updateData.payment_status = input.paymentStatus;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.proposalSentAt !== undefined) updateData.proposal_sent_at = input.proposalSentAt;
      if (input.contractSignedAt !== undefined) updateData.contract_signed_at = input.contractSignedAt;

      const { data, error } = await supabase
        .from('workspace_sponsors')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapSponsorFromDb(data);
    },
    onMutate: async ({ id, ...input }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Sponsor[]>(queryKey);

      queryClient.setQueryData(queryKey, (old: Sponsor[] | undefined) =>
        old?.map((s) => (s.id === id ? { ...s, ...input } : s))
      );

      return { previous };
    },
    onError: (error: Error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(`Failed to update sponsor: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onSuccess: () => {
      toast.success('Sponsor updated');
    },
  });

  const deleteSponsor = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_sponsors')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Sponsor[]>(queryKey);

      queryClient.setQueryData(queryKey, (old: Sponsor[] | undefined) =>
        old?.filter((s) => s.id !== id)
      );

      return { previous };
    },
    onError: (error: Error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(`Failed to delete sponsor: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onSuccess: () => {
      toast.success('Sponsor removed');
    },
  });

  return {
    createSponsor,
    updateSponsor,
    deleteSponsor,
  };
}

/**
 * Hook for sponsor statistics
 */
export function useSponsorStats(workspaceId: string | undefined) {
  const { data: sponsors = [], isLoading } = useSponsors(workspaceId);

  const stats = {
    total: sponsors.length,
    confirmed: sponsors.filter((s) => s.status === 'confirmed' || s.status === 'active').length,
    prospect: sponsors.filter((s) => s.status === 'prospect').length,
    negotiating: sponsors.filter((s) => s.status === 'negotiating').length,
    totalRevenue: sponsors
      .filter((s) => s.status === 'confirmed' || s.status === 'active' || s.status === 'completed')
      .reduce((sum, s) => sum + s.contractValue, 0),
    totalPaid: sponsors.reduce((sum, s) => sum + s.amountPaid, 0),
    byTier: {
      platinum: sponsors.filter((s) => s.tier === 'platinum').length,
      gold: sponsors.filter((s) => s.tier === 'gold').length,
      silver: sponsors.filter((s) => s.tier === 'silver').length,
      bronze: sponsors.filter((s) => s.tier === 'bronze').length,
      partner: sponsors.filter((s) => s.tier === 'partner').length,
    },
  };

  return { stats, isLoading };
}