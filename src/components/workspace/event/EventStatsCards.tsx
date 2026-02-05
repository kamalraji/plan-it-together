import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Users, Clock, MapPin } from 'lucide-react';
import { useEventStats } from '@/hooks/useStatsData';
import { Skeleton } from '@/components/ui/skeleton';

interface EventStatsCardsProps {
  workspaceId: string;
  eventId?: string;
}

export function EventStatsCards({ workspaceId, eventId }: EventStatsCardsProps) {
  const { data, isLoading } = useEventStats(workspaceId, eventId);

  const stats = [
    {
      label: 'Schedule Items',
      value: data?.scheduleItems ?? 0,
      icon: Calendar,
      change: data?.scheduleItems ? `${data.scheduleItems} total` : 'No items',
    },
    {
      label: 'VIP Guests',
      value: data?.vipGuests ?? 0,
      icon: Users,
      change: data?.vipGuests ? 'Confirmed' : 'None yet',
    },
    {
      label: 'Hours to Event',
      value: data?.hoursToEvent ?? 0,
      icon: Clock,
      change: data?.hoursToEvent && data.hoursToEvent > 0 ? 'Countdown' : 'Event passed',
    },
    {
      label: 'Venue Zones',
      value: data?.venueZones ?? 0,
      icon: MapPin,
      change: data?.venueZones ? 'Configured' : 'Not set',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-10" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <stat.icon className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xs text-info">{stat.change}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
