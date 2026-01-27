import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, Camera, Video, MapPin, Clock } from 'lucide-react';

interface CoverageSlot {
  id: string;
  event: string;
  location: string;
  startTime: string;
  endTime: string;
  type: 'photo' | 'video' | 'both';
  assignedCrew: string[];
  priority: 'high' | 'medium' | 'low';
}

export function CoverageSchedule() {
  const schedule: CoverageSlot[] = [
    {
      id: '1',
      event: 'Opening Ceremony',
      location: 'Main Auditorium',
      startTime: '09:00',
      endTime: '10:30',
      type: 'both',
      assignedCrew: ['Arjun M.', 'Priya N.'],
      priority: 'high',
    },
    {
      id: '2',
      event: 'Keynote Speech',
      location: 'Hall A',
      startTime: '11:00',
      endTime: '12:00',
      type: 'both',
      assignedCrew: ['Arjun M.', 'Priya N.', 'Rahul S.'],
      priority: 'high',
    },
    {
      id: '3',
      event: 'Panel Discussion',
      location: 'Conference Room 1',
      startTime: '14:00',
      endTime: '15:30',
      type: 'photo',
      assignedCrew: ['Sneha P.'],
      priority: 'medium',
    },
    {
      id: '4',
      event: 'Networking Session',
      location: 'Lobby Area',
      startTime: '16:00',
      endTime: '17:00',
      type: 'photo',
      assignedCrew: ['Arjun M.'],
      priority: 'low',
    },
    {
      id: '5',
      event: 'Award Ceremony',
      location: 'Main Auditorium',
      startTime: '18:00',
      endTime: '19:30',
      type: 'both',
      assignedCrew: ['Arjun M.', 'Priya N.', 'Sneha P.'],
      priority: 'high',
    },
  ];

  const getTypeIcon = (type: CoverageSlot['type']) => {
    switch (type) {
      case 'photo':
        return <Camera className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'both':
        return (
          <div className="flex items-center gap-1">
            <Camera className="h-3 w-3" />
            <Video className="h-3 w-3" />
          </div>
        );
    }
  };

  const getPriorityColor = (priority: CoverageSlot['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low':
        return 'bg-muted text-foreground border-border';
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-primary" />
          Coverage Schedule
        </CardTitle>
        <Button size="sm" variant="outline" className="gap-1">
          <Plus className="h-4 w-4" />
          Add Slot
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {schedule.map((slot) => (
          <div 
            key={slot.id}
            className={`p-3 rounded-lg border-l-4 bg-muted/30 ${getPriorityColor(slot.priority)}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium text-foreground">{slot.event}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {slot.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {slot.startTime} - {slot.endTime}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getTypeIcon(slot.type)}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {slot.assignedCrew.map((crew) => (
                  <Badge key={crew} variant="outline" className="text-xs">
                    {crew}
                  </Badge>
                ))}
              </div>
              <Badge variant="secondary" className={getPriorityColor(slot.priority)}>
                {slot.priority}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
