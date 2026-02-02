import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, Circle, Clock, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  completed_at?: string | null;
  completed_by?: string | null;
}

interface SharedChecklist {
  id: string;
  title: string;
  description: string | null;
  phase: 'pre_event' | 'during_event' | 'post_event';
  items: ChecklistItem[];
  workspace_id: string;
  workspace_name?: string;
  event_id: string;
  is_shared: boolean;
  due_date: string | null;
  created_at: string;
}

interface SharedChecklistCardProps {
  checklist: SharedChecklist;
  currentWorkspaceId: string;
  onToggleItem: (itemId: string) => void;
}

export function SharedChecklistCard({ checklist, currentWorkspaceId, onToggleItem }: SharedChecklistCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const completedCount = checklist.items.filter(item => item.completed).length;
  const totalCount = checklist.items.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isOwner = checklist.workspace_id === currentWorkspaceId;

  const phaseColors = {
    pre_event: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    during_event: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    post_event: 'bg-green-500/10 text-green-600 border-green-500/20',
  };

  const phaseLabels = {
    pre_event: 'Pre-Event',
    during_event: 'During Event',
    post_event: 'Post-Event',
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 className="font-medium text-foreground truncate">{checklist.title}</h4>
              <Badge variant="outline" className={cn('text-xs', phaseColors[checklist.phase])}>
                {phaseLabels[checklist.phase]}
              </Badge>
              {isOwner && (
                <Badge variant="secondary" className="text-xs">
                  Owner
                </Badge>
              )}
            </div>
            
            {checklist.description && (
              <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                {checklist.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {checklist.workspace_name || 'Unknown workspace'}
              </span>
              {checklist.due_date && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Due {format(new Date(checklist.due_date), 'MMM d, yyyy')}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium text-foreground">
                {completedCount}/{totalCount}
              </div>
              <div className="text-xs text-muted-foreground">{progress}%</div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <Progress value={progress} className="h-1.5 mt-3" />
      </div>

      {/* Expanded Items */}
      {isExpanded && (
        <div className="border-t border-border divide-y divide-border">
          {checklist.items.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-start gap-3 p-3 transition-colors",
                isOwner && "hover:bg-muted/30 cursor-pointer"
              )}
              onClick={() => isOwner && onToggleItem(item.id)}
            >
              <div className="mt-0.5">
                {item.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className={cn(
                  "text-sm",
                  item.completed ? "text-muted-foreground line-through" : "text-foreground"
                )}>
                  {item.title}
                </span>
                {item.completed && item.completed_at && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Completed {format(new Date(item.completed_at), 'MMM d, h:mm a')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
