import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryPresets } from '@/lib/query-config';
import { toast } from 'sonner';

// Types
export interface AdChannel {
  id: string;
  workspace_id: string;
  name: string;
  icon?: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  trend: 'up' | 'down' | 'stable';
  date: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface BrandingAsset {
  id: string;
  workspace_id: string;
  name: string;
  asset_type: 'logo' | 'banner' | 'template' | 'video' | 'guideline' | 'other';
  file_url?: string;
  format?: string;
  file_size?: string;
  downloads: number;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

// Hook for ad channels performance
export function useAdChannels(workspaceId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['ad-channels', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_channels')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('spend', { ascending: false });

      if (error) throw error;
      return data as AdChannel[];
    },
    enabled: !!workspaceId,
    ...queryPresets.dynamic,
  });

  // Computed metrics
  const channels = query.data ?? [];
  const totalSpend = channels.reduce((acc, ch) => acc + ch.spend, 0);
  const totalConversions = channels.reduce((acc, ch) => acc + ch.conversions, 0);
  const totalClicks = channels.reduce((acc, ch) => acc + ch.clicks, 0);
  const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;

  const addChannel = useMutation({
    mutationFn: async (channel: {
      workspace_id: string;
      name: string;
      icon?: string;
      impressions?: number;
      clicks?: number;
      spend?: number;
      conversions?: number;
      trend?: 'up' | 'down' | 'stable';
      date?: string;
    }) => {
      const { data, error } = await supabase
        .from('ad_channels')
        .insert({
          workspace_id: channel.workspace_id,
          name: channel.name,
          icon: channel.icon,
          impressions: channel.impressions ?? 0,
          clicks: channel.clicks ?? 0,
          spend: channel.spend ?? 0,
          conversions: channel.conversions ?? 0,
          trend: channel.trend ?? 'stable',
          date: channel.date ?? new Date().toISOString().split('T')[0],
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-channels', workspaceId] });
      toast.success('Ad channel added');
    },
    onError: () => toast.error('Failed to add ad channel'),
  });

  const updateChannel = useMutation({
    mutationFn: async ({ id, impressions, clicks, spend, conversions, trend }: { 
      id: string;
      impressions?: number;
      clicks?: number;
      spend?: number;
      conversions?: number;
      trend?: 'up' | 'down' | 'stable';
    }) => {
      const updateData: Record<string, unknown> = {};
      if (impressions !== undefined) updateData.impressions = impressions;
      if (clicks !== undefined) updateData.clicks = clicks;
      if (spend !== undefined) updateData.spend = spend;
      if (conversions !== undefined) updateData.conversions = conversions;
      if (trend !== undefined) updateData.trend = trend;

      const { data, error } = await supabase
        .from('ad_channels')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-channels', workspaceId] });
      toast.success('Ad channel updated');
    },
    onError: () => toast.error('Failed to update ad channel'),
  });

  return {
    channels,
    isLoading: query.isLoading,
    isError: query.isError,
    metrics: {
      totalSpend,
      totalConversions,
      totalClicks,
      avgCPC,
    },
    addChannel,
    updateChannel,
  };
}

// Hook for branding assets
export function useBrandingAssets(workspaceId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['branding-assets', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branding_assets')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as BrandingAsset[];
    },
    enabled: !!workspaceId,
    ...queryPresets.standard,
  });

  const addAsset = useMutation({
    mutationFn: async (asset: Omit<BrandingAsset, 'id' | 'created_at' | 'updated_at' | 'downloads'>) => {
      const { data, error } = await supabase
        .from('branding_assets')
        .insert(asset)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branding-assets', workspaceId] });
      toast.success('Asset uploaded');
    },
    onError: () => toast.error('Failed to upload asset'),
  });

  const incrementDownload = useMutation({
    mutationFn: async (id: string) => {
      // Get current downloads count
      const { data: current } = await supabase
        .from('branding_assets')
        .select('downloads')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('branding_assets')
        .update({ downloads: (current?.downloads ?? 0) + 1 })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branding-assets', workspaceId] });
    },
  });

  const deleteAsset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('branding_assets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branding-assets', workspaceId] });
      toast.success('Asset deleted');
    },
    onError: () => toast.error('Failed to delete asset'),
  });

  return {
    assets: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    addAsset,
    incrementDownload,
    deleteAsset,
  };
}
