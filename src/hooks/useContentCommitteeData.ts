import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types - adjusted to match actual database schema
export interface ContentItem {
  id: string;
  workspace_id: string;
  title: string;
  content_type?: string | null;
  status: string;
  description?: string | null;
  author_id?: string | null;
  author_name?: string | null;
  category?: string | null;
  tags?: string[] | null;
  reviewer_id?: string | null;
  reviewer_name?: string | null;
  review_status?: string | null;
  published_at?: string | null;
  scheduled_publish_date?: string | null;
  version?: number | null;
  word_count?: number | null;
  target_word_count?: number | null;
  created_at: string;
  updated_at: string;
}

export interface ContentReview {
  id: string;
  workspace_id: string;
  content_item_id: string;
  reviewer_id?: string | null;
  reviewer_name?: string | null;
  status: string;
  feedback?: string | null;
  score?: number | null;
  assigned_at?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
  content_item?: ContentItem | null;
}

export interface ContentTemplate {
  id: string;
  workspace_id: string;
  name: string;
  description?: string | null;
  category: string;
  content_type: string;
  template_structure: Record<string, unknown>;
  sample_content?: string | null;
  thumbnail_url?: string | null;
  is_active: boolean;
  usage_count: number;
  created_by?: string | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduledContent {
  id: string;
  workspace_id: string;
  content_item_id?: string | null;
  title: string;
  platform: string;
  scheduled_date: string;
  scheduled_time?: string | null;
  status: string;
  content_preview?: string | null;
  media_urls?: string[] | null;
  assigned_to?: string | null;
  assigned_name?: string | null;
  created_at: string;
  updated_at: string;
  content_item?: ContentItem | null;
}

export interface ContentCommitteeStats {
  totalItems: number;
  draftCount: number;
  inReviewCount: number;
  approvedCount: number;
  publishedCount: number;
  scheduledCount: number;
  templatesCount: number;
  pendingReviews: number;
}

// Content Items Hooks
export function useContentItems(workspaceId: string) {
  return useQuery({
    queryKey: ['content-items', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_content_items')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as ContentItem[];
    },
    enabled: !!workspaceId,
  });
}

export function useCreateContentItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Partial<ContentItem> & { workspace_id: string; title: string }) => {
      const { data, error } = await supabase
        .from('workspace_content_items')
        .insert(item as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['content-items', data.workspace_id] });
      toast.success('Content item created');
    },
    onError: (error) => {
      toast.error('Failed to create content: ' + error.message);
    },
  });
}

export function useUpdateContentItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ContentItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('workspace_content_items')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['content-items', data.workspace_id] });
      toast.success('Content updated');
    },
    onError: (error) => {
      toast.error('Failed to update: ' + error.message);
    },
  });
}

export function useDeleteContentItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, workspaceId }: { id: string; workspaceId: string }) => {
      const { error } = await supabase.from('workspace_content_items').delete().eq('id', id);
      if (error) throw error;
      return { id, workspaceId };
    },
    onSuccess: ({ workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['content-items', workspaceId] });
      toast.success('Content deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete: ' + error.message);
    },
  });
}

export function useUpdateContentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, workspaceId }: { id: string; status: string; workspaceId: string }) => {
      const updates: Record<string, unknown> = { status };
      if (status === 'published') {
        updates.published_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('workspace_content_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['content-items', data.workspace_id] });
      toast.success(`Status updated to ${data.status}`);
    },
    onError: (error) => {
      toast.error('Failed to update status: ' + error.message);
    },
  });
}

// Content Reviews Hooks
export function useContentReviews(workspaceId: string) {
  return useQuery({
    queryKey: ['content-reviews', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_content_reviews')
        .select('*, content_item:workspace_content_items(*)')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as ContentReview[];
    },
    enabled: !!workspaceId,
  });
}

export function useAssignReviewer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contentItemId,
      workspaceId,
      reviewerId,
      reviewerName,
    }: {
      contentItemId: string;
      workspaceId: string;
      reviewerId?: string;
      reviewerName: string;
    }) => {
      const { data: review, error: reviewError } = await supabase
        .from('workspace_content_reviews')
        .insert({
          workspace_id: workspaceId,
          content_item_id: contentItemId,
          reviewer_id: reviewerId,
          reviewer_name: reviewerName,
          status: 'pending',
        })
        .select()
        .single();

      if (reviewError) throw reviewError;

      await supabase
        .from('workspace_content_items')
        .update({ reviewer_id: reviewerId, reviewer_name: reviewerName, review_status: 'pending', status: 'review' })
        .eq('id', contentItemId);

      return review;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['content-reviews', data.workspace_id] });
      queryClient.invalidateQueries({ queryKey: ['content-items', data.workspace_id] });
      toast.success('Reviewer assigned');
    },
    onError: (error) => {
      toast.error('Failed to assign: ' + error.message);
    },
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reviewId,
      status,
      feedback,
      score,
      workspaceId,
      contentItemId,
    }: {
      reviewId: string;
      status: 'approved' | 'rejected' | 'revision_requested';
      feedback?: string;
      score?: number;
      workspaceId: string;
      contentItemId: string;
    }) => {
      const { data: review, error: reviewError } = await supabase
        .from('workspace_content_reviews')
        .update({ status, feedback, score, reviewed_at: new Date().toISOString() })
        .eq('id', reviewId)
        .select()
        .single();

      if (reviewError) throw reviewError;

      const contentStatus = status === 'approved' ? 'approved' : status === 'rejected' ? 'draft' : 'revision';
      await supabase
        .from('workspace_content_items')
        .update({ review_status: status, status: contentStatus })
        .eq('id', contentItemId);

      return { review, workspaceId };
    },
    onSuccess: ({ workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['content-reviews', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['content-items', workspaceId] });
      toast.success('Review submitted');
    },
    onError: (error) => {
      toast.error('Failed to submit review: ' + error.message);
    },
  });
}

