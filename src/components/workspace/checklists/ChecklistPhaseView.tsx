import { ChecklistCard } from './ChecklistCard';
import type { Checklist } from '@/hooks/useCommitteeDashboard';

type EventPhase = 'pre_event' | 'during_event' | 'post_event';

export interface ChecklistPhaseViewProps {
  checklists: (Checklist & { phase?: EventPhase })[];
  onToggleItem: (checklistId: string, itemId: string, completed: boolean) => void;
  onDelete?: (checklistId: string) => void;
  onDelegate?: (checklist: Checklist) => void;
  canDelegate?: boolean;
  emptyMessage?: string;
}

export function ChecklistPhaseView({ 
  checklists, 
  onToggleItem, 
  onDelete,
  onDelegate,
  canDelegate = false,
  emptyMessage = "No checklists in this phase yet."
}: ChecklistPhaseViewProps) {
  if (checklists.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {checklists.map(checklist => (
        <ChecklistCard
          key={checklist.id}
          checklist={checklist}
          onToggleItem={onToggleItem}
          onDelete={onDelete}
          onDelegate={onDelegate}
          canDelegate={canDelegate}
        />
      ))}
    </div>
  );
}
