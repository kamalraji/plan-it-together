import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { 
  useSpeakerSessions, 
  useSpeakerLiaisonSpeakers,
  SpeakerSession 
} from '@/hooks/useSpeakerLiaisonData';
import { ScheduleSessionDialog } from '../../../speaker-liaison/ScheduleSessionDialog';

interface SessionScheduleTabProps {
  workspaceId: string;
}

export function SessionScheduleTab({ workspaceId }: SessionScheduleTabProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SpeakerSession | null>(null);

  const { data: sessions = [], isLoading } = useSpeakerSessions(workspaceId);
  const { data: speakers = [] } = useSpeakerLiaisonSpeakers(workspaceId);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getTypeColor = (type: string | null) => {
    const colors: Record<string, string> = {
      keynote: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      workshop: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      panel: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      breakout: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      fireside: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    };
    return colors[type || 'breakout'] || 'bg-muted text-muted-foreground';
  };

  const getSessionsForDay = (day: Date) => {
    return sessions.filter(session => {
      if (!session.scheduled_date) return false;
      try {
        return isSameDay(parseISO(session.scheduled_date), day);
      } catch {
        return false;
      }
    });
  };

  const handleSessionClick = (session: SpeakerSession) => {
    setSelectedSession(session);
    setShowScheduleDialog(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground mt-2">Loading sessions...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Session Schedule
              <Badge variant="secondary" className="ml-2">{sessions.length} sessions</Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentDate(addDays(currentDate, -7))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[140px] text-center">
                {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentDate(addDays(currentDate, 7))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button 
                onClick={() => {
                  setSelectedSession(null);
                  setShowScheduleDialog(true);
                }} 
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Session
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const daySessions = getSessionsForDay(day);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[180px] p-2 rounded-lg border ${
                    isToday ? 'border-primary bg-primary/5' : 'border-border/50'
                  }`}
                >
                  <div className={`text-xs font-medium mb-2 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                    {format(day, 'EEE d')}
                  </div>
                  <div className="space-y-1.5">
                    {daySessions.map((session) => (
                      <div
                        key={session.id}
                        onClick={() => handleSessionClick(session)}
                        className={`p-2 rounded border ${getTypeColor(session.session_type)} cursor-pointer hover:opacity-80 transition-opacity`}
                      >
                        <p className="text-xs font-medium truncate">{session.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {session.speaker?.name || 'TBD'}
                        </p>
                        {session.start_time && (
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                            <Clock className="h-2.5 w-2.5" />
                            {session.start_time}
                          </div>
                        )}
                        {session.room && (
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                            📍 {session.room}
                          </p>
                        )}
                      </div>
                    ))}
                    {daySessions.length === 0 && (
                      <div className="text-xs text-muted-foreground text-center py-4">
                        No sessions
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-border/50">
            <span className="text-xs text-muted-foreground">Types:</span>
            {['keynote', 'workshop', 'panel', 'breakout', 'fireside'].map((type) => (
              <Badge key={type} className={`${getTypeColor(type)} text-[10px] capitalize`}>
                {type}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <ScheduleSessionDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        workspaceId={workspaceId}
        speakers={speakers}
        session={selectedSession}
      />
    </div>
  );
}
