import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon as Search, 
  ChevronRightIcon as ChevronRight, 
  ClockIcon as Clock, 
  UserIcon as User, 
  HandThumbUpIcon as ThumbsUp, 
  HandThumbDownIcon as ThumbsDown, 
  BookOpenIcon as BookOpen 
} from '@heroicons/react/24/outline';

interface KnowledgeBaseProps {
  searchQuery?: string;
  currentContext?: string;
  user?: any;
}

interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  author: string;
  lastUpdated: string;
  readTime: number;
  helpful: number;
  notHelpful: number;
  views: number;
  featured: boolean;
  roles?: string[];
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  articleCount: number;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
  notHelpful: number;
}

export const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ 
  searchQuery = '', 
  currentContext,
  user 
}) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<Article[]>([]);

  // Mock data - in real implementation, this would come from API
  const mockCategories: Category[] = [
    { id: 'getting-started', name: 'Getting Started', description: 'Basic setup and first steps', icon: '', articleCount: 12 },
    { id: 'events', name: 'Event Management', description: 'Creating and managing events', icon: '', articleCount: 18 },
    { id: 'workspaces', name: 'Workspaces', description: 'Team collaboration and task management', icon: '', articleCount: 15 },
    { id: 'marketplace', name: 'Marketplace', description: 'Finding and booking services', icon: '', articleCount: 10 },
    { id: 'analytics', name: 'Analytics & Reports', description: 'Understanding your data', icon: '', articleCount: 8 },
    { id: 'troubleshooting', name: 'Troubleshooting', description: 'Common issues and solutions', icon: '', articleCount: 14 },
  ];

  const mockArticles: Article[] = [
    {
      id: '1',
      title: 'How to Create Your First Event',
      content: 'Step-by-step guide to creating your first event...',
      excerpt: 'Learn the basics of event creation with this comprehensive guide.',
      category: 'getting-started',
      tags: ['events', 'beginner', 'setup'],
      author: 'Support Team',
      lastUpdated: '2024-01-15',
      readTime: 5,
      helpful: 45,
      notHelpful: 3,
      views: 1250,
      featured: true,
      roles: ['ORGANIZER'],
    },
    {
      id: '2',
      title: 'Managing Team Members in Workspaces',
      content: 'Complete guide to team management...',
      excerpt: 'Add, remove, and manage team members effectively in your workspace.',
      category: 'workspaces',
      tags: ['team', 'collaboration', 'roles'],
      author: 'Product Team',
      lastUpdated: '2024-01-10',
      readTime: 7,
      helpful: 32,
      notHelpful: 1,
      views: 890,
      featured: true,
      roles: ['ORGANIZER', 'TEAM_LEAD'],
    },
    {
      id: '3',
      title: 'Understanding Event Analytics',
      content: 'Deep dive into event analytics and reporting...',
      excerpt: 'Make data-driven decisions with comprehensive event analytics.',
      category: 'analytics',
      tags: ['analytics', 'reports', 'data'],
      author: 'Analytics Team',
      lastUpdated: '2024-01-08',
      readTime: 10,
      helpful: 28,
      notHelpful: 2,
      views: 654,
      featured: false,
      roles: ['ORGANIZER'],
    },
  ];

  const mockFAQs: FAQ[] = [
    {
      id: '1',
      question: 'How do I reset my password?',
      answer: 'You can reset your password by clicking the "Forgot Password" link on the login page.',
      category: 'account',
      helpful: 156,
      notHelpful: 8,
    },
    {
      id: '2',
      question: 'Can I change my event after publishing?',
      answer: 'Yes, you can edit most event details after publishing, but some changes may require participant notification.',
      category: 'events',
      helpful: 89,
      notHelpful: 4,
    },
    {
      id: '3',
      question: 'How do I invite team members to my workspace?',
      answer: 'Go to your workspace settings and use the "Invite Members" feature to send invitations via email.',
      category: 'workspaces',
      helpful: 67,
      notHelpful: 2,
    },
  ];

  useEffect(() => {
    // Simulate API call
    setLoading(true);
    setTimeout(() => {
      setCategories(mockCategories);
      setArticles(mockArticles);
      setFaqs(mockFAQs);
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = articles.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, articles]);

  const filteredArticles = searchQuery 
    ? searchResults 
    : selectedCategory === 'all' 
      ? articles 
      : articles.filter(article => article.category === selectedCategory);

  const featuredArticles = articles.filter(article => article.featured);

  const handleArticleClick = (article: Article) => {
    setSelectedArticle(article);
    // Track article view
    console.log('Article viewed:', article.id);
  };

  const handleHelpfulClick = (articleId: string, helpful: boolean) => {
    // In real implementation, this would update the article rating
    console.log('Article feedback:', articleId, helpful);
  };

  if (selectedArticle) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Article Header */}
        <div className="p-6 border-b border-gray-200">
          <button
            onClick={() => setSelectedArticle(null)}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
          >
            ← Back to Knowledge Base
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedArticle.title}</h1>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center">
              <User className="w-4 h-4 mr-1" />
              {selectedArticle.author}
            </span>
            <span className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {selectedArticle.readTime} min read
            </span>
            <span>Updated {new Date(selectedArticle.lastUpdated).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Article Content */}
        <div className="p-6">
          <div className="prose max-w-none">
            <p className="text-lg text-gray-700 mb-6">{selectedArticle.excerpt}</p>
            <div className="whitespace-pre-wrap">{selectedArticle.content}</div>
          </div>

          {/* Tags */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {selectedArticle.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Feedback */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">Was this article helpful?</p>
            <div className="flex space-x-4">
              <button
                onClick={() => handleHelpfulClick(selectedArticle.id, true)}
                className="flex items-center space-x-2 px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50"
              >
                <ThumbsUp className="w-4 h-4" />
                <span>Yes ({selectedArticle.helpful})</span>
              </button>
              <button
                onClick={() => handleHelpfulClick(selectedArticle.id, false)}
                className="flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
              >
                <ThumbsDown className="w-4 h-4" />
                <span>No ({selectedArticle.notHelpful})</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Input */}
      {!searchQuery && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={`Search knowledge base${currentContext ? ` for ${currentContext}` : ''}...`}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {user && (
            <p className="mt-2 text-sm text-gray-500">
              Showing content relevant to {user.role.toLowerCase()} role
            </p>
          )}
        </div>
      )}
      {/* Featured Articles */}
      {!searchQuery && featuredArticles.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BookOpen className="w-5 h-5 mr-2" />
            Featured Articles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredArticles.map((article) => (
              <div
                key={article.id}
                onClick={() => handleArticleClick(article)}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
              >
                <h3 className="font-medium text-gray-900 mb-2">{article.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{article.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{article.readTime} min read</span>
                  <span>{article.views} views</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      {!searchQuery && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Browse by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-4 text-left border rounded-lg transition-colors ${
                  selectedCategory === category.id
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{category.icon}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">{category.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                <span className="text-xs text-gray-500">{category.articleCount} articles</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Articles List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {searchQuery ? `Search Results (${filteredArticles.length})` : 
               selectedCategory === 'all' ? 'All Articles' : 
               categories.find(c => c.id === selectedCategory)?.name}
            </h2>
            {selectedCategory !== 'all' && !searchQuery && (
              <button
                onClick={() => setSelectedCategory('all')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                View All
              </button>
            )}
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              onClick={() => handleArticleClick(article)}
              className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-2">{article.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{article.excerpt}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {article.readTime} min
                    </span>
                    <span>{article.views} views</span>
                    <span className="flex items-center">
                      <ThumbsUp className="w-3 h-3 mr-1" />
                      {article.helpful}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 ml-4" />
              </div>
            </div>
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No articles found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* FAQ Section */}
      {!searchQuery && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.slice(0, 3).map((faq) => (
              <div key={faq.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                <h3 className="font-medium text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600 text-sm mb-2">{faq.answer}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span className="flex items-center">
                    <ThumbsUp className="w-3 h-3 mr-1" />
                    {faq.helpful}
                  </span>
                  <span className="flex items-center">
                    <ThumbsDown className="w-3 h-3 mr-1" />
                    {faq.notHelpful}
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