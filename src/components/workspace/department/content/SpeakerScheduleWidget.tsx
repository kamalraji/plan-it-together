import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic2, Clock, MapPin, CheckCircle, AlertCircle } from 'lucide-react';

interface Speaker {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  sessionTitle: string;
  time: string;
  location: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

const mockSpeakers: Speaker[] = [
  {
    id: '1',
    name: 'Dr. Sarah Chen',
    role: 'Keynote Speaker',
    sessionTitle: 'The Future of AI in Events',
    time: '09:00 AM',
    location: 'Main Hall',
    status: 'confirmed',
  },
  {
    id: '2',
    name: 'James Rodriguez',
    role: 'Industry Expert',
    sessionTitle: 'Building Sustainable Communities',
    time: '10:30 AM',
    location: 'Conference Room A',
    status: 'confirmed',
  },
  {
    id: '3',
    name: 'Emily Watson',
    role: 'Panel Moderator',
    sessionTitle: 'Tech Innovation Panel',
    time: '02:00 PM',
    location: 'Main Hall',
    status: 'pending',
  },
  {
    id: '4',
    name: 'Michael Park',
    role: 'Workshop Lead',
    sessionTitle: 'Hands-on Design Workshop',
    time: '03:30 PM',
    location: 'Workshop Room 1',
    status: 'confirmed',
  },
];

const statusConfig = {
  confirmed: { label: 'Confirmed', icon: CheckCircle, className: 'bg-emerald-500/10 text-emerald-500' },
  pending: { label: 'Pending', icon: AlertCircle, className: 'bg-amber-500/10 text-amber-500' },
  cancelled: { label: 'Cancelled', icon: AlertCircle, className: 'bg-red-500/10 text-red-500' },
};

export function SpeakerScheduleWidget() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10">
              <Mic2 className="h-4 w-4 text-emerald-500" />
            </div>
            Speaker Schedule
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {mockSpeakers.filter(s => s.status === 'confirmed').length}/{mockSpeakers.length} confirmed
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-3">
          <div className="space-y-3">
            {mockSpeakers.map((speaker) => {
              const status = statusConfig[speaker.status];
              const StatusIcon = status.icon;

              return (
                <div
                  key={speaker.id}
                  className="p-3 rounded-lg border border-border bg-card/50 hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={speaker.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {speaker.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-medium text-sm text-foreground truncate">
                          {speaker.name}
                        </h4>
                        <Badge variant="outline" className={status.className}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{speaker.role}</p>
                      <p className="text-sm text-foreground mt-1 truncate">
                        {speaker.sessionTitle}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{speaker.time}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{speaker.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
