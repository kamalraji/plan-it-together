import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

// Types
export interface MediaAsset {
  id: string;
  workspace_id: string;
  name: string;
  type: string;
  file_url: string;
  thumbnail_url: string | null;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  uploader_name: string | null;
  tags: string[] | null;
  description: string | null;
  status: string;
  category: string | null;
  event_segment: string | null;
  is_exported: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ShotListItem {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  event_segment: string | null;
  location: string | null;
  scheduled_time: string | null;
  priority: 'high' | 'medium' | 'low';
  shot_type: 'photo' | 'video' | 'both';
  camera_settings: string | null;
  notes: string | null;
  status: 'pending' | 'in_progress' | 'captured' | 'reviewed' | 'published';
  assigned_to: string | null;
  assignee_name: string | null;
  captured_asset_id: string | null;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface GalleryReview {
  id: string;
  workspace_id: string;
  asset_id: string;
  reviewer_id: string | null;
  reviewer_name: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'revision_requested';
  rating: number | null;
  feedback: string | null;
  usage_rights: 'internal' | 'social' | 'press' | 'all';
  is_featured: boolean;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  asset?: MediaAsset;
}

// ========== MEDIA ASSETS HOOKS ==========

export function useMediaAssets(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['media-assets', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('workspace_media_assets')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as MediaAsset[];
    },
    enabled: !!workspaceId,
  });
}

