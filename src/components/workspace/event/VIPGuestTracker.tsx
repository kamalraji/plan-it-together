import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Crown, Plus, Check, Clock, Plane } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface VIPGuestTrackerProps {
  workspaceId?: string;
}

interface VIPGuest {
  id: string;
  name: string;
  title: string;
  company: string;
  status: 'confirmed' | 'pending' | 'arrived' | 'traveling';
  notes?: string;
}

export function VIPGuestTracker(_props: VIPGuestTrackerProps) {
  const vipGuests: VIPGuest[] = [
    { id: '1', name: 'Sarah Chen', title: 'CEO', company: 'TechCorp', status: 'arrived', notes: 'Dietary: Vegetarian' },
    { id: '2', name: 'Michael Roberts', title: 'CTO', company: 'InnovateCo', status: 'traveling', notes: 'ETA 2:30 PM' },
    { id: '3', name: 'Emma Wilson', title: 'Director', company: 'StartupX', status: 'confirmed', notes: 'VIP Seating Row 1' },
    { id: '4', name: 'David Lee', title: 'Investor', company: 'Venture Fund', status: 'pending', notes: 'Needs parking pass' },
    { id: '5', name: 'Anna Martinez', title: 'Speaker', company: 'Global Inc', status: 'confirmed', notes: 'Keynote 2PM' },
  ];

  const getStatusIcon = (status: VIPGuest['status']) => {
    switch (status) {
      case 'arrived': return <Check className="h-3 w-3" />;
      case 'traveling': return <Plane className="h-3 w-3" />;
      case 'confirmed': return <Check className="h-3 w-3" />;
      case 'pending': return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusStyle = (status: VIPGuest['status']) => {
    switch (status) {
      case 'arrived': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
      case 'traveling': return 'bg-info/10 text-info border-info/30';
      case 'confirmed': return 'bg-primary/10 text-primary border-purple-500/30';
      case 'pending': return 'bg-warning/10 text-warning border-warning/30';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Crown className="h-4 w-4 text-warning" />
            VIP Guests
          </CardTitle>
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <Plus className="h-3 w-3" />
            Add VIP
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[280px] pr-3">
          <div className="space-y-3">
            {vipGuests.map((guest) => (
              <div
                key={guest.id}
                className="p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 border-2 border-warning/30">
                    <AvatarFallback className="bg-warning/10 text-warning text-sm font-medium">
                      {getInitials(guest.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-medium text-sm truncate">{guest.name}</h4>
                      <Badge variant="outline" className={`text-xs gap-1 ${getStatusStyle(guest.status)}`}>
                        {getStatusIcon(guest.status)}
                        {guest.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {guest.title} @ {guest.company}
                    </p>
                    {guest.notes && (
                      <p className="text-xs text-info mt-1 truncate">
                        📌 {guest.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
