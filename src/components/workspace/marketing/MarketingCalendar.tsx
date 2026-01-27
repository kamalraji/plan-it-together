import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from 'date-fns';

interface MarketingEvent {
  id: string;
  title: string;
  date: string;
  type: 'campaign' | 'content' | 'email' | 'social' | 'deadline';
}

const mockEvents: MarketingEvent[] = [
  { id: '1', title: 'Early Bird Campaign Ends', date: '2025-01-15', type: 'deadline' },
  { id: '2', title: 'Newsletter Send', date: '2025-01-10', type: 'email' },
  { id: '3', title: 'Speaker Reveal Post', date: '2025-01-08', type: 'social' },
  { id: '4', title: 'Blog: Event Preview', date: '2025-01-12', type: 'content' },
  { id: '5', title: 'Paid Campaign Launch', date: '2025-01-05', type: 'campaign' },
  { id: '6', title: 'Influencer Collab Post', date: '2025-01-18', type: 'social' },
];

const typeColors: Record<MarketingEvent['type'], string> = {
  campaign: 'bg-pink-500',
  content: 'bg-blue-500',
  email: 'bg-emerald-500',
  social: 'bg-purple-500',
  deadline: 'bg-red-500',
};

export function MarketingCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get day of week for first day (0 = Sunday)
  const startDay = monthStart.getDay();

  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return mockEvents.filter((e) => e.date === dateStr);
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-600" />
          <CardTitle className="text-lg font-semibold">Marketing Calendar</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium text-sm min-w-[140px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-pink-500" />
            <span className="text-muted-foreground">Campaign</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Content</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Email</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-muted-foreground">Social</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-muted-foreground">Deadline</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Header */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}

          {/* Empty cells for days before month starts */}
          {Array.from({ length: startDay }).map((_, index) => (
            <div key={`empty-${index}`} className="h-20" />
          ))}

          {/* Day cells */}
          {days.map((day) => {
            const events = getEventsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isTodayDate = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`h-20 p-1 border border-border/30 rounded-md ${
                  !isCurrentMonth ? 'opacity-30' : ''
                } ${isTodayDate ? 'bg-primary/5 border-primary/30' : 'bg-card'}`}
              >
                <div
                  className={`text-xs font-medium mb-1 ${
                    isTodayDate ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  {format(day, 'd')}
                </div>
                <div className="space-y-0.5 overflow-hidden">
                  {events.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className={`text-[10px] px-1 py-0.5 rounded truncate text-white ${typeColors[event.type]}`}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  {events.length > 2 && (
                    <div className="text-[10px] text-muted-foreground px-1">
                      +{events.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
