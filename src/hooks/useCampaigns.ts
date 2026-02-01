/**
 * Campaigns Hook - Database-backed campaign management
 * Replaces mock data in CampaignTracker and AdPerformancePanel
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys, queryPresets } from '@/lib/query-config';
import { toast } from 'sonner';

// ============================================
// Types
// ============================================

export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
export type CampaignChannel = 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube' | 'google' | 'email' | 'other';

export interface Campaign {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  channel: CampaignChannel;
  status: CampaignStatus;
  budget: number;
  spent: number;
  startDate: string | null;
  endDate: string | null;
  targetAudience: Record<string, unknown> | null;
  utmParams: Record<string, unknown> | null;
  impressions: number;
  clicks: number;
  conversions: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
}

export interface CreateCampaignInput {
  workspaceId: string;
  name: string;
  channel: CampaignChannel;
  description?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  targetAudience?: Record<string, unknown>;
  utmParams?: Record<string, unknown>;
}

export interface UpdateCampaignInput {
  name?: string;
  channel?: CampaignChannel;
  status?: CampaignStatus;
  description?: string;
  budget?: number;
  spent?: number;
  startDate?: string;
  endDate?: string;
  targetAudience?: Record<string, unknown>;
  utmParams?: Record<string, unknown>;
  impressions?: number;
  clicks?: number;
  conversions?: number;
}

// ============================================
// Helper Functions
// ============================================

function mapCampaignFromDb(row: Record<string, unknown>): Campaign {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    name: row.name as string,
    description: row.description as string | null,
    channel: (row.channel as CampaignChannel) || 'other',
    status: (row.status as CampaignStatus) || 'draft',
    budget: Number(row.budget) || 0,
    spent: Number(row.spent) || 0,
    startDate: row.start_date as string | null,
    endDate: row.end_date as string | null,
    targetAudience: row.target_audience as Record<string, unknown> | null,
    utmParams: row.utm_params as Record<string, unknown> | null,
    impressions: Number(row.impressions) || 0,
    clicks: Number(row.clicks) || 0,
    conversions: Number(row.conversions) || 0,
    createdBy: row.created_by as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ============================================
// Hooks
// ============================================

/**
 * Hook for fetching campaigns for a workspace
 */
export function useCampaigns(workspaceId: string | undefined, filters?: { status?: CampaignStatus; channel?: CampaignChannel }) {
  return useQuery({
    queryKey: [...queryKeys.workspaces.campaigns(workspaceId || ''), filters],
    queryFn: async (): Promise<Campaign[]> => {
      if (!workspaceId) return [];

      let query = supabase
        .from('workspace_campaigns')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.channel) {
        query = query.eq('channel', filters.channel);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(mapCampaignFromDb);
    },
    enabled: !!workspaceId,
    ...queryPresets.dynamic,
  });
}

/**
 * Hook for campaign CRUD operations
 */
export function useCampaignMutations(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.workspaces.campaigns(workspaceId || '');

  const createCampaign = useMutation({
    mutationFn: async (input: CreateCampaignInput) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const insertData = {
        workspace_id: input.workspaceId,
        name: input.name,
        channel: input.channel,
        description: input.description ?? null,
        budget: input.budget ?? 0,
        start_date: input.startDate ?? null,
        end_date: input.endDate ?? null,
        target_audience: (input.targetAudience ?? {}) as unknown,
        utm_params: (input.utmParams ?? {}) as unknown,
        status: 'draft',
        created_by: userData?.user?.id ?? null,
      } as const;
      
      const { data, error } = await supabase
        .from('workspace_campaigns')
        .insert(insertData as never)
        .select()
        .single();

      if (error) throw error;
      return mapCampaignFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Campaign created');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create campaign: ${error.message}`);
    },
  });

  const updateCampaign = useMutation({
    mutationFn: async ({ id, ...input }: UpdateCampaignInput & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.channel !== undefined) updateData.channel = input.channel;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.budget !== undefined) updateData.budget = input.budget;
      if (input.spent !== undefined) updateData.spent = input.spent;
      if (input.startDate !== undefined) updateData.start_date = input.startDate;
      if (input.endDate !== undefined) updateData.end_date = input.endDate;
      if (input.targetAudience !== undefined) updateData.target_audience = input.targetAudience;
      if (input.utmParams !== undefined) updateData.utm_params = input.utmParams;
      if (input.impressions !== undefined) updateData.impressions = input.impressions;
      if (input.clicks !== undefined) updateData.clicks = input.clicks;
      if (input.conversions !== undefined) updateData.conversions = input.conversions;

      const { data, error } = await supabase
        .from('workspace_campaigns')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapCampaignFromDb(data);
    },
    onMutate: async ({ id, ...input }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Campaign[]>(queryKey);

      queryClient.setQueryData(queryKey, (old: Campaign[] | undefined) =>
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

  const updateMetrics = useMutation({
    mutationFn: async ({ id, impressions, clicks, conversions }: { id: string; impressions?: number; clicks?: number; conversions?: number }) => {
      const updateData: Record<string, unknown> = {};
      if (impressions !== undefined) updateData.impressions = impressions;
      if (clicks !== undefined) updateData.clicks = clicks;
      if (conversions !== undefined) updateData.conversions = conversions;

      const { data, error } = await supabase
        .from('workspace_campaigns')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapCampaignFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Campaign metrics updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update metrics: ${error.message}`);
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Campaign[]>(queryKey);

      queryClient.setQueryData(queryKey, (old: Campaign[] | undefined) =>
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
    updateMetrics,
    deleteCampaign,
  };
}

/**
 * Hook for campaign statistics
 */
export function useCampaignStats(workspaceId: string | undefined) {
  const { data: campaigns = [], isLoading } = useCampaigns(workspaceId);

  const activeCampaigns = campaigns.filter((c) => c.status === 'active');
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
  const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
  
  const stats = {
    total: campaigns.length,
    active: activeCampaigns.length,
    draft: campaigns.filter((c) => c.status === 'draft').length,
    completed: campaigns.filter((c) => c.status === 'completed').length,
    totalBudget: campaigns.reduce((sum, c) => sum + c.budget, 0),
    totalSpent: campaigns.reduce((sum, c) => sum + c.spent, 0),
    totalImpressions,
    totalClicks,
    totalConversions: campaigns.reduce((sum, c) => sum + c.conversions, 0),
    avgCtr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
  };

  return { stats, isLoading };
}