import { useState, useMemo } from 'react';
import { Workspace } from '@/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, ClipboardList, Clock, CheckCircle, Calendar } from 'lucide-react';
import { ChecklistsSummaryCards, EventPhase } from './ChecklistsSummaryCards';
import { ChecklistPhaseView } from './ChecklistPhaseView';
import { CreateChecklistDialog } from './CreateChecklistDialog';
import { DelegateChecklistDialog } from './DelegateChecklistDialog';
import { useChecklists, Checklist } from '@/hooks/useCommitteeDashboard';
import { useChecklistDelegation } from '@/hooks/useChecklistDelegation';
import { useAuth } from '@/hooks/useAuth';
import { detectCommitteeType } from '@/hooks/useEventSettingsAccess';

interface ChecklistsTabContentProps {
  workspace: Workspace;
}

export function ChecklistsTabContent({ workspace }: ChecklistsTabContentProps) {
  const { user } = useAuth();
  const { checklists, isLoading, createChecklist, toggleItem } = useChecklists(workspace.id);
  const { delegateChecklist } = useChecklistDelegation(workspace.id);
  const [activePhase, setActivePhase] = useState<EventPhase | 'all'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDelegateDialog, setShowDelegateDialog] = useState(false);
  const [checklistToDelegate, setChecklistToDelegate] = useState<Checklist | null>(null);

  const committeeType = detectCommitteeType(workspace.name);
  const isRootWorkspace = workspace.workspaceType === 'ROOT';

  const checklistsWithPhase = useMemo(() => {
    return checklists.map(c => ({
      ...c,
      phase: (c as any).phase || 'pre_event' as EventPhase,
    }));
  }, [checklists]);

  const groupedChecklists = useMemo(() => ({
    pre_event: checklistsWithPhase.filter(c => c.phase === 'pre_event'),
    during_event: checklistsWithPhase.filter(c => c.phase === 'during_event'),
    post_event: checklistsWithPhase.filter(c => c.phase === 'post_event'),
  }), [checklistsWithPhase]);

  const calculateProgress = (phaseChecklists: typeof checklistsWithPhase) => {
    const totalItems = phaseChecklists.reduce((sum, c) => sum + (c.items?.length || 0), 0);
    const completedItems = phaseChecklists.reduce(
      (sum, c) => sum + (c.items?.filter(i => i.completed).length || 0),
      0
    );
    return {
      total: totalItems,
      completed: completedItems,
      percentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
    };
  };

  const handleToggleItem = (checklistId: string, itemId: string, completed: boolean) => {
    if (!user?.id) return;
    toggleItem({ checklistId, itemId, completed, userId: user.id });
  };

  const handleCreateChecklist = (data: {
    title: string;
    phase: EventPhase;
    items: { id: string; text: string; completed: boolean }[];
  }) => {
    createChecklist({
      workspace_id: workspace.id,
      title: data.title,
      committee_type: committeeType || null,
      items: data.items,
      is_template: false,
    } as any);
  };

  const handleOpenDelegate = (checklist: Checklist) => {
    setChecklistToDelegate(checklist);
    setShowDelegateDialog(true);
  };

  const handleDelegate = (data: { checklistId: string; targetWorkspaceId: string; dueDate: Date | null }) => {
    delegateChecklist(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Checklists</h2>
          <p className="text-sm text-muted-foreground">
            Organize tasks by event phase for better planning and execution.
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Checklist
        </Button>
      </div>

      <ChecklistsSummaryCards
        preEventProgress={calculateProgress(groupedChecklists.pre_event)}
        duringEventProgress={calculateProgress(groupedChecklists.during_event)}
        postEventProgress={calculateProgress(groupedChecklists.post_event)}
        activePhase={activePhase}
        onPhaseClick={setActivePhase}
      />

      <Tabs value={activePhase} onValueChange={(v) => setActivePhase(v as EventPhase | 'all')}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">All</span>
          </TabsTrigger>
          <TabsTrigger value="pre_event" className="gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Pre-Event</span>
          </TabsTrigger>
          <TabsTrigger value="during_event" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">During</span>
          </TabsTrigger>
          <TabsTrigger value="post_event" className="gap-1.5">
            <CheckCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Post-Event</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <ChecklistPhaseView
            checklists={checklistsWithPhase}
            onToggleItem={handleToggleItem}
            emptyMessage="No checklists yet. Create your first checklist to get started."
            canDelegate={isRootWorkspace}
            onDelegate={handleOpenDelegate}
          />
        </TabsContent>

        <TabsContent value="pre_event" className="mt-6">
          <ChecklistPhaseView
            checklists={groupedChecklists.pre_event}
            onToggleItem={handleToggleItem}
            emptyMessage="No pre-event checklists yet. Add planning and preparation tasks here."
            canDelegate={isRootWorkspace}
            onDelegate={handleOpenDelegate}
          />
        </TabsContent>

        <TabsContent value="during_event" className="mt-6">
          <ChecklistPhaseView
            checklists={groupedChecklists.during_event}
            onToggleItem={handleToggleItem}
            emptyMessage="No during-event checklists yet. Add day-of execution tasks here."
            canDelegate={isRootWorkspace}
            onDelegate={handleOpenDelegate}
          />
        </TabsContent>

        <TabsContent value="post_event" className="mt-6">
          <ChecklistPhaseView
            checklists={groupedChecklists.post_event}
            onToggleItem={handleToggleItem}
            emptyMessage="No post-event checklists yet. Add wrap-up and follow-up tasks here."
            canDelegate={isRootWorkspace}
            onDelegate={handleOpenDelegate}
          />
        </TabsContent>
      </Tabs>

      <CreateChecklistDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateChecklist}
        committeeType={committeeType}
      />

      <DelegateChecklistDialog
        open={showDelegateDialog}
        onOpenChange={setShowDelegateDialog}
        checklist={checklistToDelegate}
        sourceWorkspaceId={workspace.id}
        onDelegate={handleDelegate}
      />
    </div>
  );
}
