import { Card, CardContent } from '@/components/ui/card';
import { Server, ShieldCheck, TicketCheck, AlertOctagon } from 'lucide-react';

export function ITStatsCards() {
  const stats = [
    {
      label: 'Systems Online',
      value: 12,
      subtext: 'All systems operational',
      icon: Server,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Security Status',
      value: 'Secure',
      subtext: 'No threats detected',
      icon: ShieldCheck,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Open Tickets',
      value: 6,
      subtext: '2 awaiting response',
      icon: TicketCheck,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: 'Active Incidents',
      value: 1,
      subtext: 'In progress',
      icon: AlertOctagon,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
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
