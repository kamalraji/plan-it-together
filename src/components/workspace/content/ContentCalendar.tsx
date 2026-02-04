import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight, Plus, Loader2 } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ContentCalendarProps {
  workspaceId?: string;
}

export function ContentCalendar({ workspaceId }: ContentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Fetch scheduled content from database
  const { data: scheduledContent = [], isLoading } = useQuery({
    queryKey: ['workspace-scheduled-content', workspaceId, currentDate.toISOString()],
    queryFn: async () => {
      if (!workspaceId) return [];
      
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = addDays(weekStart, 7);
      
      const { data, error } = await supabase
        .from('workspace_scheduled_content')
        .select('*')
        .eq('workspace_id', workspaceId)
        .gte('scheduled_date', format(weekStart, 'yyyy-MM-dd'))
        .lt('scheduled_date', format(weekEnd, 'yyyy-MM-dd'))
        .order('scheduled_date', { ascending: true });
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        id: item.id,
        title: item.title,
        platform: item.platform || 'general',
        date: parseISO(item.scheduled_date),
        status: (item.status as 'draft' | 'scheduled' | 'published') || 'draft',
      }));
    },
    enabled: !!workspaceId,
  });

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      twitter: 'bg-sky-500',
      instagram: 'bg-pink-500',
      linkedin: 'bg-blue-600',
      facebook: 'bg-indigo-500',
      blog: 'bg-emerald-500',
      general: 'bg-muted-foreground',
    };
    return colors[platform.toLowerCase()] || 'bg-muted';
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Content Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

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
        
        {scheduledContent.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">No content scheduled for this week.</p>
            <p className="text-xs mt-1">Click &quot;Add&quot; on any day to schedule content.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
