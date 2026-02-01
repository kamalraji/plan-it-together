import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface WorkspaceTemplateCreationProps {
  workspaceId: string;
  onTemplateCreated: (template: any) => void;
  onCancel: () => void;
}

interface TemplateFormData {
  name: string;
  description: string;
  category: 'CONFERENCE' | 'WORKSHOP' | 'HACKATHON' | 'NETWORKING' | 'COMPETITION' | 'GENERAL';
  isPublic: boolean;
  tags: string[];
}

export function WorkspaceTemplateCreation({ workspaceId, onTemplateCreated, onCancel }: WorkspaceTemplateCreationProps) {
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    category: 'GENERAL',
    isPublic: false,
    tags: []
  });
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch workspace data from Supabase
  const { data: workspaceData, isLoading: workspaceLoading } = useQuery({
    queryKey: ['workspace-for-template', workspaceId],
    queryFn: async () => {
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .select('id, name')
        .eq('id', workspaceId)
        .single();
      
      if (workspaceError) throw workspaceError;

      // Fetch related data
      const [teamResult, tasksResult, channelsResult] = await Promise.all([
        supabase.from('workspace_team_members').select('id').eq('workspace_id', workspaceId),
        supabase.from('workspace_tasks').select('id').eq('workspace_id', workspaceId),
        supabase.from('workspace_channels').select('id').eq('workspace_id', workspaceId),
      ]);

      return {
        ...workspace,
        teamMembersCount: teamResult.data?.length || 0,
        tasksCount: tasksResult.data?.length || 0,
        channelsCount: channelsResult.data?.length || 0,
      };
    },
  });

  // Create template mutation (mock for now - table not in schema)
  const createTemplateMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Return mock data since workspace_templates table not in schema
      return {
        id: crypto.randomUUID(),
        name: formData.name,
        description: formData.description,
        category: formData.category,
      };
    },
    onSuccess: (data) => {
      toast({
        title: 'Template created',
        description: `Template "${formData.name}" has been created successfully.`,
      });
      onTemplateCreated(data);
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Failed to create template');
    },
  });

  // Pre-populate form when workspace data loads
  React.useEffect(() => {
    if (workspaceData) {
      setFormData(prev => ({
        ...prev,
        name: `${workspaceData.name} Template`,
        description: `Template based on successful workspace: ${workspaceData.name}`
      }));
    }
  }, [workspaceData]);

  const handleInputChange = (field: keyof TemplateFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createTemplateMutation.mutate();
  };

  if (workspaceLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-card shadow-lg rounded-lg">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground">Create Workspace Template</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Save this workspace structure as a reusable template for future events
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
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
        )}

        {/* Workspace Preview */}
        {workspaceData && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-foreground mb-2">Source Workspace</h3>
            <div className="text-sm text-muted-foreground">
              <p><strong>Name:</strong> {workspaceData.name}</p>
              <p><strong>Team Members:</strong> {workspaceData.teamMembersCount}</p>
              <p><strong>Tasks:</strong> {workspaceData.tasksCount}</p>
              <p><strong>Channels:</strong> {workspaceData.channelsCount}</p>
            </div>
          </div>
        )}

        {/* Template Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground">
            Template Name *
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="mt-1 block w-full border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary sm:text-sm"
            placeholder="Enter template name"
          />
        </div>

        {/* Template Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground">
            Description *
          </label>
          <textarea
            id="description"
            required
            rows={3}
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="mt-1 block w-full border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary sm:text-sm"
            placeholder="Describe what this template is best used for"
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-foreground">
            Event Category *
          </label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className="mt-1 block w-full border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary sm:text-sm"
          >
            <option value="GENERAL">General</option>
            <option value="CONFERENCE">Conference</option>
            <option value="WORKSHOP">Workshop</option>
            <option value="HACKATHON">Hackathon</option>
            <option value="NETWORKING">Networking</option>
            <option value="COMPETITION">Competition</option>
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-foreground">Tags</label>
          <div className="mt-1 flex flex-wrap gap-2 mb-2">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 text-indigo-600 hover:text-indigo-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              className="flex-1 border-input rounded-md shadow-sm focus-visible:ring-ring focus-visible:border-primary sm:text-sm"
              placeholder="Add tags (e.g., tech, startup, corporate)"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-3 py-2 border border-input rounded-md text-sm font-medium text-foreground bg-card hover:bg-muted/50"
            >
              Add
            </button>
          </div>
        </div>

        {/* Public/Private */}
        <div className="flex items-center">
          <input
            id="isPublic"
            type="checkbox"
            checked={formData.isPublic}
            onChange={(e) => handleInputChange('isPublic', e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus-visible:ring-ring border-input rounded"
          />
          <label htmlFor="isPublic" className="ml-2 block text-sm text-foreground">
            Make this template publicly available to all users
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-input rounded-md text-sm font-medium text-foreground bg-card hover:bg-muted/50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createTemplateMutation.isPending}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus-visible:ring-ring disabled:opacity-50"
          >
            {createTemplateMutation.isPending ? 'Creating...' : 'Create Template'}
          </button>
        </div>
      </form>
    </div>
  );
}
