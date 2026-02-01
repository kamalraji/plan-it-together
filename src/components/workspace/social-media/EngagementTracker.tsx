import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MessageCircle, Heart, Share2, Bookmark, TrendingUp } from 'lucide-react';

interface EngagementMetric {
  id: string;
  platform: string;
  platformIcon: string;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagementRate: number;
  trend: number;
}

export function EngagementTracker() {
  const metrics: EngagementMetric[] = [
    {
      id: '1',
      platform: 'Instagram',
      platformIcon: '📷',
      likes: 3240,
      comments: 156,
      shares: 89,
      saves: 245,
      engagementRate: 7.2,
      trend: 12,
    },
    {
      id: '2',
      platform: 'Twitter/X',
      platformIcon: '𝕏',
      likes: 1890,
      comments: 342,
      shares: 567,
      saves: 0,
      engagementRate: 4.8,
      trend: 8,
    },
    {
      id: '3',
      platform: 'LinkedIn',
      platformIcon: '💼',
      likes: 892,
      comments: 78,
      shares: 134,
      saves: 0,
      engagementRate: 3.1,
      trend: -2,
    },
    {
      id: '4',
      platform: 'TikTok',
      platformIcon: '🎵',
      likes: 8920,
      comments: 456,
      shares: 1234,
      saves: 567,
      engagementRate: 9.5,
      trend: 24,
    },
  ];

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Engagement Overview
          </CardTitle>
          <Badge variant="outline" className="text-xs">Last 7 days</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics.map((metric) => (
          <div key={metric.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{metric.platformIcon}</span>
                <span className="font-medium text-sm">{metric.platform}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${metric.trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {metric.trend >= 0 ? '+' : ''}{metric.trend}%
                </span>
                <Badge variant="secondary" className="text-xs">
                  {metric.engagementRate}% rate
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/50">
                <Heart className="h-3.5 w-3.5 text-red-500" />
                <span className="text-xs font-medium">{formatNumber(metric.likes)}</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/50">
                <MessageCircle className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-xs font-medium">{formatNumber(metric.comments)}</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/50">
                <Share2 className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs font-medium">{formatNumber(metric.shares)}</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/50">
                <Bookmark className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs font-medium">{formatNumber(metric.saves)}</span>
              </div>
            </div>
            <Progress value={metric.engagementRate * 10} className="h-1" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
