/**
 * Sponsor Benefits Hook - Database-backed benefits matrix
 * Replaces mock data in BenefitsManager component
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys, queryPresets } from '@/lib/query-config';
import { toast } from 'sonner';

// ============================================
// Types
// ============================================

export interface SponsorBenefit {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  tier: string;
  category: string | null;
  quantity: number | null;
  valueEstimate: number | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateBenefitInput {
  workspaceId: string;
  name: string;
  tier: string;
  description?: string;
  category?: string;
  quantity?: number;
  valueEstimate?: number;
}

export interface UpdateBenefitInput {
  name?: string;
  description?: string;
  tier?: string;
  category?: string;
  quantity?: number;
  valueEstimate?: number;
  displayOrder?: number;
  isActive?: boolean;
}

// Benefits matrix - derived type for UI
export interface BenefitsMatrixItem {
  id: string;
  benefit: string;
  platinum: boolean;
  gold: boolean;
  silver: boolean;
  bronze: boolean;
}

// ============================================
// Helper Functions
// ============================================

function mapBenefitFromDb(row: Record<string, unknown>): SponsorBenefit {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    name: row.name as string,
    description: row.description as string | null,
    tier: row.tier as string,
    category: row.category as string | null,
    quantity: row.quantity as number | null,
    valueEstimate: row.value_estimate as number | null,
    displayOrder: Number(row.display_order) || 0,
    isActive: Boolean(row.is_active ?? true),
    createdAt: row.created_at as string,
  };
}

// ============================================
// Hooks
// ============================================

/**
 * Hook for fetching benefits for a workspace
 */
export function useSponsorBenefits(workspaceId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workspaces.sponsorBenefits(workspaceId || ''),
    queryFn: async (): Promise<SponsorBenefit[]> => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from('workspace_sponsor_benefits')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return (data || []).map(mapBenefitFromDb);
    },
    enabled: !!workspaceId,
    ...queryPresets.standard,
  });
}

/**
 * Hook for benefits in matrix format (grouped by benefit name across tiers)
 */
export function useBenefitsMatrix(workspaceId: string | undefined) {
  const { data: benefits = [], isLoading } = useSponsorBenefits(workspaceId);

  // Group benefits by name and determine which tiers have them
  const benefitNames = [...new Set(benefits.map(b => b.name))];
  
  const matrix: BenefitsMatrixItem[] = benefitNames.map((name, index) => {
    const benefitsWithName = benefits.filter(b => b.name === name);
    const tiers = benefitsWithName.map(b => b.tier.toLowerCase());
    
    return {
      id: String(index),
      benefit: name,
      platinum: tiers.includes('platinum'),
      gold: tiers.includes('gold'),
      silver: tiers.includes('silver'),
      bronze: tiers.includes('bronze'),
    };
  });

  return { matrix, isLoading };
}

/**
 * Hook for benefit mutations
 */
export function useBenefitMutations(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.workspaces.sponsorBenefits(workspaceId || '');

  const createBenefit = useMutation({
    mutationFn: async (input: CreateBenefitInput) => {
      // Get max display order
      const { data: existingBenefits } = await supabase
        .from('workspace_sponsor_benefits')
        .select('display_order')
        .eq('workspace_id', input.workspaceId)
        .order('display_order', { ascending: false })
        .limit(1);

      const maxDisplayOrder = existingBenefits?.[0]?.display_order || 0;

      const insertData = {
        workspace_id: input.workspaceId,
        name: input.name,
        tier: input.tier,
        description: input.description ?? null,
        category: input.category ?? null,
        quantity: input.quantity ?? null,
        value_estimate: input.valueEstimate ?? null,
        display_order: maxDisplayOrder + 1,
        is_active: true,
      };

      const { data, error } = await supabase
        .from('workspace_sponsor_benefits')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return mapBenefitFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Benefit added');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add benefit: ${error.message}`);
    },
  });

  const updateBenefit = useMutation({
    mutationFn: async ({ id, ...input }: UpdateBenefitInput & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.tier !== undefined) updateData.tier = input.tier;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.quantity !== undefined) updateData.quantity = input.quantity;
      if (input.valueEstimate !== undefined) updateData.value_estimate = input.valueEstimate;
      if (input.displayOrder !== undefined) updateData.display_order = input.displayOrder;
      if (input.isActive !== undefined) updateData.is_active = input.isActive;

      const { data, error } = await supabase
        .from('workspace_sponsor_benefits')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapBenefitFromDb(data);
    },
    onMutate: async ({ id, ...input }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<SponsorBenefit[]>(queryKey);

      queryClient.setQueryData(queryKey, (old: SponsorBenefit[] | undefined) =>
        old?.map((b) => (b.id === id ? { ...b, ...input } : b))
      );

      return { previous };
    },
    onError: (error: Error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(`Failed to update benefit: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onSuccess: () => {
      toast.success('Benefit updated');
    },
  });

  const deleteBenefit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_sponsor_benefits')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<SponsorBenefit[]>(queryKey);

      queryClient.setQueryData(queryKey, (old: SponsorBenefit[] | undefined) =>
        old?.filter((b) => b.id !== id)
      );

      return { previous };
    },
    onError: (error: Error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(`Failed to delete benefit: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onSuccess: () => {
      toast.success('Benefit removed');
    },
  });

  return {
    createBenefit,
    updateBenefit,
    deleteBenefit,
  };
}
