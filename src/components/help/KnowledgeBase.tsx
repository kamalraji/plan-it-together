import React, { useState, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  MagnifyingGlassIcon as Search, 
  ChevronRightIcon as ChevronRight, 
  ClockIcon as Clock, 
  UserIcon as User, 
  HandThumbUpIcon as ThumbsUp, 
  HandThumbDownIcon as ThumbsDown, 
  BookOpenIcon as BookOpen 
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import {
  useKBCategories,
  useKBArticles,
  useKBFAQs,
  useKBSearch,
  type KBArticle,
} from '@/hooks/useKnowledgeBase';

interface KnowledgeBaseProps {
  searchQuery?: string;
  currentContext?: string;
  user?: { role?: string };
}

export const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ 
  searchQuery = '', 
  currentContext,
  user 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);
  const [localSearchQuery, setLocalSearchQuery] = useState('');

  // Fetch data from database
  const { data: categories = [], isLoading: categoriesLoading } = useKBCategories();
  const { data: articles = [], isLoading: articlesLoading } = useKBArticles();
  const { data: faqs = [], isLoading: faqsLoading } = useKBFAQs();
  const { data: searchResults } = useKBSearch(searchQuery || localSearchQuery);

  const loading = categoriesLoading || articlesLoading || faqsLoading;

  // Filter articles based on search and category
  const filteredArticles = useMemo(() => {
    if (searchQuery || localSearchQuery) {
      return searchResults?.articles || [];
    }
    if (selectedCategory === 'all') {
      return articles;
    }
    return articles.filter(article => article.category?.slug === selectedCategory);
  }, [searchQuery, localSearchQuery, searchResults, selectedCategory, articles]);

  const featuredArticles = useMemo(() => 
    articles.filter(article => article.is_featured), 
    [articles]
  );

  // Calculate article counts per category
  const categoriesWithCounts = useMemo(() => 
    categories.map(cat => ({
      ...cat,
      articleCount: articles.filter(a => a.category_id === cat.id).length,
    })),
    [categories, articles]
  );

  const handleArticleClick = (article: KBArticle) => {
    setSelectedArticle(article);
  };

  // Article rating mutation
  const rateArticleMutation = useMutation({
    mutationFn: async ({ articleId, isHelpful }: { articleId: string; isHelpful: boolean }) => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        throw new Error('Please log in to rate articles');
      }

      const { error } = await supabase
        .from('article_ratings')
        .upsert(
          {
            article_id: articleId,
            user_id: currentUser.id,
            is_helpful: isHelpful,
          },
          {
            onConflict: 'article_id,user_id',
          }
        );

      if (error) throw error;
      return { articleId, isHelpful };
    },
    onSuccess: ({ isHelpful }) => {
      toast.success(isHelpful ? 'Thanks for the positive feedback!' : 'Thanks for the feedback. We\'ll work to improve.');
      
      if (selectedArticle) {
        setSelectedArticle(prev => prev ? {
          ...prev,
          helpful_count: isHelpful ? prev.helpful_count + 1 : prev.helpful_count,
          not_helpful_count: !isHelpful ? prev.not_helpful_count + 1 : prev.not_helpful_count,
        } : null);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit rating');
    },
  });

  const handleHelpfulClick = (articleId: string, helpful: boolean) => {
    rateArticleMutation.mutate({ articleId, isHelpful: helpful });
  };

  // Article detail view
  if (selectedArticle) {
    return (
      <div className="bg-card rounded-lg border border-border">
        <div className="p-6 border-b border-border">
          <button
            onClick={() => setSelectedArticle(null)}
            className="text-primary hover:text-primary/80 mb-4 flex items-center"
          >
            ← Back to Knowledge Base
          </button>
          <h1 className="text-2xl font-bold text-foreground mb-2">{selectedArticle.title}</h1>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span className="flex items-center">
              <User className="w-4 h-4 mr-1" />
              Support Team
            </span>
            <span className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {Math.ceil((selectedArticle.content?.length || 0) / 1000)} min read
            </span>
            <span>Updated {new Date(selectedArticle.updated_at).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="p-6">
          <div className="prose max-w-none">
            {selectedArticle.excerpt && (
              <p className="text-lg text-foreground mb-6">{selectedArticle.excerpt}</p>
            )}
            <div className="whitespace-pre-wrap text-foreground">{selectedArticle.content}</div>
          </div>

          {selectedArticle.tags && selectedArticle.tags.length > 0 && (
            <div className="mt-8 pt-6 border-t border-border">
              <div className="flex flex-wrap gap-2">
                {selectedArticle.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3">Was this article helpful?</p>
            <div className="flex space-x-4">
              <button
                onClick={() => handleHelpfulClick(selectedArticle.id, true)}
                disabled={rateArticleMutation.isPending}
                className="flex items-center space-x-2 px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 disabled:opacity-50"
              >
                <ThumbsUp className="w-4 h-4" />
                <span>Yes ({selectedArticle.helpful_count})</span>
              </button>
              <button
                onClick={() => handleHelpfulClick(selectedArticle.id, false)}
                disabled={rateArticleMutation.isPending}
                className="flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                <ThumbsDown className="w-4 h-4" />
                <span>No ({selectedArticle.not_helpful_count})</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="bg-card rounded-lg border border-border p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-4 bg-muted rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  // Empty state - no data yet
  const hasNoData = articles.length === 0 && categories.length === 0 && faqs.length === 0;

  return (
    <div className="space-y-6">
      {/* Search Input */}
      {!searchQuery && (
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder={`Search knowledge base${currentContext ? ` for ${currentContext}` : ''}...`}
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-foreground focus-visible:ring-ring focus-visible:border-primary"
            />
          </div>
          {user?.role && (
            <p className="mt-2 text-sm text-muted-foreground">
              Showing content relevant to {user.role.toLowerCase()} role
            </p>
          )}
        </div>
      )}

      {/* Empty state message */}
      {hasNoData && (
        <div className="bg-card rounded-lg border border-border p-8 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/70" />
          <h3 className="text-lg font-medium text-foreground mb-2">Knowledge Base Coming Soon</h3>
          <p className="text-muted-foreground">
            We're building our knowledge base. Check back soon for helpful articles, guides, and FAQs.
          </p>
        </div>
      )}

      {/* Featured Articles */}
      {!searchQuery && !localSearchQuery && featuredArticles.length > 0 && (
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <BookOpen className="w-5 h-5 mr-2" />
            Featured Articles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredArticles.map((article) => (
              <div
                key={article.id}
                onClick={() => handleArticleClick(article)}
                className="p-4 border border-border rounded-lg hover:border-primary/50 cursor-pointer transition-colors"
              >
                <h3 className="font-medium text-foreground mb-2">{article.title}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{article.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{Math.ceil((article.content?.length || 0) / 1000)} min read</span>
                  <span>{article.view_count} views</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      {!searchQuery && !localSearchQuery && categoriesWithCounts.length > 0 && (
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Browse by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoriesWithCounts.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.slug)}
                className={`p-4 text-left border rounded-lg transition-colors ${
                  selectedCategory === category.slug
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{category.icon || '📚'}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-foreground mb-1">{category.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{category.description}</p>
                <span className="text-xs text-muted-foreground">{category.articleCount} articles</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Articles List */}
      {(filteredArticles.length > 0 || searchQuery || localSearchQuery) && (
        <div className="bg-card rounded-lg border border-border">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {(searchQuery || localSearchQuery) ? `Search Results (${filteredArticles.length})` : 
                 selectedCategory === 'all' ? 'All Articles' : 
                 categories.find(c => c.slug === selectedCategory)?.name || 'Articles'}
              </h2>
              {selectedCategory !== 'all' && !searchQuery && !localSearchQuery && (
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="text-primary hover:text-primary/80 text-sm"
                >
                  View All
                </button>
              )}
            </div>
          </div>

          <div className="divide-y divide-border">
            {filteredArticles.map((article) => (
              <div
                key={article.id}
                onClick={() => handleArticleClick(article)}
                className="p-6 hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground mb-2">{article.title}</h3>
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{article.excerpt}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {Math.ceil((article.content?.length || 0) / 1000)} min
                      </span>
                      <span>{article.view_count} views</span>
                      <span className="flex items-center">
                        <ThumbsUp className="w-3 h-3 mr-1" />
                        {article.helpful_count}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground ml-4 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>

          {filteredArticles.length === 0 && (searchQuery || localSearchQuery) && (
            <div className="p-8 text-center text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/70" />
              <p>No articles found matching your search.</p>
            </div>
          )}
        </div>
      )}

      {/* FAQ Section */}
      {!searchQuery && !localSearchQuery && faqs.length > 0 && (
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.slice(0, 5).map((faq) => (
              <div key={faq.id} className="border-b border-border pb-4 last:border-b-0">
                <h3 className="font-medium text-foreground mb-2">{faq.question}</h3>
                <p className="text-muted-foreground text-sm mb-2">{faq.answer}</p>
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <span className="flex items-center">
                    <ThumbsUp className="w-3 h-3 mr-1" />
                    {faq.helpful_count}
                  </span>
                  <span className="flex items-center">
                    <ThumbsDown className="w-3 h-3 mr-1" />
                    {faq.not_helpful_count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
