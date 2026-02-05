import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarDays, Clock, MapPin, Users, CheckCircle2 } from 'lucide-react';

interface EventBriefingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ScheduleItem {
  time: string;
  activity: string;
  location: string;
  lead: string;
  status: 'completed' | 'in-progress' | 'upcoming';
}

export function EventBriefingModal({ open, onOpenChange }: EventBriefingModalProps) {
  const [schedule] = useState<ScheduleItem[]>([
    { time: '07:00', activity: 'Venue Setup Begin', location: 'Main Hall', lead: 'John D.', status: 'completed' },
    { time: '08:00', activity: 'AV Equipment Check', location: 'Stage Area', lead: 'Sarah M.', status: 'completed' },
    { time: '09:00', activity: 'Catering Arrival', location: 'Kitchen', lead: 'Mike R.', status: 'in-progress' },
    { time: '10:00', activity: 'Registration Opens', location: 'Lobby', lead: 'Lisa K.', status: 'upcoming' },
    { time: '10:30', activity: 'Welcome Session', location: 'Main Hall', lead: 'David P.', status: 'upcoming' },
    { time: '12:00', activity: 'Lunch Break', location: 'Dining Area', lead: 'Mike R.', status: 'upcoming' },
    { time: '14:00', activity: 'Keynote Speech', location: 'Main Hall', lead: 'David P.', status: 'upcoming' },
    { time: '16:00', activity: 'Networking Session', location: 'Lounge', lead: 'Lisa K.', status: 'upcoming' },
  ]);

  const getStatusBadge = (status: ScheduleItem['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="bg-success/10 text-success">Completed</Badge>;
      case 'in-progress':
        return <Badge variant="secondary" className="bg-warning/10 text-warning">In Progress</Badge>;
      case 'upcoming':
        return <Badge variant="secondary" className="bg-info/10 text-info">Upcoming</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-info" />
            Event Briefing - Day-of Schedule
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 py-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="text-sm font-medium">07:00 - 18:00</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Venue</p>
              <p className="text-sm font-medium">Convention Center</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Expected</p>
              <p className="text-sm font-medium">250 Guests</p>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-2">
            {schedule.map((item, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  item.status === 'in-progress' ? 'border-warning/50 bg-warning/5' : 'border-border'
                }`}
              >
                <div className="flex items-center gap-4">
                  {item.status === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{item.time}</span>
                      <span className="text-sm">{item.activity}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground">{item.location}</span>
                      <span className="text-xs text-muted-foreground">• Lead: {item.lead}</span>
                    </div>
                  </div>
                </div>
                {getStatusBadge(item.status)}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
