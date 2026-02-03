import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Flag, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useEventTimeline, TimelineEvent } from '@/hooks/useEventScheduleData';

interface EventTimelineProps {
  workspaceId?: string;
}

export function EventTimeline({ workspaceId }: EventTimelineProps) {
  const { timelineEvents, isLoading } = useEventTimeline(workspaceId);

  const getTypeIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'current': return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'milestone': return <Flag className="h-4 w-4 text-purple-500" />;
      case 'alert': return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getTypeBadge = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'completed': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
      case 'current': return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
      case 'milestone': return 'bg-purple-500/10 text-purple-600 border-purple-500/30';
      case 'alert': return 'bg-destructive/10 text-destructive border-destructive/30';
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            Event Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="w-6 h-6 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const isEmpty = timelineEvents.length === 0;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-500" />
          Event Timeline
          {timelineEvents.length > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {timelineEvents.length} milestones
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Flag className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No milestones yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Add milestones to track your event progress
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div 
              className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" 
              aria-hidden="true"
            />

            <div className="space-y-4" role="list" aria-label="Event timeline">
              {timelineEvents.map((event) => (
                <div 
                  key={event.id} 
                  className="flex gap-4 relative"
                  role="listitem"
                >
                  {/* Icon */}
                  <div 
                    className="relative z-10 flex items-center justify-center w-6 h-6 rounded-full bg-background border border-border"
                    aria-hidden="true"
                  >
                    {getTypeIcon(event.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs text-muted-foreground font-mono">
                        {event.time}
                      </span>
                      {event.type === 'current' && (
                        <Badge variant="outline" className={`text-xs ${getTypeBadge(event.type)}`}>
                          Now
                        </Badge>
                      )}
                      {event.type === 'alert' && (
                        <Badge variant="outline" className={`text-xs ${getTypeBadge(event.type)}`}>
                          Overdue
                        </Badge>
                      )}
                    </div>
                    <h4 
                      className={`font-medium text-sm ${
                        event.type === 'completed' ? 'text-muted-foreground line-through' : ''
                      }`}
                    >
                      {event.title}
                    </h4>
                    {event.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
