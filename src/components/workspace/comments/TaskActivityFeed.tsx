import { useTaskActivities } from '@/hooks/useTaskActivities';
import { ACTIVITY_TYPE_CONFIG, ActivityType } from '@/lib/commentTypes';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Activity, Plus, RefreshCw, Flag, UserPlus, UserMinus, Calendar, TrendingUp, MessageSquare, Upload, Link, Unlink, Edit, FileText, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Plus, RefreshCw, Flag, UserPlus, UserMinus, Calendar, TrendingUp, MessageSquare, Upload, Link, Unlink, Edit, FileText, Circle
};

interface TaskActivityFeedProps {
  taskId: string;
}

export function TaskActivityFeed({ taskId }: TaskActivityFeedProps) {
  const { activities, isLoading } = useTaskActivities({ taskId });

  if (isLoading) {
    return <div className="flex items-center justify-center h-48"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Activity className="h-10 w-10 text-muted-foreground/50 mb-3" />
        <h4 className="text-sm font-medium text-foreground">No activity yet</h4>
        <p className="text-sm text-muted-foreground mt-1">Activity will appear here as changes are made</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full pr-4">
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
        <div className="space-y-4">
          {activities.map(activity => {
            const config = ACTIVITY_TYPE_CONFIG[activity.activity_type] || { icon: 'Circle', color: 'text-muted-foreground', label: 'Activity' };
            const IconComponent = ICON_MAP[config.icon] || Circle;

            return (
              <div key={activity.id} className="relative flex gap-4 pl-2">
                <div className={cn('relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background border-2', config.color.replace('text-', 'border-'))}>
                  <IconComponent className={cn('h-4 w-4', config.color)} />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {activity.user && <span className="font-medium text-sm">{activity.user.full_name}</span>}
                    <span className="text-sm text-muted-foreground">{activity.description}</span>
                  </div>
                  <ActivityMetadata activityType={activity.activity_type} metadata={activity.metadata} />
                  <span className="text-xs text-muted-foreground mt-1 block">{formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}

function ActivityMetadata({ activityType, metadata }: { activityType: ActivityType; metadata: Record<string, unknown> }) {
  switch (activityType) {
    case 'status_changed':
      return <div className="flex items-center gap-2 mt-1 text-xs"><StatusBadge status={metadata.old_status as string} /><span className="text-muted-foreground">→</span><StatusBadge status={metadata.new_status as string} /></div>;
    case 'priority_changed':
      return <div className="flex items-center gap-2 mt-1 text-xs"><PriorityBadge priority={metadata.old_priority as string} /><span className="text-muted-foreground">→</span><PriorityBadge priority={metadata.new_priority as string} /></div>;
    case 'progress_updated':
      return <div className="flex items-center gap-2 mt-1 text-xs"><span className="text-muted-foreground">{metadata.old_progress as number}% → {metadata.new_progress as number}%</span></div>;
    default:
      return null;
  }
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = { TODO: 'bg-muted text-foreground', IN_PROGRESS: 'bg-info/20 text-info', COMPLETED: 'bg-success/20 text-success', BLOCKED: 'bg-destructive/20 text-destructive', ON_HOLD: 'bg-warning/20 text-warning' };
  return <span className={cn('px-2 py-0.5 rounded-full', colors[status] || 'bg-muted')}>{status?.replace(/_/g, ' ')}</span>;
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = { LOW: 'bg-muted text-foreground', MEDIUM: 'bg-info/20 text-info', HIGH: 'bg-orange-100 text-orange-700', CRITICAL: 'bg-destructive/20 text-destructive' };
  return <span className={cn('px-2 py-0.5 rounded-full', colors[priority] || 'bg-muted')}>{priority}</span>;
}
