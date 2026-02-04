import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  UserCheck, 
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Ticket
} from 'lucide-react';

interface RegistrationStatsCardsProps {
  workspaceId: string;
}

export function RegistrationStatsCards({ workspaceId: _workspaceId }: RegistrationStatsCardsProps) {
  // Mock data - would be replaced with real data from hooks
  const stats = {
    totalRegistered: 1250,
    checkedIn: 847,
    pending: 156,
    waitlisted: 48,
    cancelled: 23,
    capacityLimit: 1500,
    registrationTrend: 15,
    checkInRate: 67.8,
  };

  const availableSpots = stats.capacityLimit - stats.totalRegistered;

  const cards = [
    {
      title: 'Total Registered',
      value: stats.totalRegistered.toLocaleString(),
      subtitle: `${availableSpots} spots available`,
      icon: Users,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      trend: stats.registrationTrend,
      trendLabel: 'this week',
    },
    {
      title: 'Checked In',
      value: stats.checkedIn.toLocaleString(),
      subtitle: `${stats.checkInRate}% check-in rate`,
      icon: UserCheck,
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Pending Approval',
      value: stats.pending.toLocaleString(),
      subtitle: 'Awaiting review',
      icon: Clock,
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-600',
      alert: stats.pending > 100,
    },
    {
      title: 'Waitlisted',
      value: stats.waitlisted.toLocaleString(),
      subtitle: `${stats.cancelled} cancelled`,
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
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              )}
              {card.trend !== undefined && (
                <div className={`flex items-center gap-0.5 text-xs font-medium ${
                  card.trend >= 0 ? 'text-emerald-600' : 'text-destructive'
                }`}>
                  {card.trend >= 0 ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
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
