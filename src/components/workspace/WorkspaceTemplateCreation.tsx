import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCreateTemplate } from '@/hooks/useWorkspaceTemplates';
import { Loader2 } from 'lucide-react';

interface WorkspaceTemplateCreationProps {
  workspaceId: string;
  onTemplateCreated: (template: any) => void;
  onCancel: () => void;
}

interface TemplateFormData {
  name: string;
  description: string;
  event_type: 'CONFERENCE' | 'WORKSHOP' | 'HACKATHON' | 'NETWORKING' | 'COMPETITION' | 'GENERAL';
  isPublic: boolean;
}

export function WorkspaceTemplateCreation({ workspaceId, onTemplateCreated, onCancel }: WorkspaceTemplateCreationProps) {
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    event_type: 'GENERAL',
    isPublic: false,
  });
  const [error, setError] = useState<string | null>(null);

  const createTemplate = useCreateTemplate();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    createTemplate.mutate({
      name: formData.name,
      description: formData.description,
      event_type: formData.event_type,
      is_public: formData.isPublic,
      source_workspace_id: workspaceId,
    }, {
      onSuccess: (data) => {
        onTemplateCreated(data);
      },
      onError: (err) => {
        setError(err instanceof Error ? err.message : 'Failed to create template');
      },
    });
  };

  if (workspaceLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          <div className="bg-destructive/10 border border-destructive/30 rounded-md p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Workspace Preview */}
        {workspaceData && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-foreground mb-2">Source Workspace</h3>
            <div className="text-sm text-muted-foreground space-y-1">
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
            className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary sm:text-sm"
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
            className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary sm:text-sm"
            placeholder="Describe what this template is best used for"
          />
        </div>

        {/* Event Type */}
        <div>
          <label htmlFor="event_type" className="block text-sm font-medium text-foreground">
            Event Type *
          </label>
          <select
            id="event_type"
            value={formData.event_type}
            onChange={(e) => handleInputChange('event_type', e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary sm:text-sm"
          >
            <option value="GENERAL">General</option>
            <option value="CONFERENCE">Conference</option>
            <option value="WORKSHOP">Workshop</option>
            <option value="HACKATHON">Hackathon</option>
            <option value="NETWORKING">Networking</option>
            <option value="COMPETITION">Competition</option>
          </select>
        </div>

        {/* Public/Private */}
        <div className="flex items-center">
          <input
            id="isPublic"
            type="checkbox"
            checked={formData.isPublic}
            onChange={(e) => handleInputChange('isPublic', e.target.checked)}
            className="h-4 w-4 text-primary focus:ring-ring border-input rounded"
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
            className="px-4 py-2 border border-input rounded-md text-sm font-medium text-foreground bg-background hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createTemplate.isPending}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 transition-colors"
          >
            {createTemplate.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </span>
            ) : (
              'Create Template'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
