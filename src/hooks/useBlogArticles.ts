import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ArticleStatus = 'draft' | 'review' | 'scheduled' | 'published';

export interface BlogArticle {
  id: string;
  workspace_id: string;
  title: string;
  author_id: string | null;
  author_name: string | null;
  status: ArticleStatus;
  word_count: number;
  target_word_count: number;
  scheduled_publish_date: string | null;
  published_at: string | null;
  view_count: number;
  description: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface CreateArticleInput {
  title: string;
  author_name?: string;
  description?: string;
  target_word_count?: number;
  tags?: string[];
}

export interface UpdateArticleInput {
  title?: string;
  author_name?: string;
  description?: string;
  status?: ArticleStatus;
  word_count?: number;
  target_word_count?: number;
  scheduled_publish_date?: string;
  tags?: string[];
}

export function useBlogArticles(workspaceId: string) {
  return useQuery({
    queryKey: ['blog-articles', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_content_items')
        .select('*')
        .eq('workspace_id', workspaceId)
        .in('type', ['article', 'blog'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(item => ({
        id: item.id,
        workspace_id: item.workspace_id,
        title: item.title,
        author_id: item.author_id,
        author_name: item.author_name,
        status: (item.status as ArticleStatus) || 'draft',
        word_count: item.word_count || 0,
        target_word_count: item.target_word_count || 1000,
        scheduled_publish_date: item.scheduled_publish_date,
        published_at: item.published_at,
        view_count: item.view_count || 0,
        description: item.description,
        tags: item.tags,
        created_at: item.created_at,
        updated_at: item.updated_at,
      })) as BlogArticle[];
    },
    enabled: !!workspaceId,
  });
}

export function useCreateBlogArticle(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateArticleInput) => {
      const { data, error } = await supabase
        .from('workspace_content_items')
        .insert([{
          workspace_id: workspaceId,
          title: input.title,
          author_name: input.author_name || null,
          description: input.description || null,
          target_word_count: input.target_word_count || 1000,
          tags: input.tags || [],
          type: 'article',
          status: 'draft',
          word_count: 0,
          view_count: 0,
          priority: 'medium',
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-articles', workspaceId] });
      toast.success('Article created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create article: ' + error.message);
    },
  });
}

export function useUpdateBlogArticle(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ articleId, updates }: { articleId: string; updates: UpdateArticleInput }) => {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.author_name !== undefined) updateData.author_name = updates.author_name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.status !== undefined) {
        updateData.status = updates.status;
        if (updates.status === 'published') {
          updateData.published_at = new Date().toISOString();
        }
      }
      if (updates.word_count !== undefined) updateData.word_count = updates.word_count;
      if (updates.target_word_count !== undefined) updateData.target_word_count = updates.target_word_count;
      if (updates.scheduled_publish_date !== undefined) updateData.scheduled_publish_date = updates.scheduled_publish_date;
      if (updates.tags !== undefined) updateData.tags = updates.tags;

      const { error } = await supabase
        .from('workspace_content_items')
        .update(updateData)
        .eq('id', articleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-articles', workspaceId] });
      toast.success('Article updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update article: ' + error.message);
    },
  });
}

export function useDeleteBlogArticle(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (articleId: string) => {
      const { error } = await supabase
        .from('workspace_content_items')
        .delete()
        .eq('id', articleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-articles', workspaceId] });
      toast.success('Article deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete article: ' + error.message);
    },
  });
}

export function useIncrementArticleViews(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (articleId: string) => {
      // First get current view count
      const { data: current, error: fetchError } = await supabase
        .from('workspace_content_items')
        .select('view_count')
        .eq('id', articleId)
        .single();

      if (fetchError) throw fetchError;

      // Increment view count
      const { error } = await supabase
        .from('workspace_content_items')
        .update({ view_count: (current?.view_count || 0) + 1 })
        .eq('id', articleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-articles', workspaceId] });
    },
  });
}

export function useBlogArticleStats(workspaceId: string) {
  const { data: articles } = useBlogArticles(workspaceId);

  const publishedCount = articles?.filter(a => a.status === 'published').length || 0;
  const draftCount = articles?.filter(a => a.status === 'draft').length || 0;
  const reviewCount = articles?.filter(a => a.status === 'review').length || 0;
  const scheduledCount = articles?.filter(a => a.status === 'scheduled').length || 0;
  const totalViews = articles?.reduce((sum, a) => sum + (a.view_count || 0), 0) || 0;
  const avgWordCount = articles?.length 
    ? Math.round(articles.reduce((sum, a) => sum + (a.word_count || 0), 0) / articles.length) 
    : 0;

  return {
    total: articles?.length || 0,
    publishedCount,
    draftCount,
    reviewCount,
    scheduledCount,
    totalViews,
    avgWordCount,
  };
}
