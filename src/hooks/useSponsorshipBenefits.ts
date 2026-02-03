import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SponsorshipBenefit {
  id: string;
  eventId: string;
  benefit: string;
  tierPlatinum: boolean;
  tierGold: boolean;
  tierSilver: boolean;
  tierBronze: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface CreateBenefitInput {
  benefit: string;
  tierPlatinum?: boolean;
  tierGold?: boolean;
  tierSilver?: boolean;
  tierBronze?: boolean;
  sortOrder?: number;
}

interface UpdateBenefitInput {
  id: string;
  benefit?: string;
  tierPlatinum?: boolean;
  tierGold?: boolean;
  tierSilver?: boolean;
  tierBronze?: boolean;
  sortOrder?: number;
}

/**
 * Hook for managing sponsorship benefit tiers
 */
export function useSponsorshipBenefits(eventId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const queryKey = ['sponsorship-benefits', eventId];

  // Fetch all benefits for the event
  const {
    data: benefits = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsorship_benefits')
        .select('*')
        .eq('event_id', eventId)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      return (data || []).map((b) => ({
        id: b.id,
        eventId: b.event_id,
        benefit: b.benefit,
        tierPlatinum: b.tier_platinum ?? false,
        tierGold: b.tier_gold ?? false,
        tierSilver: b.tier_silver ?? false,
        tierBronze: b.tier_bronze ?? false,
        sortOrder: b.sort_order ?? 0,
        createdAt: b.created_at,
        updatedAt: b.updated_at,
      })) as SponsorshipBenefit[];
    },
    enabled: !!eventId,
  });

  // Create benefit mutation with optimistic update
  const createBenefit = useMutation({
    mutationFn: async (input: CreateBenefitInput) => {
      const { data, error } = await supabase
        .from('sponsorship_benefits')
        .insert({
          event_id: eventId,
          benefit: input.benefit,
          tier_platinum: input.tierPlatinum ?? false,
          tier_gold: input.tierGold ?? false,
          tier_silver: input.tierSilver ?? false,
          tier_bronze: input.tierBronze ?? false,
          sort_order: input.sortOrder ?? benefits.length,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<SponsorshipBenefit[]>(queryKey);
      
      const optimistic: SponsorshipBenefit = {
        id: `temp-${Date.now()}`,
        eventId,
        benefit: input.benefit,
        tierPlatinum: input.tierPlatinum ?? false,
        tierGold: input.tierGold ?? false,
        tierSilver: input.tierSilver ?? false,
        tierBronze: input.tierBronze ?? false,
        sortOrder: input.sortOrder ?? (previous?.length ?? 0),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      queryClient.setQueryData(queryKey, [...(previous || []), optimistic]);
      return { previous };
    },
    onError: (error: Error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast({
        title: 'Failed to add benefit',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onSuccess: () => {
      toast({ title: 'Benefit added successfully' });
    },
  });

  // Update benefit mutation with optimistic update
  const updateBenefit = useMutation({
    mutationFn: async (input: UpdateBenefitInput) => {
      const updates: Record<string, any> = {};
      if (input.benefit !== undefined) updates.benefit = input.benefit;
      if (input.tierPlatinum !== undefined) updates.tier_platinum = input.tierPlatinum;
      if (input.tierGold !== undefined) updates.tier_gold = input.tierGold;
      if (input.tierSilver !== undefined) updates.tier_silver = input.tierSilver;
      if (input.tierBronze !== undefined) updates.tier_bronze = input.tierBronze;
      if (input.sortOrder !== undefined) updates.sort_order = input.sortOrder;

      const { data, error } = await supabase
        .from('sponsorship_benefits')
        .update(updates)
        .eq('id', input.id)
        .eq('event_id', eventId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<SponsorshipBenefit[]>(queryKey);
      
      queryClient.setQueryData(
        queryKey,
        previous?.map((b) =>
          b.id === input.id
            ? {
                ...b,
                benefit: input.benefit ?? b.benefit,
                tierPlatinum: input.tierPlatinum ?? b.tierPlatinum,
                tierGold: input.tierGold ?? b.tierGold,
                tierSilver: input.tierSilver ?? b.tierSilver,
                tierBronze: input.tierBronze ?? b.tierBronze,
                sortOrder: input.sortOrder ?? b.sortOrder,
                updatedAt: new Date().toISOString(),
              }
            : b
        )
      );
      return { previous };
    },
    onError: (error: Error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast({
        title: 'Failed to update benefit',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Delete benefit mutation with optimistic update
  const deleteBenefit = useMutation({
    mutationFn: async (benefitId: string) => {
      const { error } = await supabase
        .from('sponsorship_benefits')
        .delete()
        .eq('id', benefitId)
        .eq('event_id', eventId);

      if (error) throw error;
    },
    onMutate: async (benefitId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<SponsorshipBenefit[]>(queryKey);
      
      queryClient.setQueryData(
        queryKey,
        previous?.filter((b) => b.id !== benefitId)
      );
      return { previous };
    },
    onError: (error: Error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast({
        title: 'Failed to delete benefit',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onSuccess: () => {
      toast({ title: 'Benefit deleted successfully' });
    },
  });

  // Reorder benefits
  const reorderBenefits = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) => ({
        id,
        sort_order: index,
      }));

      // Update each benefit's sort order
      for (const update of updates) {
        const { error } = await supabase
          .from('sponsorship_benefits')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);

        if (error) throw error;
      }
    },
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<SponsorshipBenefit[]>(queryKey);
      
      const reordered = orderedIds
        .map((id, index) => {
          const benefit = previous?.find((b) => b.id === id);
          return benefit ? { ...benefit, sortOrder: index } : null;
        })
        .filter(Boolean) as SponsorshipBenefit[];
      
      queryClient.setQueryData(queryKey, reordered);
      return { previous };
    },
    onError: (error: Error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast({
        title: 'Failed to reorder benefits',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    benefits,
    isLoading,
    error,
    createBenefit,
    updateBenefit,
    deleteBenefit,
    reorderBenefits,
  };
}
