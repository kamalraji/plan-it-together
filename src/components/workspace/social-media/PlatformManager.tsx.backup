import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ExternalLink, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Settings,
  BarChart3
} from 'lucide-react';

interface Platform {
  id: string;
  name: string;
  icon: string;
  handle: string;
  followers: number;
  engagement: number;
  trend: 'up' | 'down' | 'stable';
  postsThisWeek: number;
  postsGoal: number;
  color: string;
  connected: boolean;
}

export function PlatformManager() {
  const platforms: Platform[] = [
    {
      id: 'twitter',
      name: 'Twitter/X',
      icon: '𝕏',
      handle: '@eventname',
      followers: 12450,
      engagement: 4.8,
      trend: 'up',
      postsThisWeek: 18,
      postsGoal: 21,
      color: 'bg-sky-500',
      connected: true,
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: '📷',
      handle: '@eventname_official',
      followers: 28500,
      engagement: 7.2,
      trend: 'up',
      postsThisWeek: 12,
      postsGoal: 14,
      color: 'bg-pink-500',
      connected: true,
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: '💼',
      handle: 'Event Name',
      followers: 8200,
      engagement: 3.1,
      trend: 'stable',
      postsThisWeek: 6,
      postsGoal: 7,
      color: 'bg-blue-600',
      connected: true,
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: '📘',
      handle: 'Event Name Page',
      followers: 15800,
      engagement: 2.4,
      trend: 'down',
      postsThisWeek: 8,
      postsGoal: 10,
      color: 'bg-indigo-500',
      connected: true,
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: '🎵',
      handle: '@eventname',
      followers: 5400,
      engagement: 9.5,
      trend: 'up',
      postsThisWeek: 4,
      postsGoal: 7,
      color: 'bg-slate-800',
      connected: true,
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: '▶️',
      handle: 'Event Name Channel',
      followers: 3200,
      engagement: 5.8,
      trend: 'stable',
      postsThisWeek: 2,
      postsGoal: 3,
      color: 'bg-red-600',
      connected: false,
    },
  ];

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
        {platforms.map((platform) => (
          <div 
            key={platform.id} 
            className={`p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors ${
              !platform.connected ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${platform.color} flex items-center justify-center text-white text-lg`}>
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
                    {platform.engagement}%
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={(platform.postsThisWeek / platform.postsGoal) * 100} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {platform.postsThisWeek}/{platform.postsGoal} posts
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
