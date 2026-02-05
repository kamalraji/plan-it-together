import { Card, CardContent } from '@/components/ui/card';
import { FileText, Share2, Image, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useContentStats } from '@/hooks/useContentStats';

interface ContentStatsCardsProps {
  workspaceId: string;
}

export function ContentStatsCards({ workspaceId }: ContentStatsCardsProps) {
  const { publishedPosts, scheduledPosts, mediaAssets, socialReach, isLoading } = useContentStats(workspaceId);

  const stats = [
    {
      label: 'Published Posts',
      value: publishedPosts,
      icon: FileText,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'Scheduled',
      value: scheduledPosts,
      icon: Calendar,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      label: 'Media Assets',
      value: mediaAssets,
      icon: Image,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Social Reach',
      value: socialReach >= 1000 ? `${(socialReach / 1000).toFixed(1)}K` : socialReach,
      icon: Share2,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
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
