import { useState, useEffect } from 'react';
import { WorkspaceTemplate } from '../../types/workspace-template';
import api from '../../lib/api';
import { ThinkingPerson } from '@/components/illustrations';

interface WorkspaceTemplateLibraryProps {
  onTemplateSelect?: (template: WorkspaceTemplate) => void;
  onTemplatePreview?: (template: WorkspaceTemplate) => void;
  showActions?: boolean;
  eventSize?: number;
  eventCategory?: string;
}

export function WorkspaceTemplateLibrary({ 
  onTemplateSelect, 
  onTemplatePreview, 
  showActions = true,
  eventSize,
  eventCategory 
}: WorkspaceTemplateLibraryProps) {
  const [templates, setTemplates] = useState<WorkspaceTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<WorkspaceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedComplexity, setSelectedComplexity] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'usage' | 'created'>('rating');

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    filterAndSortTemplates();
  }, [templates, searchTerm, selectedCategory, selectedComplexity, sortBy, eventSize, eventCategory]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/workspace-templates');
      setTemplates(response.data);
    } catch (_error) {
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortTemplates = () => {
    let filtered = [...templates];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Apply complexity filter
    if (selectedComplexity !== 'ALL') {
      filtered = filtered.filter(template => template.complexity === selectedComplexity);
    }

    // Apply event size filter if provided
    if (eventSize) {
      filtered = filtered.filter(template => 
        eventSize >= template.eventSizeMin && eventSize <= template.eventSizeMax
      );
    }

    // Apply event category filter if provided
    if (eventCategory && eventCategory !== 'ALL') {
      filtered = filtered.filter(template => template.category === eventCategory);
    }

    // Sort templates
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          return b.averageRating - a.averageRating;
        case 'usage':
          return b.usageCount - a.usageCount;
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    setFilteredTemplates(filtered);
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'SIMPLE':
        return 'bg-green-100 text-green-800';
      case 'MODERATE':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLEX':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'CONFERENCE':
        return 'CONF';
      case 'WORKSHOP':
        return 'WRK';
      case 'HACKATHON':
        return 'HACK';
      case 'NETWORKING':
        return 'NET';
      case 'COMPETITION':
        return 'COMP';
      default:
        return 'EVT';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400' : 'text-muted-foreground/70'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-sm text-muted-foreground">({rating.toFixed(1)})</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Workspace Templates</h2>
          <p className="text-muted-foreground">Choose from proven workspace structures for your event</p>
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredTemplates.length} of {templates.length} templates
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card p-4 rounded-lg shadow border border-border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search templates..."
              className="w-full border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary sm:text-sm"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary sm:text-sm"
            >
              <option value="ALL">All Categories</option>
              <option value="CONFERENCE">Conference</option>
              <option value="WORKSHOP">Workshop</option>
              <option value="HACKATHON">Hackathon</option>
              <option value="NETWORKING">Networking</option>
              <option value="COMPETITION">Competition</option>
              <option value="GENERAL">General</option>
            </select>
          </div>

          {/* Complexity Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Complexity</label>
            <select
              value={selectedComplexity}
              onChange={(e) => setSelectedComplexity(e.target.value)}
              className="w-full border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary sm:text-sm"
            >
              <option value="ALL">All Levels</option>
              <option value="SIMPLE">Simple</option>
              <option value="MODERATE">Moderate</option>
              <option value="COMPLEX">Complex</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary sm:text-sm"
            >
              <option value="rating">Rating</option>
              <option value="usage">Most Used</option>
              <option value="name">Name</option>
              <option value="created">Newest</option>
            </select>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="bg-card rounded-lg shadow border border-border hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">{getCategoryIcon(template.category)}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">{template.category}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(template.complexity)}`}>
                  {template.complexity}
                </span>
              </div>

              {/* Description */}
              <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{template.description}</p>

              {/* Stats */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Team Size:</span>
                  <span className="text-foreground">{template.eventSizeMin}-{template.eventSizeMax} people</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Used:</span>
                  <span className="text-foreground">{template.usageCount} times</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Rating:</span>
                  {renderStars(template.averageRating)}
                </div>
              </div>

              {/* Structure Preview */}
              {template.structure && (
                <div className="bg-muted/50 rounded-md p-3 mb-4">
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Roles: {template.structure.roles?.length || 0}</div>
                    <div>Task Categories: {template.structure.taskCategories?.length || 0}</div>
                    <div>Channels: {template.structure.channels?.length || 0}</div>
                  </div>
                </div>
              )}

              {/* Actions */}
              {showActions && (
                <div className="flex space-x-2">
                  {onTemplatePreview && (
                    <button
                      onClick={() => onTemplatePreview(template)}
                      className="flex-1 px-3 py-2 border border-input rounded-md text-sm font-medium text-foreground bg-card hover:bg-muted/50"
                    >
                      Preview
                    </button>
                  )}
                  {onTemplateSelect && (
                    <button
                      onClick={() => onTemplateSelect(template)}
                      className="flex-1 px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Use Template
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 flex flex-col items-center">
          <ThinkingPerson size="sm" showBackground={false} />
          <h3 className="mt-4 text-sm font-medium text-foreground">No templates found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your filters or search terms.
          </p>
        </div>
      )}
    </div>
  );
}