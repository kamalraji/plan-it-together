import { Card, CardContent } from '@/components/ui/card';
import { Users, DollarSign, FileText, Clock } from 'lucide-react';

interface SponsorshipStatsCardsProps {
  totalSponsors: number;
  totalRevenue: number;
  pendingProposals: number;
  deliverablesDue: number;
}

export function SponsorshipStatsCards({
  totalSponsors,
  totalRevenue,
  pendingProposals,
  deliverablesDue,
}: SponsorshipStatsCardsProps) {
  const stats = [
    {
      label: 'Active Sponsors',
      value: totalSponsors,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'Pending Proposals',
      value: pendingProposals,
      icon: FileText,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: 'Deliverables Due',
      value: deliverablesDue,
      icon: Clock,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

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
