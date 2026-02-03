import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowDownRight, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

interface DelegatedChecklistBadgeProps {
  delegatedFromWorkspaceName?: string;
  dueDate?: string | null;
  delegationStatus?: string;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  in_progress: {
    label: 'In Progress',
    icon: Clock,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
  },
  overdue: {
    label: 'Overdue',
    icon: AlertCircle,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30',
  },
};

export function DelegatedChecklistBadge({
  delegatedFromWorkspaceName,
  dueDate,
  delegationStatus = 'pending',
}: DelegatedChecklistBadgeProps) {
  const status = statusConfig[delegationStatus as keyof typeof statusConfig] || statusConfig.pending;

  const dueDateObj = dueDate ? new Date(dueDate) : null;
  const isOverdue = dueDateObj && isPast(dueDateObj) && delegationStatus !== 'completed';
  const isDueToday = dueDateObj && isToday(dueDateObj);

  const effectiveStatus = isOverdue ? statusConfig.overdue : status;
  const EffectiveIcon = effectiveStatus.icon;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Delegated From Badge */}
        {delegatedFromWorkspaceName && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] px-1.5 py-0 gap-1 cursor-help',
                  'text-primary border-primary/30 bg-primary/5'
                )}
              >
                <ArrowDownRight className="h-2.5 w-2.5" />
                Delegated
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delegated from: {delegatedFromWorkspaceName}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Due Date Badge */}
        {dueDateObj && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] px-1.5 py-0 gap-1 cursor-help',
                  isOverdue && 'text-destructive border-destructive/30 bg-destructive/5',
                  isDueToday && !isOverdue && 'text-amber-600 border-amber-500/30 bg-amber-500/5',
                  !isOverdue && !isDueToday && 'text-muted-foreground'
                )}
              >
                <Clock className="h-2.5 w-2.5" />
                {isDueToday ? 'Due Today' : format(dueDateObj, 'MMM d')}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Due: {format(dueDateObj, 'PPP')}</p>
              {isOverdue && <p className="text-destructive font-medium">Overdue!</p>}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Status Badge */}
        <Badge
          variant="outline"
          className={cn(
            'text-[10px] px-1.5 py-0 gap-1',
            effectiveStatus.color,
            effectiveStatus.borderColor,
            effectiveStatus.bgColor
          )}
        >
          <EffectiveIcon className="h-2.5 w-2.5" />
          {effectiveStatus.label}
        </Badge>
      </div>
    </TooltipProvider>
  );
}
