import { useState } from 'react';
import { WorkspaceTemplateLibrary, LibraryTemplate } from './WorkspaceTemplateLibrary';
import { WorkspaceTemplateCreation } from './WorkspaceTemplateCreation';
import { WorkspaceTemplatePreview } from './WorkspaceTemplatePreview';
import { WorkspaceTemplateRating } from './WorkspaceTemplateRating';
import { IndustryTemplateBrowser } from './templates/IndustryTemplateBrowser';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WorkspaceTemplateManagementProps {
  workspaceId?: string;
  mode: 'library' | 'create' | 'apply';
  onTemplateApplied?: (template: LibraryTemplate) => void;
  onTemplateCreated?: (template: LibraryTemplate) => void;
}

export function WorkspaceTemplateManagement({
  workspaceId,
  mode,
  onTemplateApplied,
  onTemplateCreated
}: WorkspaceTemplateManagementProps) {
  const [currentMode, setCurrentMode] = useState(mode);
  const [libraryTab, setLibraryTab] = useState<'workspace' | 'tasks'>('workspace');
  const [selectedTemplate, setSelectedTemplate] = useState<LibraryTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyTemplate = async (template: LibraryTemplate, targetWorkspaceId: string) => {
    // Invoke edge function to apply template
    const { data, error } = await supabase.functions.invoke('apply-workspace-template', {
      body: {
        templateId: template.id,
        workspaceId: targetWorkspaceId,
      },
    });

    if (error) throw error;

    // Log workspace activity
    await supabase.from('workspace_activities').insert({
      workspace_id: targetWorkspaceId,
      type: 'template',
      title: `Template "${template.name}" applied`,
      description: 'Standard tasks, channels, and milestones were created from the template.',
      metadata: { templateId: template.id, templateName: template.name },
    });

    // Update template usage count
    await supabase
      .from('workspace_templates')
      .update({ usage_count: (template.usage_count || 0) + 1 })
      .eq('id', template.id);

    return data;
  };

  const handleTemplateSelect = async (template: LibraryTemplate) => {
    if (currentMode === 'apply' && workspaceId) {
      try {
        setLoading(true);
        setError(null);
        await applyTemplate(template, workspaceId);
        toast.success('Template applied successfully');
        onTemplateApplied?.(template);
      } catch (err: any) {
        setError('Failed to apply template');
        toast.error('Failed to apply template');
      } finally {
        setLoading(false);
      }
    } else {
      setSelectedTemplate(template);
    }
  };

  const handleTemplatePreview = (template: LibraryTemplate) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const handleTemplateCreated = (template: LibraryTemplate) => {
    onTemplateCreated?.(template);
    setCurrentMode('library');
  };

  const handleUseTemplate = async (template: LibraryTemplate) => {
    if (workspaceId) {
      try {
        setLoading(true);
        setError(null);
        await applyTemplate(template, workspaceId);
        setShowPreview(false);
        toast.success('Template applied successfully');
        onTemplateApplied?.(template);
      } catch (err: any) {
        setError('Failed to apply template');
        toast.error('Failed to apply template');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRatingSubmitted = () => {
    setShowRating(false);
    setSelectedTemplate(null);
  };

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
            <button 
              onClick={() => setError(null)}
              className="text-sm text-red-600 underline mt-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mode Navigation */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setCurrentMode('library')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentMode === 'library'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-input'
            }`}
          >
            Template Library
          </button>
          {workspaceId && (
            <button
              onClick={() => setCurrentMode('create')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                currentMode === 'create'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-input'
              }`}
            >
              Create Template
            </button>
          )}
        </nav>
      </div>

      {/* Content */}
      {currentMode === 'library' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLibraryTab('workspace')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                libraryTab === 'workspace'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              Workspace Templates
            </button>
            <button
              type="button"
              onClick={() => setLibraryTab('tasks')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                libraryTab === 'tasks'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              Task Templates
            </button>
          </div>

          {libraryTab === 'workspace' ? (
            <WorkspaceTemplateLibrary
              onTemplateSelect={handleTemplateSelect}
              onTemplatePreview={handleTemplatePreview}
              showActions={true}
            />
          ) : workspaceId ? (
            <IndustryTemplateBrowser workspaceId={workspaceId} />
          ) : (
            <div className="rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
              Select a workspace to browse and import task templates.
            </div>
          )}
        </div>
      )}

      {currentMode === 'create' && workspaceId && (
        <WorkspaceTemplateCreation
          workspaceId={workspaceId}
          onTemplateCreated={handleTemplateCreated}
          onCancel={() => setCurrentMode('library')}
        />
      )}

      {/* Template Preview Modal */}
      {showPreview && selectedTemplate && (
        <WorkspaceTemplatePreview
          template={selectedTemplate}
          onClose={() => setShowPreview(false)}
          onUseTemplate={workspaceId ? handleUseTemplate : undefined}
        />
      )}

      {/* Template Rating Modal */}
      {showRating && selectedTemplate && workspaceId && (
        <WorkspaceTemplateRating
          templateId={selectedTemplate.id}
          workspaceId={workspaceId}
          onRatingSubmitted={handleRatingSubmitted}
          onCancel={() => setShowRating(false)}
        />
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-muted-foreground/40 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            <span className="text-foreground">Applying template...</span>
          </div>
        </div>
      )}
    </div>
  );
}