import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Flag, AlertCircle, CheckCircle2 } from 'lucide-react';

interface EventTimelineProps {
  workspaceId?: string;
}

interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  type: 'milestone' | 'alert' | 'completed' | 'current';
  description?: string;
}

export function EventTimeline(_props: EventTimelineProps) {
  const timelineEvents: TimelineEvent[] = [
    { id: '1', time: '1 week ago', title: 'Venue Contract Signed', type: 'completed' },
    { id: '2', time: '3 days ago', title: 'Final Headcount Confirmed', type: 'completed' },
    { id: '3', time: 'Yesterday', title: 'AV Equipment Delivered', type: 'completed' },
    { id: '4', time: 'Today', title: 'Staff Briefing', type: 'current', description: 'In progress' },
    { id: '5', time: 'Tomorrow', title: 'Event Day', type: 'milestone', description: 'Main event' },
    { id: '6', time: 'In 3 days', title: 'Post-Event Debrief', type: 'milestone' },
  ];

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

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-500" />
          Event Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />

          <div className="space-y-4">
            {timelineEvents.map((event) => (
              <div key={event.id} className="flex gap-4 relative">
                {/* Icon */}
                <div className="relative z-10 flex items-center justify-center w-6 h-6 rounded-full bg-background border border-border">
                  {getTypeIcon(event.type)}
                </div>

                {/* Content */}
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground font-mono">{event.time}</span>
                    {event.type === 'current' && (
                      <Badge variant="outline" className={`text-xs ${getTypeBadge(event.type)}`}>
                        Now
                      </Badge>
                    )}
                  </div>
                  <h4 className={`font-medium text-sm ${event.type === 'completed' ? 'text-muted-foreground' : ''}`}>
                    {event.title}
                  </h4>
                  {event.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
