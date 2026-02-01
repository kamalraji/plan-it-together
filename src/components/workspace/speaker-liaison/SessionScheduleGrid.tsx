import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';

interface Session {
  id: string;
  title: string;
  speaker: string;
  time: string;
  duration: string;
  room: string;
  type: 'keynote' | 'workshop' | 'panel' | 'breakout';
  date: Date;
}

export function SessionScheduleGrid() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const sessions: Session[] = [
    { id: '1', title: 'Opening Keynote', speaker: 'Dr. Sarah Chen', time: '9:00 AM', duration: '1h', room: 'Main Hall', type: 'keynote', date: new Date() },
    { id: '2', title: 'AI Workshop', speaker: 'James Wilson', time: '11:00 AM', duration: '2h', room: 'Room A', type: 'workshop', date: new Date() },
    { id: '3', title: 'Tech Panel', speaker: 'Multiple', time: '2:00 PM', duration: '1.5h', room: 'Main Hall', type: 'panel', date: new Date() },
    { id: '4', title: 'Leadership Talk', speaker: 'Maria Garcia', time: '10:00 AM', duration: '45m', room: 'Room B', type: 'breakout', date: addDays(new Date(), 1) },
    { id: '5', title: 'Closing Keynote', speaker: 'Prof. Robert Kim', time: '4:00 PM', duration: '1h', room: 'Main Hall', type: 'keynote', date: addDays(new Date(), 1) },
  ];

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      keynote: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      workshop: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      panel: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      breakout: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    };
    return colors[type] || 'bg-muted';
  };

  const getSessionsForDay = (day: Date) => {
    return sessions.filter(session => isSameDay(session.date, day));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Session Schedule
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentDate(addDays(currentDate, -7))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d')}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentDate(addDays(currentDate, 7))}
            >
              <ChevronRight className="h-4 w-4" />
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
                className={`min-h-[140px] p-2 rounded-lg border ${
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
                      className={`p-2 rounded border ${getTypeColor(session.type)} cursor-pointer hover:opacity-80 transition-opacity`}
                    >
                      <p className="text-xs font-medium truncate">{session.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{session.speaker}</p>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                        <Clock className="h-2.5 w-2.5" />
                        {session.time}
                      </div>
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
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/50">
          <span className="text-xs text-muted-foreground">Types:</span>
          {['keynote', 'workshop', 'panel', 'breakout'].map((type) => (
            <Badge key={type} className={`${getTypeColor(type)} text-[10px] capitalize`}>
              {type}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
