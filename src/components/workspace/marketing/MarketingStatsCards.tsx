import { Card, CardContent } from '@/components/ui/card';
import { Megaphone, Users, TrendingUp, DollarSign } from 'lucide-react';
import { useMarketingStats } from '@/hooks/useStatsData';
import { Skeleton } from '@/components/ui/skeleton';

interface MarketingStatsCardsProps {
  workspaceId: string;
}

export function MarketingStatsCards({ workspaceId }: MarketingStatsCardsProps) {
  const { data, isLoading } = useMarketingStats(workspaceId);

  const stats = [
    {
      label: 'Active Campaigns',
      value: data?.activeCampaigns?.toString() ?? '0',
      icon: Megaphone,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50 dark:bg-pink-500/10',
    },
    {
      label: 'Total Reach',
      value: data?.totalReach
        ? data.totalReach >= 1000000
          ? `${(data.totalReach / 1000000).toFixed(1)}M`
          : data.totalReach >= 1000
            ? `${(data.totalReach / 1000).toFixed(1)}K`
            : data.totalReach.toString()
        : '0',
      icon: Users,
      color: 'text-info',
      bgColor: 'bg-blue-50 dark:bg-blue-500/10',
    },
    {
      label: 'Conversion Rate',
      value: `${data?.conversionRate ?? 0}%`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-500/10',
    },
    {
      label: 'Ad Spend',
      value: `$${
        data?.adSpend
          ? data.adSpend >= 1000
            ? `${(data.adSpend / 1000).toFixed(1)}K`
            : data.adSpend
          : 0
      }`,
      icon: DollarSign,
      color: 'text-warning',
      bgColor: 'bg-amber-50 dark:bg-amber-500/10',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
