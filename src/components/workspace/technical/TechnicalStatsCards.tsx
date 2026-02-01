import { Card, CardContent } from '@/components/ui/card';
import { Monitor, Wifi, Headphones, AlertTriangle } from 'lucide-react';

export function TechnicalStatsCards() {
  const stats = [
    {
      label: 'AV Equipment',
      value: 24,
      subtext: '22 operational',
      icon: Monitor,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Network Status',
      value: '98.5%',
      subtext: 'Uptime today',
      icon: Wifi,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Support Tickets',
      value: 8,
      subtext: '3 high priority',
      icon: Headphones,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: 'Active Issues',
      value: 2,
      subtext: 'Requires attention',
      icon: AlertTriangle,
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
