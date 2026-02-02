import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';

interface ScheduledContent {
  id: string;
  title: string;
  platform: 'twitter' | 'instagram' | 'linkedin' | 'facebook' | 'blog';
  date: Date;
  status: 'draft' | 'scheduled' | 'published';
}

export function ContentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Mock scheduled content
  const scheduledContent: ScheduledContent[] = [
    { id: '1', title: 'Event Announcement', platform: 'twitter', date: new Date(), status: 'scheduled' },
    { id: '2', title: 'Speaker Spotlight', platform: 'instagram', date: addDays(new Date(), 1), status: 'draft' },
    { id: '3', title: 'Registration Reminder', platform: 'linkedin', date: addDays(new Date(), 2), status: 'scheduled' },
    { id: '4', title: 'Behind the Scenes', platform: 'facebook', date: addDays(new Date(), 3), status: 'draft' },
    { id: '5', title: 'Event Guide Blog', platform: 'blog', date: addDays(new Date(), 4), status: 'scheduled' },
  ];

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      twitter: 'bg-sky-500',
      instagram: 'bg-pink-500',
      linkedin: 'bg-blue-600',
      facebook: 'bg-indigo-500',
      blog: 'bg-emerald-500',
    };
    return colors[platform] || 'bg-muted';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      draft: 'outline',
      scheduled: 'secondary',
      published: 'default',
    };
    return variants[status] || 'outline';
  };

  const getContentForDay = (day: Date) => {
    return scheduledContent.filter(content => isSameDay(content.date, day));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Content Calendar
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
            const dayContent = getContentForDay(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div
                key={day.toISOString()}
                className={`min-h-[120px] p-2 rounded-lg border ${
                  isToday ? 'border-primary bg-primary/5' : 'border-border/50'
                }`}
              >
                <div className={`text-xs font-medium mb-2 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                  {format(day, 'EEE d')}
                </div>
                <div className="space-y-1">
                  {dayContent.map((content) => (
                    <div
                      key={content.id}
                      className="p-1.5 rounded bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <div className={`w-2 h-2 rounded-full ${getPlatformColor(content.platform)}`} />
                        <span className="text-[10px] capitalize text-muted-foreground">
                          {content.platform}
                        </span>
                      </div>
                      <p className="text-xs font-medium truncate">{content.title}</p>
                      <Badge variant={getStatusBadge(content.status)} className="text-[10px] h-4 mt-1">
                        {content.status}
                      </Badge>
                    </div>
                  ))}
                  {dayContent.length === 0 && (
                    <Button variant="ghost" size="sm" className="w-full h-8 text-xs text-muted-foreground">
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
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
