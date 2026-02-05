
import { useEventStatusHistory } from '@/hooks/useEventStatusHistory';
import { 
  ArrowRight, 
  User, 
  Clock,
  History,
  Loader2 
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface EventStatusHistoryProps {
  eventId: string;
}

export function EventStatusHistory({ eventId }: EventStatusHistoryProps) {
  const { history, isLoading } = useEventStatusHistory(eventId);

  const getStatusStyle = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: 'bg-warning/20 text-warning',
      PUBLISHED: 'bg-success/20 text-success',
      ONGOING: 'bg-info/20 text-info',
      COMPLETED: 'bg-muted text-muted-foreground',
      CANCELLED: 'bg-destructive/20 text-destructive',
    };
    return styles[status] || 'bg-muted text-muted-foreground';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No status changes recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <History className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-medium">Status History</h3>
      </div>

      <div className="space-y-3">
        {history.map((item, index) => (
          <div 
            key={item.id}
            className={cn(
              'relative pl-6 pb-4',
              index < history.length - 1 && 'border-l-2 border-border ml-2'
            )}
          >
            {/* Timeline Dot */}
            <div className="absolute -left-[5px] top-0 w-3 h-3 rounded-full bg-primary border-2 border-background" />

            <div className="rounded-lg bg-muted/30 p-3">
              {/* Status Change */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  getStatusStyle(item.previousStatus)
                )}>
                  {item.previousStatus}
                </span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  getStatusStyle(item.newStatus)
                )}>
                  {item.newStatus}
                </span>
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(item.createdAt), 'PPp')}
                </div>
                {item.changedByName && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {item.changedByName}
                  </div>
                )}
              </div>

              {/* Reason */}
              {item.reason && (
                <p className="mt-2 text-sm text-muted-foreground bg-muted/50 rounded p-2">
                  {item.reason}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
