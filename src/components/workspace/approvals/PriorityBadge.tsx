import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AlertTriangle, ArrowDown, ArrowUp, Flame } from 'lucide-react';

export type ApprovalPriority = 'low' | 'medium' | 'high' | 'urgent';

interface PriorityBadgeProps {
  priority: ApprovalPriority;
  className?: string;
}

const priorityConfig: Record<ApprovalPriority, { 
  label: string; 
  icon: typeof ArrowDown;
  className: string;
}> = {
  low: {
    label: 'Low',
    icon: ArrowDown,
    className: 'bg-slate-500/10 text-muted-foreground hover:bg-slate-500/20 border-slate-500/20',
  },
  medium: {
    label: 'Medium',
    icon: ArrowUp,
    className: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20',
  },
  high: {
    label: 'High',
    icon: AlertTriangle,
    className: 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20',
  },
  urgent: {
    label: 'Urgent',
    icon: Flame,
    className: 'bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20',
  },
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority] || priorityConfig.medium;
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={cn('text-xs gap-1', config.className, className)}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

export function getPriorityOrder(priority: ApprovalPriority): number {
  const order: Record<ApprovalPriority, number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  return order[priority] ?? 2;
}
