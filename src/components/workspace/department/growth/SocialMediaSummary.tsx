import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Share2, TrendingUp, TrendingDown } from 'lucide-react';

interface PlatformStat {
  platform: string;
  icon: string;
  followers: number;
  growth: number;
  engagement: number;
  postsThisWeek: number;
  color: string;
}

export function SocialMediaSummary() {
  const platforms: PlatformStat[] = [
    { platform: 'Instagram', icon: '📷', followers: 28500, growth: 12, engagement: 7.2, postsThisWeek: 12, color: 'bg-pink-500' },
    { platform: 'Twitter/X', icon: '𝕏', followers: 12450, growth: 8, engagement: 4.8, postsThisWeek: 18, color: 'bg-sky-500' },
    { platform: 'LinkedIn', icon: '💼', followers: 8200, growth: 5, engagement: 3.1, postsThisWeek: 6, color: 'bg-blue-600' },
    { platform: 'TikTok', icon: '🎵', followers: 5400, growth: 24, engagement: 9.5, postsThisWeek: 4, color: 'bg-slate-800' },
  ];

  const totalFollowers = platforms.reduce((sum, p) => sum + p.followers, 0);
  const avgEngagement = platforms.reduce((sum, p) => sum + p.engagement, 0) / platforms.length;

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
            <Share2 className="h-5 w-5 text-primary" />
            Social Media Summary
          </CardTitle>
          <Badge variant="outline" className="text-xs">Last 7 days</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-muted/50">
          <div className="text-center">
            <p className="text-2xl font-bold">{formatNumber(totalFollowers)}</p>
            <p className="text-xs text-muted-foreground">Total Followers</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{avgEngagement.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Avg Engagement</p>
          </div>
        </div>
        
        <div className="space-y-3">
          {platforms.map((platform) => (
            <div key={platform.platform} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${platform.color} flex items-center justify-center text-white text-sm`}>
                {platform.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{platform.platform}</span>
                  <div className="flex items-center gap-1">
                    {platform.growth >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className={`text-xs font-medium ${platform.growth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      +{platform.growth}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatNumber(platform.followers)} followers</span>
                  <span>{platform.engagement}% eng.</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
