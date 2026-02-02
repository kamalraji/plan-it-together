import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export interface SocialMediaAccount {
  id: string;
  workspace_id: string;
  platform: string;
  name: string;
  icon: string | null;
  handle: string;
  followers: number;
  engagement_rate: number;
  trend: 'up' | 'down' | 'stable';
  posts_this_week: number;
  posts_goal: number;
  color: string | null;
  connected: boolean;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Hashtag {
  id: string;
  workspace_id: string;
  tag: string;
  uses_count: number;
  reach: number;
  trend: 'trending' | 'stable' | 'declining';
  is_primary: boolean;
  last_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AudienceDemographic {
  id: string;
  workspace_id: string;
  demographic_type: 'age' | 'location' | 'industry';
  label: string;
  value: number;
  color: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Fetch social media accounts
export function useSocialMediaAccounts(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['social-media-accounts', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      
      const { data, error } = await supabase
        .from('social_media_accounts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('name');

      if (error) throw error;
      return (data || []) as SocialMediaAccount[];
    },
    enabled: !!workspaceId,
  });
}

// Fetch hashtags
export function useHashtags(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['hashtags', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      
      const { data, error } = await supabase
        .from('hashtag_tracking')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('uses_count', { ascending: false });

      if (error) throw error;
      return (data || []) as Hashtag[];
    },
    enabled: !!workspaceId,
  });
}

// Fetch audience demographics
export function useAudienceDemographics(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['audience-demographics', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return { age: [], location: [], industry: [] };
      
      const { data, error } = await supabase
        .from('audience_demographics')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('sort_order');

      if (error) throw error;
      
      const demographics = (data || []) as AudienceDemographic[];
      
      return {
        age: demographics.filter(d => d.demographic_type === 'age'),
        location: demographics.filter(d => d.demographic_type === 'location'),
        industry: demographics.filter(d => d.demographic_type === 'industry'),
      };
    },
    enabled: !!workspaceId,
  });
}

// Mutations
export function useAddSocialMediaAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (account: Omit<SocialMediaAccount, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('social_media_accounts')
        .insert(account)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['social-media-accounts', variables.workspace_id] });
      toast.success('Platform added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add platform: ' + error.message);
    },
  });
}

export function useUpdateSocialMediaAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, workspaceId, ...updates }: Partial<SocialMediaAccount> & { id: string; workspaceId: string }) => {
      const { data, error } = await supabase
        .from('social_media_accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['social-media-accounts', variables.workspaceId] });
    },
  });
}

export function useAddHashtag() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (hashtag: Omit<Hashtag, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('hashtag_tracking')
        .insert(hashtag)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hashtags', variables.workspace_id] });
      toast.success('Hashtag added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add hashtag: ' + error.message);
    },
  });
}

export function useDeleteHashtag() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, workspaceId }: { id: string; workspaceId: string }) => {
      const { error } = await supabase
        .from('hashtag_tracking')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, workspaceId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hashtags', variables.workspaceId] });
      toast.success('Hashtag removed');
    },
  });
}

export function useUpdateAudienceDemographics() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ workspaceId, demographics }: { 
      workspaceId: string; 
      demographics: Omit<AudienceDemographic, 'id' | 'created_at' | 'updated_at'>[] 
    }) => {
      // Upsert all demographics
      const { data, error } = await supabase
        .from('audience_demographics')
        .upsert(
          demographics.map(d => ({ ...d, workspace_id: workspaceId })),
          { onConflict: 'workspace_id,demographic_type,label' }
        )
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['audience-demographics', variables.workspaceId] });
      toast.success('Demographics updated');
    },
  });
}

// Default data for seeding new workspaces
export const DEFAULT_PLATFORMS: Omit<SocialMediaAccount, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>[] = [
  { platform: 'twitter', name: 'Twitter/X', icon: '𝕏', handle: '@eventname', followers: 0, engagement_rate: 0, trend: 'stable', posts_this_week: 0, posts_goal: 21, color: 'bg-sky-500', connected: false, last_synced_at: null },
  { platform: 'instagram', name: 'Instagram', icon: '📷', handle: '@eventname', followers: 0, engagement_rate: 0, trend: 'stable', posts_this_week: 0, posts_goal: 14, color: 'bg-pink-500', connected: false, last_synced_at: null },
  { platform: 'linkedin', name: 'LinkedIn', icon: '💼', handle: 'Event Name', followers: 0, engagement_rate: 0, trend: 'stable', posts_this_week: 0, posts_goal: 7, color: 'bg-blue-600', connected: false, last_synced_at: null },
  { platform: 'facebook', name: 'Facebook', icon: '📘', handle: 'Event Name Page', followers: 0, engagement_rate: 0, trend: 'stable', posts_this_week: 0, posts_goal: 10, color: 'bg-indigo-500', connected: false, last_synced_at: null },
  { platform: 'tiktok', name: 'TikTok', icon: '🎵', handle: '@eventname', followers: 0, engagement_rate: 0, trend: 'stable', posts_this_week: 0, posts_goal: 7, color: 'bg-foreground/80', connected: false, last_synced_at: null },
  { platform: 'youtube', name: 'YouTube', icon: '▶️', handle: 'Event Name Channel', followers: 0, engagement_rate: 0, trend: 'stable', posts_this_week: 0, posts_goal: 3, color: 'bg-red-600', connected: false, last_synced_at: null },
];

export const DEFAULT_HASHTAGS: Omit<Hashtag, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>[] = [
  { tag: '#EventName2026', uses_count: 0, reach: 0, trend: 'stable', is_primary: true, last_updated_at: null },
  { tag: '#TechConference', uses_count: 0, reach: 0, trend: 'stable', is_primary: true, last_updated_at: null },
];

export const DEFAULT_DEMOGRAPHICS = {
  age: [
    { demographic_type: 'age' as const, label: '18-24', value: 18, color: 'bg-pink-500', sort_order: 0 },
    { demographic_type: 'age' as const, label: '25-34', value: 42, color: 'bg-blue-500', sort_order: 1 },
    { demographic_type: 'age' as const, label: '35-44', value: 28, color: 'bg-emerald-500', sort_order: 2 },
    { demographic_type: 'age' as const, label: '45-54', value: 8, color: 'bg-amber-500', sort_order: 3 },
    { demographic_type: 'age' as const, label: '55+', value: 4, color: 'bg-purple-500', sort_order: 4 },
  ],
  location: [
    { demographic_type: 'location' as const, label: 'Chennai', value: 35, color: null, sort_order: 0 },
    { demographic_type: 'location' as const, label: 'Bangalore', value: 25, color: null, sort_order: 1 },
    { demographic_type: 'location' as const, label: 'Mumbai', value: 18, color: null, sort_order: 2 },
    { demographic_type: 'location' as const, label: 'Delhi', value: 12, color: null, sort_order: 3 },
    { demographic_type: 'location' as const, label: 'Other', value: 10, color: null, sort_order: 4 },
  ],
  industry: [
    { demographic_type: 'industry' as const, label: 'Technology', value: 45, color: null, sort_order: 0 },
    { demographic_type: 'industry' as const, label: 'Finance', value: 20, color: null, sort_order: 1 },
    { demographic_type: 'industry' as const, label: 'Education', value: 15, color: null, sort_order: 2 },
    { demographic_type: 'industry' as const, label: 'Healthcare', value: 12, color: null, sort_order: 3 },
    { demographic_type: 'industry' as const, label: 'Other', value: 8, color: null, sort_order: 4 },
  ],
};
