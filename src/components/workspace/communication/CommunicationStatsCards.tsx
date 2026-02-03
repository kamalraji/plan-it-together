import { Card, CardContent } from '@/components/ui/card';
import { Megaphone, Mail, BarChart3, Clock } from 'lucide-react';

interface CommunicationStatsCardsProps {
  totalAnnouncements: number;
  emailsSent: number;
  openRate: number;
  pendingApprovals: number;
}

export function CommunicationStatsCards({
  totalAnnouncements,
  emailsSent,
  openRate,
  pendingApprovals,
}: CommunicationStatsCardsProps) {
  const stats = [
    {
      label: 'Announcements',
      value: totalAnnouncements,
      icon: Megaphone,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Emails Sent',
      value: emailsSent.toLocaleString(),
      icon: Mail,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'Open Rate',
      value: `${openRate}%`,
      icon: BarChart3,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Pending Approvals',
      value: pendingApprovals,
      icon: Clock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
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
