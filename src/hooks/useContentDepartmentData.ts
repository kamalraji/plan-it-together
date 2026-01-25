import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CONTENT_ITEM_COLUMNS, SPEAKER_COLUMNS, MEDIA_ASSET_COLUMNS } from '@/lib/supabase-columns';

export type ContentItemStatus = 'draft' | 'review' | 'approved' | 'published';
export type ContentItemType = 'article' | 'presentation' | 'video' | 'document';
export type ContentItemPriority = 'low' | 'medium' | 'high';

export interface ContentItem {
  id: string;
  workspace_id: string;
  title: string;
  type: ContentItemType;
  status: ContentItemStatus;
  author_id: string | null;
  author_name: string | null;
  due_date: string | null;
  priority: ContentItemPriority;
  description: string | null;
  content_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Speaker {
  id: string;
  workspace_id: string;
  name: string;
  avatar_url: string | null;
  role: string | null;
  bio: string | null;
  email: string | null;
  phone: string | null;
  session_title: string | null;
  session_time: string | null;
  location: string | null;
  status: 'pending' | 'confirmed' | 'cancelled';
  travel_arranged: boolean;
  accommodation_arranged: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MediaAsset {
  id: string;
  workspace_id: string;
  name: string;
  type: 'photo' | 'video' | 'audio';
  file_url: string | null;
  thumbnail_url: string | null;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  uploader_name: string | null;
  tags: string[];
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useContentItems(workspaceId: string) {
  return useQuery({
    queryKey: ['content-items', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_content_items')
        .select(CONTENT_ITEM_COLUMNS.detail)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ContentItem[];
    },
    enabled: !!workspaceId,
  });
}

export function useSpeakers(workspaceId: string) {
  return useQuery({
    queryKey: ['workspace-speakers', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_speakers')
        .select(SPEAKER_COLUMNS.detail)
        .eq('workspace_id', workspaceId)
        .order('session_time', { ascending: true });

      if (error) throw error;
      return data as Speaker[];
    },
    enabled: !!workspaceId,
  });
}

export function useMediaAssets(workspaceId: string) {
  return useQuery({
    queryKey: ['workspace-media-assets', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_media_assets')
        .select(MEDIA_ASSET_COLUMNS.detail)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MediaAsset[];
    },
    enabled: !!workspaceId,
  });
}

export function useUpdateContentItemStatus(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, status }: { itemId: string; status: ContentItemStatus }) => {
      const { error } = await supabase
        .from('workspace_content_items')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-items', workspaceId] });
      toast.success('Content status updated');
    },
    onError: (error) => {
      toast.error('Failed to update status: ' + error.message);
    },
  });
}

export function useCreateContentItem(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Omit<ContentItem, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from('workspace_content_items')
        .insert([{ ...item, workspace_id: workspaceId }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-items', workspaceId] });
      toast.success('Content item created');
    },
    onError: (error) => {
      toast.error('Failed to create item: ' + error.message);
    },
  });
}

export function useContentDepartmentStats(workspaceId: string) {
  const { data: contentItems } = useContentItems(workspaceId);
  const { data: speakers } = useSpeakers(workspaceId);
  const { data: mediaAssets } = useMediaAssets(workspaceId);

  return {
    contentCount: contentItems?.length || 0,
    judgeCount: 0, // Would come from judge committee
    mediaCount: mediaAssets?.length || 0,
    speakersConfirmed: speakers?.filter(s => s.status === 'confirmed').length || 0,
    speakersTotal: speakers?.length || 0,
  };
}
