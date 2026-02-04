import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { queryKeys, queryPresets } from '@/lib/query-config';

export interface ContentAsset {
  id: string;
  workspaceId: string;
  name: string;
  type: 'image' | 'video' | 'document' | 'audio';
  category: string | null;
  url: string;
  sizeBytes: number | null;
  metadata: Record<string, any>;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CreateAssetInput {
  name: string;
  type: 'image' | 'video' | 'document' | 'audio';
  category?: string;
  url: string;
  sizeBytes?: number;
  metadata?: Record<string, any>;
}

interface UpdateAssetInput {
  id: string;
  name?: string;
  category?: string;
  metadata?: Record<string, any>;
}

/**
 * Hook for managing workspace content assets
 * Uses centralized query key factory for cache consistency
 */
export function useContentAssets(workspaceId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const queryKey = queryKeys.workspaces.contentAssets(workspaceId);

  // Fetch all assets for the workspace
  const {
    data: assets = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    ...queryPresets.standard,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_content_assets')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((asset) => ({
        id: asset.id,
        workspaceId: asset.workspace_id,
        name: asset.name,
        type: asset.type as ContentAsset['type'],
        category: asset.category,
        url: asset.url,
        sizeBytes: asset.size_bytes,
        metadata: (asset.metadata as Record<string, any>) || {},
        createdBy: asset.created_by,
        createdAt: asset.created_at,
        updatedAt: asset.updated_at,
      })) as ContentAsset[];
    },
    enabled: !!workspaceId,
  });

  // Create asset mutation
  const createAsset = useMutation({
    mutationFn: async (input: CreateAssetInput) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('workspace_content_assets')
        .insert({
          workspace_id: workspaceId,
          name: input.name,
          type: input.type,
          category: input.category || null,
          url: input.url,
          size_bytes: input.sizeBytes || null,
          metadata: input.metadata || {},
          created_by: userData.user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: 'Asset uploaded successfully' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to upload asset',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update asset mutation
  const updateAsset = useMutation({
    mutationFn: async (input: UpdateAssetInput) => {
      const updates: Record<string, any> = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.category !== undefined) updates.category = input.category;
      if (input.metadata !== undefined) updates.metadata = input.metadata;

      const { data, error } = await supabase
        .from('workspace_content_assets')
        .update(updates)
        .eq('id', input.id)
        .eq('workspace_id', workspaceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: 'Asset updated successfully' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update asset',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete asset mutation
  const deleteAsset = useMutation({
    mutationFn: async (assetId: string) => {
      const { error } = await supabase
        .from('workspace_content_assets')
        .delete()
        .eq('id', assetId)
        .eq('workspace_id', workspaceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: 'Asset deleted successfully' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete asset',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Filter assets by type
  const filterByType = (type: ContentAsset['type']) => 
    assets.filter((asset) => asset.type === type);

  // Filter assets by category
  const filterByCategory = (category: string) =>
    assets.filter((asset) => asset.category === category);

  // Get unique categories
  const categories = [...new Set(assets.map((a) => a.category).filter(Boolean))] as string[];

  return {
    assets,
    isLoading,
    error,
    createAsset,
    updateAsset,
    deleteAsset,
    filterByType,
    filterByCategory,
    categories,
    // Stats
    stats: {
      total: assets.length,
      images: filterByType('image').length,
      videos: filterByType('video').length,
      documents: filterByType('document').length,
      audio: filterByType('audio').length,
    },
  };
}
