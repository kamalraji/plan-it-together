import { Card, CardContent } from '@/components/ui/card';
import { Server, ShieldCheck, TicketCheck, AlertOctagon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ITStatsCardsProps {
  stats?: {
    systemsOnline: number;
    totalSystems: number;
    openTickets: number;
    pendingTickets: number;
    activeAlerts: number;
  };
  isLoading?: boolean;
}

export function ITStatsCards({ stats, isLoading }: ITStatsCardsProps) {
  const displayStats = [
    {
      label: 'Systems Online',
      value: stats ? `${stats.systemsOnline}/${stats.totalSystems}` : '—',
      subtext: stats?.systemsOnline === stats?.totalSystems ? 'All systems operational' : 'Some systems need attention',
      icon: Server,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Security Status',
      value: stats?.activeAlerts === 0 ? 'Secure' : `${stats?.activeAlerts} Alert${(stats?.activeAlerts || 0) > 1 ? 's' : ''}`,
      subtext: stats?.activeAlerts === 0 ? 'No threats detected' : 'Attention required',
      icon: ShieldCheck,
      color: stats?.activeAlerts === 0 ? 'text-primary' : 'text-warning',
      bgColor: stats?.activeAlerts === 0 ? 'bg-primary/10' : 'bg-warning/10',
    },
    {
      label: 'Open Tickets',
      value: stats?.openTickets ?? '—',
      subtext: stats?.pendingTickets ? `${stats.pendingTickets} awaiting response` : 'No pending tickets',
      icon: TicketCheck,
      color: (stats?.openTickets || 0) > 5 ? 'text-warning' : 'text-primary',
      bgColor: (stats?.openTickets || 0) > 5 ? 'bg-warning/10' : 'bg-primary/10',
    },
    {
      label: 'Active Incidents',
      value: stats?.activeAlerts ?? 0,
      subtext: stats?.activeAlerts ? 'In progress' : 'No active incidents',
      icon: AlertOctagon,
      color: (stats?.activeAlerts || 0) > 0 ? 'text-destructive' : 'text-success',
      bgColor: (stats?.activeAlerts || 0) > 0 ? 'bg-destructive/10' : 'bg-success/10',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-9 w-9 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {displayStats.map((stat) => (
        <Card key={stat.label} className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
              </div>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
