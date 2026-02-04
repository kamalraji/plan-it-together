/**
 * Knowledge Base Hooks
 * Fetches articles, categories, FAQs, and tutorials from the database
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Types
export interface KBCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface KBArticle {
  id: string;
  category_id: string | null;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  is_published: boolean;
  is_featured: boolean;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  published_at: string | null;
  category?: KBCategory;
}

export interface KBFAQ {
  id: string;
  category_id: string | null;
  question: string;
  answer: string;
  is_published: boolean;
  sort_order: number;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  tags: string[];
  category?: KBCategory;
}

export interface KBTutorial {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string | null;
  difficulty: string;
  estimated_minutes: number;
  steps: TutorialStep[];
  is_published: boolean;
  is_featured: boolean;
  completion_count: number;
  sort_order: number;
  target_roles: string[];
}

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  action?: string;
  target?: string;
}

export interface KBTutorialProgress {
  id: string;
  user_id: string;
  tutorial_id: string;
  current_step: number;
  completed_steps: number[];
  is_completed: boolean;
  started_at: string;
  completed_at: string | null;
}

export interface KBContextualHelp {
  id: string;
  context_key: string;
  title: string;
  content: string;
  related_article_id: string | null;
  related_tutorial_id: string | null;
  is_active: boolean;
}

// Fetch all active categories
export function useKBCategories() {
  return useQuery({
    queryKey: ['kb-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kb_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data as KBCategory[];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Fetch published articles
export function useKBArticles(options?: { categorySlug?: string; featured?: boolean; limit?: number }) {
  return useQuery({
    queryKey: ['kb-articles', options],
    queryFn: async () => {
      let query = supabase
        .from('kb_articles')
        .select(`
          *,
          category:kb_categories(*)
        `)
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      if (options?.featured) {
        query = query.eq('is_featured', true);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filter by category if specified
      let articles = data as KBArticle[];
      if (options?.categorySlug) {
        articles = articles.filter(a => a.category?.slug === options.categorySlug);
      }

      return articles;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Fetch single article by slug
export function useKBArticle(slug: string) {
  return useQuery({
    queryKey: ['kb-article', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kb_articles')
        .select(`
          *,
          category:kb_categories(*)
        `)
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      return data as KBArticle;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });
}

// Fetch published FAQs
export function useKBFAQs(options?: { categorySlug?: string }) {
  return useQuery({
    queryKey: ['kb-faqs', options],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kb_faqs')
        .select(`
          *,
          category:kb_categories(*)
        `)
        .eq('is_published', true)
        .order('sort_order');

      if (error) throw error;

      let faqs = data as KBFAQ[];
      if (options?.categorySlug) {
        faqs = faqs.filter(f => f.category?.slug === options.categorySlug);
      }

      return faqs;
    },
    staleTime: 1000 * 60 * 10,
  });
}

// Fetch published tutorials
export function useKBTutorials(options?: { category?: string; featured?: boolean }) {
  return useQuery({
    queryKey: ['kb-tutorials', options],
    queryFn: async () => {
      let query = supabase
        .from('kb_tutorials')
        .select('*')
        .eq('is_published', true)
        .order('sort_order');

      if (options?.category) {
        query = query.eq('category', options.category);
      }

      if (options?.featured) {
        query = query.eq('is_featured', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Parse steps JSON for each tutorial
      return (data || []).map(t => ({
        ...t,
        steps: (t.steps as unknown as TutorialStep[]) || [],
        difficulty: t.difficulty || 'beginner',
        estimated_minutes: t.estimated_minutes || 5,
        completion_count: t.completion_count || 0,
        sort_order: t.sort_order || 0,
        target_roles: t.target_roles || [],
      })) as KBTutorial[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

// Fetch single tutorial
export function useKBTutorial(slug: string) {
  return useQuery({
    queryKey: ['kb-tutorial', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kb_tutorials')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      
      // Parse steps JSON
      return {
        ...data,
        steps: (data.steps as unknown as TutorialStep[]) || [],
        difficulty: data.difficulty || 'beginner',
        estimated_minutes: data.estimated_minutes || 5,
        completion_count: data.completion_count || 0,
        sort_order: data.sort_order || 0,
        target_roles: data.target_roles || [],
      } as KBTutorial;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });
}

// Fetch user's tutorial progress
export function useKBTutorialProgress() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['kb-tutorial-progress', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('kb_tutorial_progress')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data as KBTutorialProgress[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
  });
}

// Update tutorial progress
export function useUpdateTutorialProgress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tutorialId,
      currentStep,
      completedSteps,
      isCompleted,
    }: {
      tutorialId: string;
      currentStep: number;
      completedSteps: number[];
      isCompleted: boolean;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('kb_tutorial_progress')
        .upsert({
          user_id: user.id,
          tutorial_id: tutorialId,
          current_step: currentStep,
          completed_steps: completedSteps,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        }, {
          onConflict: 'user_id,tutorial_id',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-tutorial-progress'] });
    },
  });
}

// Fetch contextual help
export function useKBContextualHelp(contextKey: string) {
  return useQuery({
    queryKey: ['kb-contextual-help', contextKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kb_contextual_help')
        .select('*')
        .eq('context_key', contextKey)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data as KBContextualHelp | null;
    },
    enabled: !!contextKey,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

// Search articles and FAQs
export function useKBSearch(query: string) {
  return useQuery({
    queryKey: ['kb-search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return { articles: [], faqs: [] };

      const searchTerm = `%${query}%`;

      const [articlesRes, faqsRes] = await Promise.all([
        supabase
          .from('kb_articles')
          .select(`*, category:kb_categories(*)`)
          .eq('is_published', true)
          .or(`title.ilike.${searchTerm},content.ilike.${searchTerm},excerpt.ilike.${searchTerm}`)
          .limit(10),
        supabase
          .from('kb_faqs')
          .select(`*, category:kb_categories(*)`)
          .eq('is_published', true)
          .or(`question.ilike.${searchTerm},answer.ilike.${searchTerm}`)
          .limit(10),
      ]);

      if (articlesRes.error) throw articlesRes.error;
      if (faqsRes.error) throw faqsRes.error;

      return {
        articles: articlesRes.data as KBArticle[],
        faqs: faqsRes.data as KBFAQ[],
      };
    },
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 2,
  });
}
