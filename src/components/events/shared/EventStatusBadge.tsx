import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type EventStatus = 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';

interface EventStatusBadgeProps {
  status: EventStatus | string;
  className?: string;
}

const statusConfig: Record<EventStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  DRAFT: { label: 'Draft', variant: 'secondary' },
  PUBLISHED: { label: 'Published', variant: 'default' },
  ONGOING: { label: 'Live', variant: 'default' },
  COMPLETED: { label: 'Completed', variant: 'outline' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
  ARCHIVED: { label: 'Archived', variant: 'secondary' },
};

export function EventStatusBadge({ status, className }: EventStatusBadgeProps) {
  const config = statusConfig[status as EventStatus] || { label: status, variant: 'secondary' as const };
  
  return (
    <Badge 
      variant={config.variant} 
      className={cn(
        status === 'ONGOING' && 'animate-pulse bg-green-500 text-white',
        className
      )}
      aria-label={`Event status: ${config.label}`}
    >
      {config.label}
    </Badge>
  );
}
