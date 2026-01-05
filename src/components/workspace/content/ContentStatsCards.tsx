import { Card, CardContent } from '@/components/ui/card';
import { FileText, Share2, Image, Calendar } from 'lucide-react';

interface ContentStatsCardsProps {
  publishedPosts: number;
  scheduledPosts: number;
  mediaAssets: number;
  socialReach: number;
}

export function ContentStatsCards({
  publishedPosts = 24,
  scheduledPosts = 8,
  mediaAssets = 156,
  socialReach = 12500,
}: ContentStatsCardsProps) {
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
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Media Assets',
      value: mediaAssets,
      icon: Image,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Social Reach',
      value: socialReach >= 1000 ? `${(socialReach / 1000).toFixed(1)}K` : socialReach,
      icon: Share2,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

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
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
