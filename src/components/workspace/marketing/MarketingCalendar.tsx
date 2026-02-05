import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, isSameDay, parseISO } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MarketingEvent {
  id: string;
  title: string;
  date: Date;
  type: 'campaign' | 'content' | 'email' | 'social' | 'deadline' | 'task';
}

interface MarketingCalendarProps {
  workspaceId?: string;
}

const typeColors: Record<MarketingEvent['type'], string> = {
  campaign: 'bg-pink-500',
  content: 'bg-info',
  email: 'bg-emerald-500',
  social: 'bg-primary',
  deadline: 'bg-destructive',
  task: 'bg-orange-500',
};

export function MarketingCalendar({ workspaceId }: MarketingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fetch workspace tasks as calendar events
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['marketing-calendar-tasks', workspaceId, format(currentMonth, 'yyyy-MM')],
    queryFn: async () => {
      if (!workspaceId) return [];
      
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      
      const { data, error } = await supabase
        .from('workspace_tasks')
        .select('id, title, due_date, priority, status')
        .eq('workspace_id', workspaceId)
        .gte('due_date', monthStart.toISOString())
        .lte('due_date', monthEnd.toISOString())
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return (data || []).filter(t => t.due_date !== null);
    },
    enabled: !!workspaceId,
  });

  // Convert tasks to calendar events
  const events: MarketingEvent[] = tasks
    .filter(task => task.due_date)
    .map(task => {
      let type: MarketingEvent['type'] = 'task';
      const titleLower = task.title.toLowerCase();
      
      // Determine type based on title keywords
      if (titleLower.includes('campaign') || titleLower.includes('ad ') || titleLower.includes('ads')) {
        type = 'campaign';
      } else if (titleLower.includes('content') || titleLower.includes('blog') || titleLower.includes('article')) {
        type = 'content';
      } else if (titleLower.includes('email') || titleLower.includes('newsletter')) {
        type = 'email';
      } else if (titleLower.includes('social') || titleLower.includes('post') || titleLower.includes('twitter') || titleLower.includes('instagram')) {
        type = 'social';
      } else if (task.priority === 'URGENT' || titleLower.includes('deadline')) {
        type = 'deadline';
      }
      
      return {
        id: task.id,
        title: task.title,
        date: parseISO(task.due_date!),
        type,
      };
    });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get day of week for first day (0 = Sunday)
  const startDay = monthStart.getDay();

  const getEventsForDate = (date: Date) => {
    return events.filter((e) => isSameDay(e.date, date));
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-semibold">Marketing Calendar</CardTitle>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
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
            <div className="w-3 h-3 rounded-full bg-info" />
            <span className="text-muted-foreground">Content</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Email</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Social</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span className="text-muted-foreground">Deadline</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-muted-foreground">Task</span>
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
            const dayEvents = getEventsForDate(day);
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
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className={`text-[10px] px-1 py-0.5 rounded truncate text-primary-foreground ${typeColors[event.type]}`}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[10px] text-muted-foreground px-1">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {!isLoading && events.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No marketing tasks scheduled this month</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