// Content Templates Hooks
export function useContentTemplates(workspaceId: string) {
  return useQuery({
    queryKey: ['content-templates', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_content_templates')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('is_active', true)
        .order('usage_count', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as ContentTemplate[];
    },
    enabled: !!workspaceId,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: Partial<ContentTemplate> & { workspace_id: string; name: string }) => {
      const { data, error } = await supabase
        .from('workspace_content_templates')
        .insert(template as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['content-templates', data.workspace_id] });
      toast.success('Template created');
    },
    onError: (error) => {
      toast.error('Failed to create template: ' + error.message);
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, workspaceId }: { id: string; workspaceId: string }) => {
      const { error } = await supabase.from('workspace_content_templates').update({ is_active: false }).eq('id', id);
      if (error) throw error;
      return { id, workspaceId };
    },
    onSuccess: ({ workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['content-templates', workspaceId] });
      toast.success('Template deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete template: ' + error.message);
    },
  });
}

export function useUseTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateId, workspaceId, title }: { templateId: string; workspaceId: string; title: string }) => {
      const { data: template } = await supabase
        .from('workspace_content_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (!template) throw new Error('Template not found');

      const { data: contentItem, error } = await supabase
        .from('workspace_content_items')
        .insert({
          workspace_id: workspaceId,
          title,
          content_type: template.content_type,
          category: template.category,
          description: template.sample_content,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      return contentItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['content-items', data.workspace_id] });
      toast.success('Content created from template');
    },
    onError: (error) => {
      toast.error('Failed to use template: ' + error.message);
    },
  });
}

// Scheduled Content Hooks
export function useScheduledContent(workspaceId: string) {
  return useQuery({
    queryKey: ['scheduled-content', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_scheduled_content')
        .select('*, content_item:workspace_content_items(*)')
        .eq('workspace_id', workspaceId)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as ScheduledContent[];
    },
    enabled: !!workspaceId,
  });
}

export function useScheduleContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scheduled: Partial<ScheduledContent> & {
      workspace_id: string;
      title: string;
      platform: string;
      scheduled_date: string;
    }) => {
      const { data, error } = await supabase
        .from('workspace_scheduled_content')
        .insert(scheduled as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-content', data.workspace_id] });
      toast.success('Content scheduled');
    },
    onError: (error) => {
      toast.error('Failed to schedule: ' + error.message);
    },
  });
}

export function usePublishContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ scheduledId, contentItemId, workspaceId }: { scheduledId?: string; contentItemId: string; workspaceId: string }) => {
      const { data: contentItem, error } = await supabase
        .from('workspace_content_items')
        .update({ status: 'published', published_at: new Date().toISOString() })
        .eq('id', contentItemId)
        .select()
        .single();

      if (error) throw error;

      if (scheduledId) {
        await supabase.from('workspace_scheduled_content').update({ status: 'published' }).eq('id', scheduledId);
      }

      return { contentItem, workspaceId };
    },
    onSuccess: ({ workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['content-items', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['scheduled-content', workspaceId] });
      toast.success('Content published');
    },
    onError: (error) => {
      toast.error('Failed to publish: ' + error.message);
    },
  });
}

export function useCancelScheduledContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, workspaceId }: { id: string; workspaceId: string }) => {
      const { data, error } = await supabase
        .from('workspace_scheduled_content')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, workspaceId };
    },
    onSuccess: ({ workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-content', workspaceId] });
      toast.success('Cancelled');
    },
    onError: (error) => {
      toast.error('Failed to cancel: ' + error.message);
    },
  });
}

// Stats Hook
export function useContentCommitteeStats(workspaceId: string) {
  return useQuery({
    queryKey: ['content-committee-stats', workspaceId],
    queryFn: async (): Promise<ContentCommitteeStats> => {
      const [contentResult, reviewsResult, templatesResult, scheduledResult] = await Promise.all([
        supabase.from('workspace_content_items').select('status').eq('workspace_id', workspaceId),
        supabase.from('workspace_content_reviews').select('id', { count: 'exact' }).eq('workspace_id', workspaceId).eq('status', 'pending'),
        supabase.from('workspace_content_templates').select('id', { count: 'exact' }).eq('workspace_id', workspaceId).eq('is_active', true),
        supabase.from('workspace_scheduled_content').select('id', { count: 'exact' }).eq('workspace_id', workspaceId).eq('status', 'scheduled'),
      ]);

      const items = contentResult.data || [];
      const statusCounts = items.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalItems: items.length,
        draftCount: statusCounts['draft'] || 0,
        inReviewCount: statusCounts['review'] || 0,
        approvedCount: statusCounts['approved'] || 0,
        publishedCount: statusCounts['published'] || 0,
        scheduledCount: scheduledResult.count || 0,
        templatesCount: templatesResult.count || 0,
        pendingReviews: reviewsResult.count || 0,
      };
    },
    enabled: !!workspaceId,
  });
}
