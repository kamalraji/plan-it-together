import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isBefore, startOfDay } from 'date-fns';

interface TaskCardProps {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string | null;
  assignee?: {
    id: string;
    name: string;
    avatarUrl?: string;
  } | null;
  tags?: string[];
  estimatedHours?: number | null;
  onClick?: () => void;
  className?: string;
}

const priorityConfig = {
  URGENT: { color: 'text-red-500', bg: 'bg-red-500/10', label: 'Urgent' },
  HIGH: { color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'High' },
  MEDIUM: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Medium' },
  LOW: { color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Low' },
} as const;

const statusConfig = {
  TODO: { color: 'text-muted-foreground', bg: 'bg-muted', label: 'To Do' },
  IN_PROGRESS: { color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'In Progress' },
  IN_REVIEW: { color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'In Review' },
  COMPLETED: { color: 'text-green-500', bg: 'bg-green-500/10', label: 'Completed' },
  BLOCKED: { color: 'text-red-500', bg: 'bg-red-500/10', label: 'Blocked' },
} as const;

function TaskCardComponent({
  title,
  status,
  priority,
  dueDate,
  assignee,
  tags,
  estimatedHours,
  onClick,
  className,
}: TaskCardProps) {
  const priorityStyle = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.MEDIUM;
  const statusStyle = statusConfig[status as keyof typeof statusConfig] || statusConfig.TODO;

  const isOverdue = dueDate && isBefore(new Date(dueDate), startOfDay(new Date())) && status !== 'COMPLETED';
  const isDueToday = dueDate && format(new Date(dueDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <Card
      className={cn(
        'p-3 cursor-pointer transition-all hover:shadow-md hover:border-primary/30',
        isOverdue && 'border-red-500/50',
        className
      )}
      onClick={onClick}
    >
      <div className="space-y-2">
        {/* Title */}
        <h4 className="text-sm font-medium line-clamp-2">{title}</h4>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Status and Priority */}
        <div className="flex items-center gap-2">
          <Badge className={cn('text-[10px]', statusStyle.bg, statusStyle.color)} variant="secondary">
            {statusStyle.label}
          </Badge>
          <div className={cn('flex items-center gap-1', priorityStyle.color)}>
            <Flag className="h-3 w-3" />
            <span className="text-[10px]">{priorityStyle.label}</span>
          </div>
        </div>

        {/* Footer: Due date, hours, assignee */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {dueDate && (
              <div className={cn('flex items-center gap-1', isOverdue && 'text-red-500', isDueToday && 'text-orange-500')}>
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(dueDate), 'MMM d')}</span>
              </div>
            )}
            {estimatedHours && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{estimatedHours}h</span>
              </div>
            )}
          </div>

          {assignee && (
            <Avatar className="h-5 w-5">
              <AvatarImage src={assignee.avatarUrl} alt={assignee.name} />
              <AvatarFallback className="text-[8px]">
                {assignee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </Card>
  );
}

/**
 * Memoized TaskCard component for use in lists
 * Only re-renders when props change
 */
export const MemoizedTaskCard = memo(TaskCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.title === nextProps.title &&
    prevProps.status === nextProps.status &&
    prevProps.priority === nextProps.priority &&
    prevProps.dueDate === nextProps.dueDate &&
    prevProps.assignee?.id === nextProps.assignee?.id &&
    JSON.stringify(prevProps.tags) === JSON.stringify(nextProps.tags) &&
    prevProps.estimatedHours === nextProps.estimatedHours
  );
});

MemoizedTaskCard.displayName = 'MemoizedTaskCard';

export default MemoizedTaskCard;
