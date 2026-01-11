import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Re-export campaign types and hooks from Growth Department for reuse
export { 
  useCampaigns, 
  useCreateCampaign, 
  useUpdateCampaign, 
  useDeleteCampaign,
  type Campaign 
} from './useGrowthDepartmentData';

// A/B Test types
export interface ABTest {
  id: string;
  workspace_id: string;
  campaign_id: string | null;
  name: string;
  description: string | null;
  test_type: string;
  status: string;
  variant_a: Record<string, any>;
  variant_b: Record<string, any>;
  variant_a_metrics: Record<string, any>;
  variant_b_metrics: Record<string, any>;
  sample_size: number;
  current_sample: number;
  winner: string | null;
  confidence_level: number | null;
  start_date: string | null;
  end_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialPost {
  id: string;
  workspace_id: string;
  title: string;
  content: string | null;
  platform: string;
  media_urls: string[] | null;
  scheduled_for: string | null;
  published_at: string | null;
  status: string | null;
  hashtags: string[] | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ScheduledContent {
  id: string;
  workspace_id: string;
  title: string;
  status: string | null;
  scheduled_date: string;
  scheduled_time: string | null;
  platform: string;
  created_at: string;
}

export interface MarketingAnalytics {
  totalCampaigns: number;
  activeCampaigns: number;
  totalReach: number;
  totalClicks: number;
  totalConversions: number;
  totalSpent: number;
  totalBudget: number;
  avgCTR: number;
  avgConversionRate: number;
}

// A/B Tests
export function useABTests(workspaceId: string) {
  return useQuery({
    queryKey: ['workspace-ab-tests', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_ab_tests')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ABTest[];
    },
    enabled: !!workspaceId,
  });
}

export function useCreateABTest(workspaceId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (test: Partial<ABTest>) => {
      const { data, error } = await supabase
        .from('workspace_ab_tests')
        .insert({
          workspace_id: workspaceId,
          campaign_id: test.campaign_id || null,
          name: test.name || 'New A/B Test',
          description: test.description || null,
          test_type: test.test_type || 'content',
          status: test.status || 'draft',
          variant_a: test.variant_a || {},
          variant_b: test.variant_b || {},
          variant_a_metrics: test.variant_a_metrics || { impressions: 0, clicks: 0, conversions: 0 },
          variant_b_metrics: test.variant_b_metrics || { impressions: 0, clicks: 0, conversions: 0 },
          sample_size: test.sample_size || 100,
          current_sample: 0,
          start_date: test.start_date || null,
          end_date: test.end_date || null,
          created_by: user?.id || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-ab-tests', workspaceId] });
      toast.success('A/B test created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create A/B test: ' + error.message);
    },
  });
}

export function useUpdateABTest(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ABTest> & { id: string }) => {
      const { data, error } = await supabase
        .from('workspace_ab_tests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-ab-tests', workspaceId] });
      toast.success('A/B test updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update A/B test: ' + error.message);
    },
  });
}

export function useDeleteABTest(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_ab_tests')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-ab-tests', workspaceId] });
      toast.success('A/B test deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete A/B test: ' + error.message);
    },
  });
}

// Social Posts
export function useSocialPosts(workspaceId: string) {
  return useQuery({
    queryKey: ['workspace-social-posts', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_social_posts')
        .select('id, workspace_id, title, content, platform, media_urls, scheduled_for, published_at, status, hashtags, created_by, created_at, updated_at')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as SocialPost[];
    },
    enabled: !!workspaceId,
  });
}

export function useCreateSocialPost(workspaceId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (post: Partial<SocialPost>) => {
      const { data, error } = await supabase
        .from('workspace_social_posts')
        .insert({
          workspace_id: workspaceId,
          title: post.title || 'Untitled Post',
          content: post.content || '',
          platform: post.platform || 'twitter',
          media_urls: post.media_urls || [],
          scheduled_for: post.scheduled_for || null,
          status: post.status || 'draft',
          hashtags: post.hashtags || [],
          created_by: user?.id || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-social-posts', workspaceId] });
      toast.success('Post scheduled successfully');
    },
    onError: (error) => {
      toast.error('Failed to schedule post: ' + error.message);
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
      queryClient.invalidateQueries({ queryKey: ['workspace-social-posts', workspaceId] });
      toast.success('Post updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update post: ' + error.message);
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
      queryClient.invalidateQueries({ queryKey: ['workspace-social-posts', workspaceId] });
      toast.success('Post deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete post: ' + error.message);
    },
  });
}

// Scheduled Content
export function useScheduledContent(workspaceId: string) {
  return useQuery({
    queryKey: ['workspace-scheduled-content', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_scheduled_content')
        .select('id, workspace_id, title, status, scheduled_date, scheduled_time, platform, created_at')
        .eq('workspace_id', workspaceId)
        .order('scheduled_date', { ascending: true });
      if (error) throw error;
      return (data || []) as ScheduledContent[];
    },
    enabled: !!workspaceId,
  });
}

// Marketing Analytics (aggregated from campaigns)
export function useMarketingAnalytics(workspaceId: string) {
  return useQuery({
    queryKey: ['marketing-analytics', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_campaigns')
        .select('*')
        .eq('workspace_id', workspaceId);
      
      if (error) throw error;
      
      const campaigns = data || [];
      const activeCampaigns = campaigns.filter(c => c.status === 'active');
      
      const analytics: MarketingAnalytics = {
        totalCampaigns: campaigns.length,
        activeCampaigns: activeCampaigns.length,
        totalReach: campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0),
        totalClicks: campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0),
        totalConversions: campaigns.reduce((sum, c) => sum + (c.conversions || 0), 0),
        totalSpent: campaigns.reduce((sum, c) => sum + (c.spent || 0), 0),
        totalBudget: campaigns.reduce((sum, c) => sum + (c.budget || 0), 0),
        avgCTR: 0,
        avgConversionRate: 0,
      };
      
      if (analytics.totalReach > 0) {
        analytics.avgCTR = (analytics.totalClicks / analytics.totalReach) * 100;
      }
      if (analytics.totalClicks > 0) {
        analytics.avgConversionRate = (analytics.totalConversions / analytics.totalClicks) * 100;
      }
      
      return analytics;
    },
    enabled: !!workspaceId,
  });
}

// Post Queue (for scheduled posts)
export function usePostQueue(workspaceId: string) {
  return useQuery({
    queryKey: ['social-post-queue', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_post_queue')
        .select('*, social_post:workspace_social_posts(*)')
        .eq('workspace_id', workspaceId)
        .order('scheduled_for', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });
}
