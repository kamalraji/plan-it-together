import { Card, CardContent } from '@/components/ui/card';
import { Megaphone, Users, TrendingUp, DollarSign } from 'lucide-react';

interface MarketingStatsCardsProps {
  activeCampaigns: number;
  totalReach: number;
  conversionRate: number;
  adSpend: number;
}

export function MarketingStatsCards({
  activeCampaigns,
  totalReach,
  conversionRate,
  adSpend,
}: MarketingStatsCardsProps) {
  const stats = [
    {
      label: 'Active Campaigns',
      value: activeCampaigns.toString(),
      icon: Megaphone,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
    {
      label: 'Total Reach',
      value: totalReach >= 1000 ? `${(totalReach / 1000).toFixed(1)}K` : totalReach.toString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Conversion Rate',
      value: `${conversionRate}%`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'Ad Spend',
      value: `$${adSpend >= 1000 ? `${(adSpend / 1000).toFixed(1)}K` : adSpend}`,
      icon: DollarSign,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
  ];

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
