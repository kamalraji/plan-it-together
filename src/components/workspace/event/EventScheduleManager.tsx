import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Plus, ChevronRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EventScheduleManagerProps {
  workspaceId?: string;
}

interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  location: string;
  status: 'upcoming' | 'in-progress' | 'completed';
  type: 'session' | 'break' | 'keynote' | 'networking';
}

export function EventScheduleManager(_props: EventScheduleManagerProps) {
  // Mock schedule data
  const scheduleItems: ScheduleItem[] = [
    { id: '1', time: '08:00 AM', title: 'Registration Opens', location: 'Main Lobby', status: 'completed', type: 'session' },
    { id: '2', time: '09:00 AM', title: 'Opening Keynote', location: 'Main Hall', status: 'in-progress', type: 'keynote' },
    { id: '3', time: '10:30 AM', title: 'Coffee Break', location: 'Networking Area', status: 'upcoming', type: 'break' },
    { id: '4', time: '11:00 AM', title: 'Workshop Session A', location: 'Room 101', status: 'upcoming', type: 'session' },
    { id: '5', time: '12:30 PM', title: 'Lunch & Networking', location: 'Grand Ballroom', status: 'upcoming', type: 'networking' },
    { id: '6', time: '02:00 PM', title: 'Panel Discussion', location: 'Main Hall', status: 'upcoming', type: 'session' },
  ];

  const getStatusColor = (status: ScheduleItem['status']) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'in-progress': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'upcoming': return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getTypeColor = (type: ScheduleItem['type']) => {
    switch (type) {
      case 'keynote': return 'bg-purple-500/10 text-purple-600';
      case 'break': return 'bg-amber-500/10 text-amber-600';
      case 'networking': return 'bg-pink-500/10 text-pink-600';
      default: return 'bg-blue-500/10 text-blue-600';
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            Event Schedule
          </CardTitle>
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <Plus className="h-3 w-3" />
            Add Item
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[320px] pr-3">
          <div className="space-y-2">
            {scheduleItems.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-lg border transition-all hover:bg-accent/50 cursor-pointer ${getStatusColor(item.status)}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-medium">{item.time}</span>
                      <Badge variant="outline" className={`text-xs ${getTypeColor(item.type)}`}>
                        {item.type}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-sm truncate">{item.title}</h4>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {item.location}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
