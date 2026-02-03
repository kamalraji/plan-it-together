import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, DollarSign, FileText, Clock } from 'lucide-react';
import { useSponsorshipStats } from '@/hooks/useStatsData';

interface SponsorshipStatsCardsProps {
  workspaceId: string;
}

export function SponsorshipStatsCards({ workspaceId }: SponsorshipStatsCardsProps) {
  const { data, isLoading } = useSponsorshipStats(workspaceId);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount.toLocaleString()}`;
  };

  const stats = [
    {
      label: 'Active Sponsors',
      value: data?.totalSponsors?.toString() ?? '0',
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Total Revenue',
      value: data?.totalRevenue ? formatCurrency(data.totalRevenue) : '$0',
      icon: DollarSign,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'Pending Proposals',
      value: data?.pendingProposals?.toString() ?? '0',
      icon: FileText,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: 'Deliverables Due',
      value: data?.deliverablesDue?.toString() ?? '0',
      icon: Clock,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${stat.bgColor}`}>
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
