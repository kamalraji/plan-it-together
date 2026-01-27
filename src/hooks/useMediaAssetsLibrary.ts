import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MediaAsset {
  id: string;
  name: string;
  type: string;
  file_size: number | null;
  file_url: string | null;
  thumbnail_url: string | null;
  mime_type: string | null;
  description: string | null;
  tags: string[] | null;
  usage_count: number;
  status: string;
  uploaded_by: string | null;
  uploader_name: string | null;
  created_at: string;
  updated_at: string;
  workspace_id: string;
}

export interface MediaStats {
  totalAssets: number;
  totalSize: number;
  imageCount: number;
  videoCount: number;
  documentCount: number;
}

// Format file size to human readable
export function formatFileSize(bytes: number | null): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

// Get asset type from mime type
export function getAssetType(mimeType: string | null): 'image' | 'video' | 'document' {
  if (!mimeType) return 'document';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'document';
}

// Fetch media assets
export function useMediaAssets(workspaceId: string) {
  return useQuery({
    queryKey: ['media-assets-library', workspaceId],
    queryFn: async () => {
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

// Fetch media stats
export function useMediaStats(workspaceId: string) {
  return useQuery({
    queryKey: ['media-stats', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_media_assets')
        .select('type, file_size')
        .eq('workspace_id', workspaceId);

      if (error) throw error;

      const stats: MediaStats = {
        totalAssets: data?.length || 0,
        totalSize: data?.reduce((sum, a) => sum + (a.file_size || 0), 0) || 0,
        imageCount: data?.filter(a => a.type === 'image' || a.type === 'photo').length || 0,
        videoCount: data?.filter(a => a.type === 'video').length || 0,
        documentCount: data?.filter(a => a.type === 'document' || a.type === 'audio').length || 0,
      };

      return stats;
    },
    enabled: !!workspaceId,
  });
}

// Upload media asset
export function useUploadMediaAsset(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${workspaceId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('workspace-media')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('workspace-media')
        .getPublicUrl(uploadData.path);

      // Determine asset type
      const assetType = getAssetType(file.type);

      // Insert database record
      const { data, error } = await supabase
        .from('workspace_media_assets')
        .insert({
          workspace_id: workspaceId,
          name: file.name,
          type: assetType,
          file_size: file.size,
          file_url: publicUrl,
          mime_type: file.type,
          status: 'active',
          uploaded_by: user.id,
          uploader_name: user.email?.split('@')[0] || 'User',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-assets-library', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['media-stats', workspaceId] });
      toast.success('File uploaded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });
}

// Delete media asset
export function useDeleteMediaAsset(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (asset: MediaAsset) => {
      // Delete from storage if URL exists
      if (asset.file_url) {
        const path = asset.file_url.split('/workspace-media/').pop();
        if (path) {
          await supabase.storage.from('workspace-media').remove([path]);
        }
      }

      // Delete database record
      const { error } = await supabase
        .from('workspace_media_assets')
        .delete()
        .eq('id', asset.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-assets-library', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['media-stats', workspaceId] });
      toast.success('Asset deleted');
    },
    onError: (error: Error) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });
}

// Increment usage count
export function useIncrementUsage(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assetId: string) => {
      // Get current count and increment
      const { data: current } = await supabase
        .from('workspace_media_assets')
        .select('usage_count')
        .eq('id', assetId)
        .single();

      const { error } = await supabase
        .from('workspace_media_assets')
        .update({ usage_count: (current?.usage_count || 0) + 1 })
        .eq('id', assetId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-assets-library', workspaceId] });
    },
  });
}
