import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, Target, Megaphone, Handshake } from 'lucide-react';
import { useGrowthStats } from '@/hooks/useStatsData';
import { Skeleton } from '@/components/ui/skeleton';

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

interface GrowthStatsCardsProps {
  workspaceId?: string;
}

export function GrowthStatsCards({ workspaceId }: GrowthStatsCardsProps) {
  const { data, isLoading } = useGrowthStats(workspaceId || '');

  const formatValue = (value: number, prefix = '', suffix = '') => {
    if (value >= 1000000) return `${prefix}${(value / 1000000).toFixed(1)}M${suffix}`;
    if (value >= 1000) return `${prefix}${(value / 1000).toFixed(1)}K${suffix}`;
    return `${prefix}${value}${suffix}`;
  };

  const stats = [
    {
      title: 'Total Reach',
      value: formatValue(data?.totalReach ?? 0),
      change: 18,
      icon: Megaphone,
      color: 'bg-blue-500',
    },
    {
      title: 'Audience Growth',
      value: formatValue(data?.audienceGrowth ?? 0),
      change: 24,
      icon: Users,
      color: 'bg-emerald-500',
    },
    {
      title: 'Sponsorship Revenue',
      value: formatValue(data?.sponsorshipRevenue ?? 0, '$'),
      change: 15,
      icon: Handshake,
      color: 'bg-amber-500',
    },
    {
      title: 'Engagement Rate',
      value: `${data?.engagementRate ?? 0}%`,
      change: 12,
      icon: Target,
      color: 'bg-violet-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-7 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-11 w-11 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  );
}
