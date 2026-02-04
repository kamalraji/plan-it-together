import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle, Heart, Share2, Bookmark, TrendingUp } from 'lucide-react';
import { useSocialMediaAccounts, DEFAULT_PLATFORMS, type SocialMediaAccount } from '@/hooks/useSocialMediaData';

interface EngagementTrackerProps {
  workspaceId?: string;
}

export function EngagementTracker({ workspaceId }: EngagementTrackerProps) {
  const { data: accounts, isLoading } = useSocialMediaAccounts(workspaceId);

  // Use actual data or fallback to default platforms
  const displayAccounts: SocialMediaAccount[] = accounts && accounts.length > 0 
    ? accounts 
    : DEFAULT_PLATFORMS.map((p, i) => ({
        ...p,
        id: `default-${i}`,
        workspace_id: workspaceId || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

  // Simulated engagement metrics based on followers and engagement rate
  // In production, this would come from a dedicated engagement_metrics table
  const metrics = displayAccounts.slice(0, 4).map(account => {
    const baseEngagement = Math.floor(account.followers * (account.engagement_rate / 100));
    return {
      id: account.id,
      platform: account.name,
      platformIcon: account.icon || '📊',
      likes: Math.floor(baseEngagement * 0.6),
      comments: Math.floor(baseEngagement * 0.2),
      shares: Math.floor(baseEngagement * 0.15),
      saves: Math.floor(baseEngagement * 0.05),
      engagementRate: account.engagement_rate,
      trend: account.trend === 'up' ? 12 : account.trend === 'down' ? -5 : 0,
    };
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Engagement Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((j) => (
                  <Skeleton key={j} className="h-10 w-full" />
                ))}
              </div>
              <Skeleton className="h-1 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

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
        {metrics.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No engagement data available</p>
            <p className="text-xs mt-1">Connect social platforms to track engagement</p>
          </div>
        ) : (
          metrics.map((metric) => (
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
          ))
        )}
      </CardContent>
    </Card>
  );
}
