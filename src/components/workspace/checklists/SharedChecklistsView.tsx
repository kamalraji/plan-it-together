import { useState } from 'react';
import { Globe, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useSharedChecklists } from '@/hooks/useSharedChecklists';
import { SharedChecklistCard } from './SharedChecklistCard';
import { CategorySuggestionsCard } from './CategorySuggestionsCard';
import { CreateSharedChecklistDialog } from './CreateSharedChecklistDialog';
import type { Workspace } from '@/types';

interface SharedChecklistsViewProps {
  workspace: Workspace;
  eventId: string | null;
}

export function SharedChecklistsView({ workspace, eventId }: SharedChecklistsViewProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const {
    sharedChecklists,
    isLoading,
    isError,
    event,
    categoryTemplates,
    createSharedChecklist,
    createFromTemplate,
    toggleSharedItem,
    overallProgress,
  } = useSharedChecklists({ eventId, workspaceId: workspace.id });

  if (!eventId) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Event Associated</h3>
        <p className="text-sm text-muted-foreground">
          This workspace is not associated with an event. Shared checklists are available for event workspaces.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-8 text-center">
        <Globe className="h-12 w-12 mx-auto text-destructive mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Failed to Load</h3>
        <p className="text-sm text-muted-foreground">
          Could not load shared checklists. Please try refreshing the page.
        </p>
      </div>
    );
  }

  const preEventChecklists = sharedChecklists.filter(c => c.phase === 'pre_event');
  const duringEventChecklists = sharedChecklists.filter(c => c.phase === 'during_event');
  const postEventChecklists = sharedChecklists.filter(c => c.phase === 'post_event');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Shared Checklists
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Common assignments visible to all workspaces in {event?.name || 'this event'}
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Create Shared Checklist
        </Button>
      </div>

      {/* Overall Progress */}
      {sharedChecklists.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Overall Progress</span>
            <span className="text-sm text-muted-foreground">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      )}

      {/* Category Suggestions */}
      {categoryTemplates.length > 0 && (
        <CategorySuggestionsCard
          templates={categoryTemplates}
          eventCategory={event?.category || null}
          onAddTemplate={(template) => createFromTemplate.mutate(template)}
          isAdding={createFromTemplate.isPending}
          existingTitles={sharedChecklists.map(c => c.title)}
        />
      )}

      {/* Checklists by Phase */}
      {sharedChecklists.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
          <Globe className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-sm font-medium text-foreground mb-1">No shared checklists yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create a shared checklist or add one from the suggestions above.
          </p>
          <Button variant="outline" size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Create First Checklist
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pre-Event */}
          {preEventChecklists.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Pre-Event ({preEventChecklists.length})
              </h3>
              <div className="grid gap-4">
                {preEventChecklists.map((checklist) => (
                  <SharedChecklistCard
                    key={checklist.id}
                    checklist={checklist}
                    currentWorkspaceId={workspace.id}
                    onToggleItem={(itemId) => toggleSharedItem.mutate({ checklistId: checklist.id, itemId })}
                  />
                ))}
              </div>
            </div>
          )}

          {/* During Event */}
          {duringEventChecklists.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                During Event ({duringEventChecklists.length})
              </h3>
              <div className="grid gap-4">
                {duringEventChecklists.map((checklist) => (
                  <SharedChecklistCard
                    key={checklist.id}
                    checklist={checklist}
                    currentWorkspaceId={workspace.id}
                    onToggleItem={(itemId) => toggleSharedItem.mutate({ checklistId: checklist.id, itemId })}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Post-Event */}
          {postEventChecklists.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Post-Event ({postEventChecklists.length})
              </h3>
              <div className="grid gap-4">
                {postEventChecklists.map((checklist) => (
                  <SharedChecklistCard
                    key={checklist.id}
                    checklist={checklist}
                    currentWorkspaceId={workspace.id}
                    onToggleItem={(itemId) => toggleSharedItem.mutate({ checklistId: checklist.id, itemId })}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Dialog */}
      <CreateSharedChecklistDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={(data) => {
          createSharedChecklist.mutate(data);
          setShowCreateDialog(false);
        }}
        isSubmitting={createSharedChecklist.isPending}
        eventCategory={event?.category || null}
      />
    </div>
  );
}
