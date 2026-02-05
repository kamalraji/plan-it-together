import { Card } from '@/components/ui/card';
import { FileText, Gavel, Camera, Mic2 } from 'lucide-react';

interface ContentStatsCardsProps {
  contentItems?: number;
  judgeCount?: number;
  mediaAssets?: number;
  speakersConfirmed?: number;
}

export function ContentStatsCards({
  contentItems = 24,
  judgeCount = 8,
  mediaAssets = 156,
  speakersConfirmed = 12,
}: ContentStatsCardsProps) {
  const stats = [
    {
      label: 'Content Items',
      value: contentItems,
      icon: FileText,
      color: 'text-info',
      bgColor: 'bg-info/10',
      change: '+5 this week',
    },
    {
      label: 'Active Judges',
      value: judgeCount,
      icon: Gavel,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      change: 'All assigned',
    },
    {
      label: 'Media Assets',
      value: mediaAssets,
      icon: Camera,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      change: '+23 today',
    },
    {
      label: 'Speakers Confirmed',
      value: speakersConfirmed,
      icon: Mic2,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      change: '2 pending',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-4 bg-card border-border">
          <div className="flex items-start justify-between">
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
