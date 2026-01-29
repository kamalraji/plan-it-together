import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  UserCheck, 
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Ticket
} from 'lucide-react';
import { useRegistrationStats, useEventIdFromWorkspace } from '@/hooks/useRegistrationData';

interface RegistrationStatsCardsProps {
  workspaceId: string;
}

export function RegistrationStatsCards({ workspaceId }: RegistrationStatsCardsProps) {
  const { data: eventId } = useEventIdFromWorkspace(workspaceId);
  const { data: stats, isLoading } = useRegistrationStats(eventId || null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-4 w-12" />
              </div>
              <div className="mt-3">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-24 mt-2" />
              </div>
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const safeStats = stats || {
    totalRegistered: 0,
    checkedIn: 0,
    pending: 0,
    waitlisted: 0,
    cancelled: 0,
    capacityLimit: 0,
    registrationTrend: 0,
    checkInRate: 0,
    availableSpots: 0,
  };

  const cards = [
    {
      title: 'Total Registered',
      value: safeStats.totalRegistered.toLocaleString(),
      subtitle: `${safeStats.availableSpots} spots available`,
      icon: Users,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      trend: safeStats.registrationTrend,
      trendLabel: 'this week',
    },
    {
      title: 'Checked In',
      value: safeStats.checkedIn.toLocaleString(),
      subtitle: `${safeStats.checkInRate}% check-in rate`,
      icon: UserCheck,
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Pending Approval',
      value: safeStats.pending.toLocaleString(),
      subtitle: 'Awaiting review',
      icon: Clock,
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-600',
      alert: safeStats.pending > 100,
    },
    {
      title: 'Waitlisted',
      value: safeStats.waitlisted.toLocaleString(),
      subtitle: `${safeStats.cancelled} cancelled`,
      icon: Ticket,
      iconBg: 'bg-violet-500/10',
      iconColor: 'text-violet-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card 
          key={index} 
          className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all"
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className={`p-2 rounded-lg ${card.iconBg}`}>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              {card.alert && (
                <AlertTriangle className="w-4 h-4 text-amber-500" aria-label="Alert: high pending count" />
              )}
              {card.trend !== undefined && (
                <div 
                  className={`flex items-center gap-0.5 text-xs font-medium ${
                    card.trend >= 0 ? 'text-emerald-600' : 'text-destructive'
                  }`}
                  aria-label={`${card.trend >= 0 ? 'Up' : 'Down'} ${Math.abs(card.trend)}%`}
                >
                  {card.trend >= 0 ? (
                    <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" aria-hidden="true" />
                  )}
                  {Math.abs(card.trend)}%
                </div>
              )}
            </div>
            
            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.title}</p>
            </div>
            
            <p className="text-xs text-muted-foreground mt-2">
              {card.subtitle}
              {card.trendLabel && (
                <span className="text-muted-foreground/70"> · {card.trendLabel}</span>
              )}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
