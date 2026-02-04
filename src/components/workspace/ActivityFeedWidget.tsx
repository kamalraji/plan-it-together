/**
 * Activity Feed Widget
 * Compact, real-time activity feed for dashboard sidebars
 */
import { formatDistanceToNow } from 'date-fns';
import { 
  Activity, 
  CheckCircle2, 
  MessageSquare, 
  Users, 
  DollarSign,
  Package,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useActivityFeed, ActivityFeedEvent } from '@/hooks/useActivityFeed';
import { cn } from '@/lib/utils';

interface ActivityFeedWidgetProps {
  eventId?: string;
  workspaceId?: string;
  maxItems?: number;
  className?: string;
  showHeader?: boolean;
}

const activityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  task_created: CheckCircle2,
  task_completed: CheckCircle2,
  task_updated: Activity,
  message_sent: MessageSquare,
  member_joined: Users,
  member_left: Users,
  budget_approved: DollarSign,
  budget_rejected: DollarSign,
  resource_approved: Package,
  resource_rejected: Package,
  default: Activity,
};

const activityColors: Record<string, string> = {
  task_completed: 'text-emerald-500',
  budget_approved: 'text-emerald-500',
  resource_approved: 'text-emerald-500',
  member_joined: 'text-blue-500',
  budget_rejected: 'text-destructive',
  resource_rejected: 'text-destructive',
  member_left: 'text-amber-500',
  default: 'text-muted-foreground',
};

function ActivityItem({ activity }: { activity: ActivityFeedEvent }) {
  const Icon = activityIcons[activity.activityType] || activityIcons.default;
  const colorClass = activityColors[activity.activityType] || activityColors.default;

  return (
    <div 
      className={cn(
        "flex gap-3 py-2.5 px-3 rounded-lg transition-colors",
        activity.isHighlighted && "bg-primary/5 border-l-2 border-primary"
      )}
      role="listitem"
    >
      <div className={cn("flex-shrink-0 mt-0.5", colorClass)}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {activity.title}
        </p>
        {activity.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {activity.description}
          </p>
        )}
        <time 
          className="text-[10px] text-muted-foreground mt-1 block"
          dateTime={activity.createdAt}
        >
          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
        </time>
      </div>
      {activity.isHighlighted && (
        <Badge variant="secondary" className="text-[10px] h-5 flex-shrink-0">
          New
        </Badge>
      )}
    </div>
  );
}

export function ActivityFeedWidget({
  eventId,
  workspaceId,
  maxItems = 10,
  className,
  showHeader = true,
}: ActivityFeedWidgetProps) {
  const { activities, isLoading, error } = useActivityFeed({
    eventId,
    workspaceId,
    limit: maxItems,
    enableRealtime: true,
  });

  return (
    <div 
      className={cn(
        "bg-card rounded-xl border border-border shadow-sm overflow-hidden",
        className
      )}
      role="region"
      aria-label="Activity feed"
    >
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Recent Activity
            </h3>
          </div>
          {activities.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {activities.length}
            </Badge>
          )}
        </div>
      )}

      <ScrollArea className="h-[300px]">
        <div className="p-2" role="list">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
            </div>
          )}

          {error && !isLoading && (
            <div className="flex items-center gap-2 px-3 py-4 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Failed to load activity</span>
            </div>
          )}

          {!isLoading && !error && activities.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No activity yet</p>
            </div>
          )}

          {!isLoading && !error && activities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