export function useUploadMediaAsset(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: { 
      file: File; 
      category?: string; 
      eventSegment?: string;
      tags?: string[];
      description?: string;
    }) => {
      if (!workspaceId || !user) throw new Error('Missing workspace or user');

      // Upload to storage
      const fileExt = params.file.name.split('.').pop();
      const fileName = `${workspaceId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('media-assets')
        .upload(fileName, params.file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('media-assets')
        .getPublicUrl(fileName);

      // Determine file type
      const mimeType = params.file.type;
      let fileType = 'document';
      if (mimeType.startsWith('image/')) fileType = 'image';
      else if (mimeType.startsWith('video/')) fileType = 'video';

      // Insert record
      const { data, error } = await supabase
        .from('workspace_media_assets')
        .insert({
          workspace_id: workspaceId,
          name: params.file.name,
          type: fileType,
          file_url: urlData.publicUrl,
          file_size: params.file.size,
          mime_type: mimeType,
          uploaded_by: user.id,
          uploader_name: user.name || user.email,
          category: params.category,
          event_segment: params.eventSegment,
          tags: params.tags,
          description: params.description,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-assets', workspaceId] });
      toast.success('Media uploaded successfully');
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });
}

export function useUpdateMediaAsset(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; updates: Partial<Omit<MediaAsset, 'metadata'>> }) => {
      const { data, error } = await supabase
        .from('workspace_media_assets')
        .update(params.updates as Record<string, unknown>)
        .eq('id', params.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-assets', workspaceId] });
    },
  });
}

export function useDeleteMediaAsset(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assetId: string) => {
      const { error } = await supabase
        .from('workspace_media_assets')
        .delete()
        .eq('id', assetId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-assets', workspaceId] });
      toast.success('Asset deleted');
    },
  });
}

// ========== SHOT LIST HOOKS ==========

export function useShotLists(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['shot-lists', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('workspace_shot_lists')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as ShotListItem[];
    },
    enabled: !!workspaceId,
  });
}

export function useCreateShotList(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (item: Partial<Omit<ShotListItem, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>>) => {
      if (!workspaceId || !user) throw new Error('Missing workspace or user');

      const { data, error } = await supabase
        .from('workspace_shot_lists')
        .insert({
          title: item.title || 'Untitled Shot',
          workspace_id: workspaceId,
          created_by: user.id,
          description: item.description,
          event_segment: item.event_segment,
          location: item.location,
          priority: item.priority,
          shot_type: item.shot_type,
          camera_settings: item.camera_settings,
          notes: item.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shot-lists', workspaceId] });
      toast.success('Shot added to list');
    },
    onError: (error) => {
      toast.error(`Failed to add shot: ${error.message}`);
    },
  });
}

export function useUpdateShotList(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; updates: Partial<ShotListItem> }) => {
      const { data, error } = await supabase
        .from('workspace_shot_lists')
        .update(params.updates)
        .eq('id', params.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shot-lists', workspaceId] });
    },
  });
}

export function useDeleteShotList(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shotId: string) => {
      const { error } = await supabase
        .from('workspace_shot_lists')
        .delete()
        .eq('id', shotId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shot-lists', workspaceId] });
      toast.success('Shot removed from list');
    },
  });
}

// ========== GALLERY REVIEW HOOKS ==========

export function useGalleryReviews(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['gallery-reviews', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('workspace_gallery_reviews')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as GalleryReview[];
    },
    enabled: !!workspaceId,
  });
}

export function useAssetsWithReviews(workspaceId: string | undefined) {
  const { data: assets, isLoading: assetsLoading } = useMediaAssets(workspaceId);
  const { data: reviews, isLoading: reviewsLoading } = useGalleryReviews(workspaceId);

  const assetsWithReviews = assets?.map(asset => ({
    ...asset,
    review: reviews?.find(r => r.asset_id === asset.id),
  })) || [];

  return {
    data: assetsWithReviews,
    isLoading: assetsLoading || reviewsLoading,
  };
}

export function useCreateGalleryReview(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: { 
      assetId: string; 
      status: GalleryReview['status'];
      rating?: number;
      feedback?: string;
      usageRights?: GalleryReview['usage_rights'];
      isFeatured?: boolean;
    }) => {
      if (!workspaceId || !user) throw new Error('Missing workspace or user');

      const { data, error } = await supabase
        .from('workspace_gallery_reviews')
        .upsert({
          workspace_id: workspaceId,
          asset_id: params.assetId,
          reviewer_id: user.id,
          reviewer_name: user.name || user.email,
          status: params.status,
          rating: params.rating,
          feedback: params.feedback,
          usage_rights: params.usageRights || 'internal',
          is_featured: params.isFeatured || false,
          reviewed_at: new Date().toISOString(),
        }, {
          onConflict: 'asset_id,reviewer_id',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-reviews', workspaceId] });
      toast.success('Review saved');
    },
  });
}

export function useBulkReviewAssets(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: { 
      assetIds: string[]; 
      status: GalleryReview['status'];
      usageRights?: GalleryReview['usage_rights'];
    }) => {
      if (!workspaceId || !user) throw new Error('Missing workspace or user');

      const reviews = params.assetIds.map(assetId => ({
        workspace_id: workspaceId,
        asset_id: assetId,
        reviewer_id: user.id,
        reviewer_name: user.name || user.email,
        status: params.status,
        usage_rights: params.usageRights || 'internal',
        reviewed_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('workspace_gallery_reviews')
        .upsert(reviews, { onConflict: 'asset_id,reviewer_id' });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['gallery-reviews', workspaceId] });
      toast.success(`${variables.assetIds.length} assets ${variables.status}`);
    },
  });
}

// ========== EXPORT HOOKS ==========

export function useMarkAssetsExported(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assetIds: string[]) => {
      const { error } = await supabase
        .from('workspace_media_assets')
        .update({ is_exported: true })
        .in('id', assetIds);

      if (error) throw error;
    },
    onSuccess: (_, assetIds) => {
      queryClient.invalidateQueries({ queryKey: ['media-assets', workspaceId] });
      toast.success(`${assetIds.length} assets marked as exported`);
    },
  });
}

export function useApprovedAssets(workspaceId: string | undefined) {
  const { data: assetsWithReviews, isLoading } = useAssetsWithReviews(workspaceId);
  
  const approvedAssets = assetsWithReviews.filter(
    asset => asset.review?.status === 'approved'
  );

  return { data: approvedAssets, isLoading };
}
