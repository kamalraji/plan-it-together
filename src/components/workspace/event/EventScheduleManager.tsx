import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Plus, ChevronRight, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useEventSessions, formatSessionTime, getSessionTypeFromTags } from '@/hooks/useEventScheduleData';

interface EventScheduleManagerProps {
  workspaceId?: string;
  eventId?: string;
}

export function EventScheduleManager({ eventId }: EventScheduleManagerProps) {
  const { sessions, isLoading, createSession } = useEventSessions(eventId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'in-progress': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'cancelled': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'upcoming':
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'keynote': return 'bg-purple-500/10 text-purple-600';
      case 'break': return 'bg-amber-500/10 text-amber-600';
      case 'networking': return 'bg-pink-500/10 text-pink-600';
      default: return 'bg-blue-500/10 text-blue-600';
    }
  };

  const handleAddItem = () => {
    if (!eventId) return;
    
    // Create a new session with default values
    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration
    
    createSession.mutate({
      event_id: eventId,
      title: 'New Session',
      description: null,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      location: null,
      room: null,
      status: 'upcoming',
      speaker_name: null,
      speaker_avatar: null,
      attendee_count: null,
      tags: null,
      is_published: false,
      track_id: null,
      stream_url: null,
    });
  };

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              Event Schedule
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const isEmpty = sessions.length === 0;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            Event Schedule
            {sessions.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {sessions.length} sessions
              </Badge>
            )}
          </CardTitle>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-8 gap-1"
            onClick={handleAddItem}
            disabled={!eventId || createSession.isPending}
          >
            {createSession.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Plus className="h-3 w-3" />
            )}
            Add Item
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No schedule items yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Add sessions, breaks, and activities to your event
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[320px] pr-3">
            <div className="space-y-2">
              {sessions.map((session) => {
                const sessionType = getSessionTypeFromTags(session.tags);
                
                return (
                  <div
                    key={session.id}
                    className={`p-3 rounded-lg border transition-all hover:bg-accent/50 cursor-pointer ${getStatusColor(session.status)}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`${session.title} at ${formatSessionTime(session.start_time)}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-medium">
                            {formatSessionTime(session.start_time)}
                          </span>
                          <Badge variant="outline" className={`text-xs ${getTypeColor(sessionType)}`}>
                            {sessionType}
                          </Badge>
                          {session.status === 'in-progress' && (
                            <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30 animate-pulse">
                              Live
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-medium text-sm truncate">{session.title}</h4>
                        {(session.location || session.room) && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {session.room || session.location}
                          </div>
                        )}
                        {session.speaker_name && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Speaker: {session.speaker_name}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
