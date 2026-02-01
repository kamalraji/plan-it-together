import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ContentStats {
  publishedPosts: number;
  scheduledPosts: number;
  mediaAssets: number;
  socialReach: number;
  isLoading: boolean;
}

export function useContentStats(workspaceId: string): ContentStats {
  // Fetch published content items
  const { data: publishedCount = 0, isLoading: isLoadingPublished } = useQuery({
    queryKey: ['content-stats-published', workspaceId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('workspace_content_items')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('status', 'published');

      if (error) throw error;
      return count || 0;
    },
    enabled: !!workspaceId,
  });

  // Fetch scheduled content
  const { data: scheduledCount = 0, isLoading: isLoadingScheduled } = useQuery({
    queryKey: ['content-stats-scheduled', workspaceId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('workspace_scheduled_content')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('status', 'scheduled');

      if (error) throw error;
      return count || 0;
    },
    enabled: !!workspaceId,
  });

  // Fetch media assets count
  const { data: mediaCount = 0, isLoading: isLoadingMedia } = useQuery({
    queryKey: ['content-stats-media', workspaceId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('workspace_media_assets')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!workspaceId,
  });

  // Calculate social reach from view_count on published content
  const { data: socialReach = 0, isLoading: isLoadingReach } = useQuery({
    queryKey: ['content-stats-reach', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_content_items')
        .select('view_count')
        .eq('workspace_id', workspaceId)
        .eq('status', 'published');

      if (error) throw error;
      return data?.reduce((sum, item) => sum + (item.view_count || 0), 0) || 0;
    },
    enabled: !!workspaceId,
  });

  return {
    publishedPosts: publishedCount,
    scheduledPosts: scheduledCount,
    mediaAssets: mediaCount,
    socialReach,
    isLoading: isLoadingPublished || isLoadingScheduled || isLoadingMedia || isLoadingReach,
  };
}
