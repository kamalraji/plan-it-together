import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ExternalLink, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Settings,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { useSocialMediaAccounts, DEFAULT_PLATFORMS, type SocialMediaAccount } from '@/hooks/useSocialMediaData';

interface PlatformManagerProps {
  workspaceId?: string;
}

export function PlatformManager({ workspaceId }: PlatformManagerProps) {
  const { data: platforms, isLoading, error } = useSocialMediaAccounts(workspaceId);

  // Use default platforms as fallback when no data exists
  const displayPlatforms: SocialMediaAccount[] = platforms && platforms.length > 0 
    ? platforms 
    : DEFAULT_PLATFORMS.map((p, i) => ({
        ...p,
        id: `default-${i}`,
        workspace_id: workspaceId || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="h-3 w-3 text-emerald-500" />;
    if (trend === 'down') return <TrendingDown className="h-3 w-3 text-red-500" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

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
            <BarChart3 className="h-5 w-5 text-primary" />
            Platform Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3 rounded-lg border border-border/50">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            Platform Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <p>Failed to load platforms</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            Platform Overview
          </CardTitle>
          <Button variant="outline" size="sm">
            <Settings className="h-3 w-3 mr-1" />
            Manage
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayPlatforms.map((platform) => (
          <div 
            key={platform.id} 
            className={`p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors ${
              !platform.connected ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${platform.color || 'bg-muted'} flex items-center justify-center text-white text-lg`}>
                  {platform.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{platform.name}</p>
                    {!platform.connected && (
                      <Badge variant="outline" className="text-xs">Not Connected</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{platform.handle}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-semibold text-sm">{formatNumber(platform.followers)}</p>
                  <p className="text-xs text-muted-foreground">followers</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {getTrendIcon(platform.trend)}
                  <Badge variant="secondary" className="text-xs">
                    {platform.engagement_rate}%
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={(platform.posts_this_week / platform.posts_goal) * 100} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {platform.posts_this_week}/{platform.posts_goal} posts
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
