import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, ClipboardList, Clock, CheckCircle, MoreVertical, Trash2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Checklist, ChecklistItem } from '@/hooks/useCommitteeDashboard';
import { DelegatedChecklistBadge } from './DelegatedChecklistBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type EventPhase = 'pre_event' | 'during_event' | 'post_event';

interface ChecklistCardProps {
  checklist: Checklist & { 
    phase?: EventPhase;
    delegated_from_workspace_id?: string | null;
    due_date?: string | null;
    delegation_status?: string;
    source_workspace?: { id: string; name: string } | null;
  };
  onToggleItem: (checklistId: string, itemId: string, completed: boolean) => void;
  onDelete?: (checklistId: string) => void;
  onDelegate?: (checklist: Checklist) => void;
  canDelegate?: boolean;
}

const phaseConfig = {
  pre_event: {
    label: 'Pre-Event',
    icon: ClipboardList,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  during_event: {
    label: 'During Event',
    icon: Clock,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  post_event: {
    label: 'Post-Event',
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
  },
};

export function ChecklistCard({ checklist, onToggleItem, onDelete, onDelegate, canDelegate }: ChecklistCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const phase = checklist.phase || 'pre_event';
  const config = phaseConfig[phase];
  const Icon = config.icon;

  const items = checklist.items || [];
  const completedCount = items.filter(item => item.completed).length;
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;
  const isDelegated = !!checklist.delegated_from_workspace_id;

  return (
    <Card className={cn("transition-all", config.borderColor)}>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={cn("p-1.5 rounded-md", config.bgColor)}>
              <Icon className={cn("h-3.5 w-3.5", config.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-medium truncate">{checklist.title}</CardTitle>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", config.color, config.borderColor)}>
                  {config.label}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {completedCount}/{items.length} items • {progress}%
                </span>
              </div>
              {isDelegated && (
                <div className="mt-1">
                  <DelegatedChecklistBadge
                    delegatedFromWorkspaceName={checklist.source_workspace?.name}
                    dueDate={checklist.due_date}
                    delegationStatus={checklist.delegation_status}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canDelegate && onDelegate && !isDelegated && (
                  <DropdownMenuItem onClick={() => onDelegate(checklist)}>
                    <Send className="h-3.5 w-3.5 mr-2" />
                    Delegate
                  </DropdownMenuItem>
                )}
                {canDelegate && onDelegate && !isDelegated && onDelete && (
                  <DropdownMenuSeparator />
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(checklist.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn("h-full transition-all", config.bgColor.replace('/10', ''))}
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>
      
      {isExpanded && items.length > 0 && (
        <CardContent className="py-2 px-4">
          <div className="space-y-2">
            {items.map((item: ChecklistItem) => (
              <label
                key={item.id}
                className={cn(
                  "flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors",
                  item.completed && "opacity-60"
                )}
              >
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={(checked) => onToggleItem(checklist.id, item.id, !!checked)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <span className={cn(
                    "text-sm",
                    item.completed && "line-through text-muted-foreground"
                  )}>
                    {item.text}
                  </span>
                  {item.completed && item.completedAt && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Completed {new Date(item.completedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
