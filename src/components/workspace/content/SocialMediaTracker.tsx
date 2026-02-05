import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Share2, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SocialPlatform {
  id: string;
  name: string;
  icon: string;
  followers: number;
  engagement: number;
  trend: 'up' | 'down' | 'stable';
  postsThisWeek: number;
  color: string;
}

export function SocialMediaTracker() {
  const platforms: SocialPlatform[] = [
    {
      id: 'twitter',
      name: 'Twitter/X',
      icon: '𝕏',
      followers: 2450,
      engagement: 4.2,
      trend: 'up',
      postsThisWeek: 12,
      color: 'bg-sky-500',
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: '📷',
      followers: 5200,
      engagement: 6.8,
      trend: 'up',
      postsThisWeek: 8,
      color: 'bg-pink-500',
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: '💼',
      followers: 1800,
      engagement: 3.5,
      trend: 'stable',
      postsThisWeek: 5,
      color: 'bg-primary',
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: '📘',
      followers: 3100,
      engagement: 2.1,
      trend: 'down',
      postsThisWeek: 6,
      color: 'bg-primary',
    },
  ];

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="h-3 w-3 text-emerald-500" />;
    if (trend === 'down') return <TrendingDown className="h-3 w-3 text-destructive" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Share2 className="h-5 w-5 text-primary" />
            Social Media
          </CardTitle>
          <Button variant="outline" size="sm">
            <ExternalLink className="h-3 w-3 mr-1" />
            Analytics
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {platforms.map((platform) => (
          <div key={platform.id} className="p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg ${platform.color} flex items-center justify-center text-primary-foreground text-sm`}>
                  {platform.icon}
                </div>
                <div>
                  <p className="font-medium text-sm">{platform.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(platform.followers)} followers
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getTrendIcon(platform.trend)}
                <Badge variant="secondary" className="text-xs">
                  {platform.engagement}% eng.
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={(platform.postsThisWeek / 15) * 100} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {platform.postsThisWeek}/15 posts
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
