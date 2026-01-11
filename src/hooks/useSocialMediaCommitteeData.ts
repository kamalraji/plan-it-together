import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export interface SocialPost {
  id: string;
  workspace_id: string;
  title: string;
  content: string | null;
  platform: string;
  post_type: string;
  media_urls: string[];
  hashtags: string[];
  scheduled_for: string | null;
  published_at: string | null;
  status: string;
  engagement_likes: number;
  engagement_comments: number;
  engagement_shares: number;
  engagement_saves: number;
  reach: number;
  impressions: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Hashtag {
  id: string;
  workspace_id: string;
  tag: string;
  uses_count: number;
  reach: number;
  engagement_rate: number;
  trend: string;
  is_primary: boolean;
  category: string | null;
  last_tracked_at: string;
  created_at: string;
  updated_at: string;
}

export interface SocialPlatform {
  id: string;
  workspace_id: string;
  platform: string;
  handle: string;
  display_name: string | null;
  followers_count: number;
  following_count: number;
  posts_count: number;
  engagement_rate: number;
  is_connected: boolean;
  profile_url: string | null;
  avatar_url: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EngagementReport {
  id: string;
  workspace_id: string;
  report_date: string;
  platform: string;
  total_followers: number;
  follower_growth: number;
  total_posts: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_saves: number;
  total_reach: number;
  total_impressions: number;
  engagement_rate: number;
  top_performing_post_id: string | null;
  created_at: string;
}

// Social Posts Queries
export function useSocialPosts(workspaceId: string, filters?: { status?: string; platform?: string }) {
  return useQuery({
    queryKey: ['social-posts', workspaceId, filters],
    queryFn: async () => {
      let query = supabase
        .from('workspace_social_posts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.platform) {
        query = query.eq('platform', filters.platform);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SocialPost[];
    },
    enabled: !!workspaceId,
  });
}

export function useScheduledPosts(workspaceId: string) {
  return useQuery({
    queryKey: ['scheduled-posts', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_social_posts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('status', 'scheduled')
        .order('scheduled_for', { ascending: true });

      if (error) throw error;
      return data as SocialPost[];
    },
    enabled: !!workspaceId,
  });
}

// Hashtag Queries
export function useHashtags(workspaceId: string) {
  return useQuery({
    queryKey: ['hashtags', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_hashtags')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('uses_count', { ascending: false });

      if (error) throw error;
      return data as Hashtag[];
    },
    enabled: !!workspaceId,
  });
}

// Social Platforms Queries
export function useSocialPlatforms(workspaceId: string) {
  return useQuery({
    queryKey: ['social-platforms', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_social_platforms')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('followers_count', { ascending: false });

      if (error) throw error;
      return data as SocialPlatform[];
    },
    enabled: !!workspaceId,
  });
}

// Engagement Reports Queries
export function useEngagementReports(workspaceId: string, dateRange?: { from: string; to: string }) {
  return useQuery({
    queryKey: ['engagement-reports', workspaceId, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('workspace_engagement_reports')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('report_date', { ascending: false });

      if (dateRange?.from) {
        query = query.gte('report_date', dateRange.from);
      }
      if (dateRange?.to) {
        query = query.lte('report_date', dateRange.to);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as EngagementReport[];
    },
    enabled: !!workspaceId,
  });
}

// Mutations
export function useCreateSocialPost(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (post: Partial<SocialPost>) => {
      const { data, error } = await supabase
        .from('workspace_social_posts')
        .insert([{ ...post, workspace_id: workspaceId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts', workspaceId] });
      toast.success('Post created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create post: ${error.message}`);
    },
  });
}

export function useUpdateSocialPost(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SocialPost> & { id: string }) => {
      const { data, error } = await supabase
        .from('workspace_social_posts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts', workspaceId] });
      toast.success('Post updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update post: ${error.message}`);
    },
  });
}

export function useDeleteSocialPost(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_social_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts', workspaceId] });
      toast.success('Post deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete post: ${error.message}`);
    },
  });
}

export function usePublishPostNow(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('workspace_social_posts')
        .update({ 
          status: 'published', 
          published_at: new Date().toISOString(),
          scheduled_for: null 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts', workspaceId] });
      toast.success('Post published successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to publish post: ${error.message}`);
    },
  });
}

// Hashtag Mutations
export function useCreateHashtag(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (hashtag: Partial<Hashtag>) => {
      const { data, error } = await supabase
        .from('workspace_hashtags')
        .insert([{ ...hashtag, workspace_id: workspaceId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hashtags', workspaceId] });
      toast.success('Hashtag added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add hashtag: ${error.message}`);
    },
  });
}

export function useUpdateHashtag(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Hashtag> & { id: string }) => {
      const { data, error } = await supabase
        .from('workspace_hashtags')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hashtags', workspaceId] });
      toast.success('Hashtag updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update hashtag: ${error.message}`);
    },
  });
}

export function useDeleteHashtag(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_hashtags')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hashtags', workspaceId] });
      toast.success('Hashtag deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete hashtag: ${error.message}`);
    },
  });
}

// Platform Mutations
export function useCreatePlatform(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (platform: Partial<SocialPlatform>) => {
      const { data, error } = await supabase
        .from('workspace_social_platforms')
        .insert([{ ...platform, workspace_id: workspaceId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-platforms', workspaceId] });
      toast.success('Platform connected successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to connect platform: ${error.message}`);
    },
  });
}

export function useUpdatePlatform(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SocialPlatform> & { id: string }) => {
      const { data, error } = await supabase
        .from('workspace_social_platforms')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-platforms', workspaceId] });
      toast.success('Platform updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update platform: ${error.message}`);
    },
  });
}

export function useDeletePlatform(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_social_platforms')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-platforms', workspaceId] });
      toast.success('Platform disconnected');
    },
    onError: (error: Error) => {
      toast.error(`Failed to disconnect platform: ${error.message}`);
    },
  });
}

// Engagement Report Mutations
export function useCreateEngagementReport(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (report: Partial<EngagementReport>) => {
      const { data, error } = await supabase
        .from('workspace_engagement_reports')
        .insert([{ ...report, workspace_id: workspaceId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement-reports', workspaceId] });
      toast.success('Report generated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to generate report: ${error.message}`);
    },
  });
}
