import { Card } from '@/components/ui/card';
import { FileText, Gavel, Camera, Mic2 } from 'lucide-react';
import { useContentDepartmentStats } from '@/hooks/useContentDepartmentData';

interface ContentStatsConnectedProps {
  workspaceId: string;
}

export function ContentStatsConnected({ workspaceId }: ContentStatsConnectedProps) {
  const stats = useContentDepartmentStats(workspaceId);

  const statsConfig = [
    {
      label: 'Content Items',
      value: stats.contentCount,
      icon: FileText,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      change: stats.contentCount > 0 ? `${stats.contentCount} total` : 'No items yet',
    },
    {
      label: 'Active Judges',
      value: stats.judgeCount,
      icon: Gavel,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      change: 'From judge committee',
    },
    {
      label: 'Media Assets',
      value: stats.mediaCount,
      icon: Camera,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      change: stats.mediaCount > 0 ? `${stats.mediaCount} files` : 'No assets yet',
    },
    {
      label: 'Speakers',
      value: stats.speakersConfirmed,
      icon: Mic2,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      change: stats.speakersTotal > 0 
        ? `${stats.speakersConfirmed}/${stats.speakersTotal} confirmed`
        : 'No speakers yet',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statsConfig.map((stat) => (
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
