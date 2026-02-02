import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  
  FileText,
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  Globe,
  Mail,
} from 'lucide-react';
import { useScheduledContent, ScheduledContent } from '@/hooks/useContentCommitteeData';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from 'date-fns';
import { cn } from '@/lib/utils';

interface ContentCalendarTabProps {
  workspaceId: string;
}

const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  twitter: Twitter,
  linkedin: Linkedin,
  facebook: Facebook,
  instagram: Instagram,
  blog: FileText,
  website: Globe,
  email: Mail,
};

const PLATFORM_COLORS: Record<string, string> = {
  twitter: 'bg-sky-500',
  linkedin: 'bg-blue-600',
  facebook: 'bg-blue-500',
  instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
  blog: 'bg-emerald-500',
  website: 'bg-slate-500',
  email: 'bg-amber-500',
};

export function ContentCalendarTab({ workspaceId }: ContentCalendarTabProps) {
  const { data: scheduledContent = [], isLoading } = useScheduledContent(workspaceId);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const calendarDays = useMemo(() => 
    eachDayOfInterval({ start: calendarStart, end: calendarEnd }),
    [calendarStart, calendarEnd]
  );

  // Group scheduled content by date
  const contentByDate = useMemo(() => {
    return scheduledContent.reduce((acc, item) => {
      const dateKey = item.scheduled_date;
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(item);
      return acc;
    }, {} as Record<string, ScheduledContent[]>);
  }, [scheduledContent]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const getContentForDay = (day: Date): ScheduledContent[] => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return contentByDate[dateKey] || [];
  };

  const selectedDayContent = selectedDay ? getContentForDay(selectedDay) : [];

  const getPlatformIcon = (platform: string) => {
    const Icon = PLATFORM_ICONS[platform] || Globe;
    return <Icon className="h-3 w-3" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-cyan-500" />
            Content Calendar
          </h2>
          <p className="text-muted-foreground mt-1">
            View and manage scheduled content publications
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="text-lg font-semibold min-w-[180px] text-center">
                  {format(currentDate, 'MMMM yyyy')}
                </h3>
                <Button variant="outline" size="icon" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={handleToday}>
                Today
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <>
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div
                      key={day}
                      className="text-center text-sm font-medium text-muted-foreground py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day) => {
                    const dayContent = getContentForDay(day);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isSelected = selectedDay && isSameDay(day, selectedDay);

                    return (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          'min-h-[100px] p-2 rounded-lg border cursor-pointer transition-colors',
                          isCurrentMonth ? 'bg-background' : 'bg-muted/30',
                          isToday(day) && 'ring-2 ring-primary',
                          isSelected && 'border-primary bg-primary/5',
                          'hover:bg-muted/50'
                        )}
                        onClick={() => setSelectedDay(day)}
                      >
                        <div className={cn(
                          'text-sm font-medium mb-1',
                          !isCurrentMonth && 'text-muted-foreground',
                          isToday(day) && 'text-primary'
                        )}>
                          {format(day, 'd')}
                        </div>
                        <div className="space-y-1">
                          {dayContent.slice(0, 3).map((item) => (
                            <div
                              key={item.id}
                              className={cn(
                                'text-xs px-1.5 py-0.5 rounded truncate text-white flex items-center gap-1',
                                PLATFORM_COLORS[item.platform] || 'bg-slate-500'
                              )}
                              title={item.title}
                            >
                              {getPlatformIcon(item.platform)}
                              <span className="truncate">{item.title}</span>
                            </div>
                          ))}
                          {dayContent.length > 3 && (
                            <div className="text-xs text-muted-foreground px-1">
                              +{dayContent.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Sidebar - Selected Day Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDay ? format(selectedDay, 'EEEE, MMM d') : 'Select a Day'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDay ? (
              <p className="text-sm text-muted-foreground">
                Click on a day to see scheduled content
              </p>
            ) : selectedDayContent.length === 0 ? (
              <div className="text-center py-6">
                <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No content scheduled for this day
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayContent.map((item) => (
                  <Card key={item.id} className="bg-muted/30">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <div className={cn(
                          'p-1.5 rounded text-white',
                          PLATFORM_COLORS[item.platform] || 'bg-slate-500'
                        )}>
                          {getPlatformIcon(item.platform)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {item.platform}
                            {item.scheduled_time && ` • ${item.scheduled_time}`}
                          </p>
                          <Badge 
                            variant={item.status === 'published' ? 'default' : 'secondary'}
                            className="mt-1 text-xs"
                          >
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 justify-center">
            {Object.entries(PLATFORM_COLORS).map(([platform, color]) => {
              const Icon = PLATFORM_ICONS[platform] || Globe;
              return (
                <div key={platform} className="flex items-center gap-2">
                  <div className={cn('p-1 rounded text-white', color)}>
                    <Icon className="h-3 w-3" />
                  </div>
                  <span className="text-sm capitalize">{platform}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
