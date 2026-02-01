import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Users, Clock, MapPin } from 'lucide-react';

interface EventStatsCardsProps {
  workspaceId?: string;
}

export function EventStatsCards(_props: EventStatsCardsProps) {
  // Mock data - would be connected to real data
  const stats = [
    { label: 'Schedule Items', value: 24, icon: Calendar, change: '+3 today' },
    { label: 'VIP Guests', value: 12, icon: Users, change: 'All confirmed' },
    { label: 'Hours to Event', value: 72, icon: Clock, change: 'On track' },
    { label: 'Venue Zones', value: 8, icon: MapPin, change: '6 ready' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <stat.icon className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xs text-blue-500">{stat.change}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
