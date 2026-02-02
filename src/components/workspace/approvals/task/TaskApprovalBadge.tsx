import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TaskApprovalStatus } from '@/lib/taskApprovalTypes';
import { cn } from '@/lib/utils';

interface TaskApprovalBadgeProps {
  status: TaskApprovalStatus;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  onClick?: () => void;
}

const StatusIcon = {
  NONE: null,
  PENDING: Clock,
  APPROVED: CheckCircle,
  REJECTED: XCircle,
};

const StatusColors = {
  NONE: '',
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  APPROVED: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  REJECTED: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
};

const StatusLabels = {
  NONE: '',
  PENDING: 'Pending Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export function TaskApprovalBadge({ 
  status, 
  showLabel = true, 
  size = 'sm',
  className,
  onClick,
}: TaskApprovalBadgeProps) {
  if (status === 'NONE') return null;

  const Icon = StatusIcon[status];
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  const badge = (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 cursor-default transition-colors',
        StatusColors[status],
        onClick && 'cursor-pointer hover:opacity-80',
        size === 'sm' && 'text-xs px-1.5 py-0.5',
        size === 'md' && 'text-sm px-2 py-1',
        className
      )}
      onClick={onClick}
    >
      {Icon && <Icon className={iconSize} />}
      {showLabel && <span>{StatusLabels[status]}</span>}
    </Badge>
  );

  if (!showLabel) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p>{StatusLabels[status]}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return badge;
}

interface ApprovalProgressBadgeProps {
  currentLevel: number;
  totalLevels: number;
  className?: string;
}

export function ApprovalProgressBadge({
  currentLevel,
  totalLevels,
  className,
}: ApprovalProgressBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
        className
      )}
    >
      <span>Level {currentLevel} of {totalLevels}</span>
    </Badge>
  );
}
