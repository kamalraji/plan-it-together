import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, Target, Megaphone, Handshake } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  color: string;
}

function StatCard({ title, value, change, icon: Icon, color }: StatCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1">
                {change >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={`text-xs font-medium ${change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {change >= 0 ? '+' : ''}{change}%
                </span>
                <span className="text-xs text-muted-foreground">vs last month</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function GrowthStatsCards() {
  const stats = [
    {
      title: 'Total Reach',
      value: '2.4M',
      change: 18,
      icon: Megaphone,
      color: 'bg-blue-500',
    },
    {
      title: 'Audience Growth',
      value: '48.2K',
      change: 24,
      icon: Users,
      color: 'bg-emerald-500',
    },
    {
      title: 'Sponsorship Revenue',
      value: '$125K',
      change: 15,
      icon: Handshake,
      color: 'bg-amber-500',
    },
    {
      title: 'Engagement Rate',
      value: '6.8%',
      change: 12,
      icon: Target,
      color: 'bg-violet-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  );
}
