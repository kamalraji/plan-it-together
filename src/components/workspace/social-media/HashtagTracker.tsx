import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Hash, TrendingUp, Plus, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface Hashtag {
  id: string;
  tag: string;
  uses: number;
  reach: number;
  trend: 'trending' | 'stable' | 'declining';
  isPrimary: boolean;
}

export function HashtagTracker() {
  const hashtags: Hashtag[] = [
    { id: '1', tag: '#EventName2026', uses: 1250, reach: 45000, trend: 'trending', isPrimary: true },
    { id: '2', tag: '#TechConference', uses: 890, reach: 32000, trend: 'trending', isPrimary: true },
    { id: '3', tag: '#Innovation', uses: 567, reach: 21000, trend: 'stable', isPrimary: false },
    { id: '4', tag: '#Networking', uses: 423, reach: 15000, trend: 'stable', isPrimary: false },
    { id: '5', tag: '#EventPrep', uses: 234, reach: 8500, trend: 'declining', isPrimary: false },
    { id: '6', tag: '#ComingSoon', uses: 156, reach: 5200, trend: 'stable', isPrimary: false },
  ];

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case 'trending':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs">Trending</Badge>;
      case 'declining':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-xs">Declining</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Stable</Badge>;
    }
  };

  const copyAllHashtags = () => {
    const allTags = hashtags.map(h => h.tag).join(' ');
    navigator.clipboard.writeText(allTags);
    toast.success('Hashtags copied to clipboard');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Hash className="h-5 w-5 text-primary" />
            Hashtag Performance
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyAllHashtags}>
              <Copy className="h-3 w-3 mr-1" />
              Copy All
            </Button>
            <Button size="sm">
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {hashtags.map((hashtag) => (
            <div
              key={hashtag.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  hashtag.isPrimary ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  <Hash className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{hashtag.tag}</span>
                    {hashtag.isPrimary && (
                      <Badge variant="secondary" className="text-xs">Primary</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(hashtag.uses)} uses • {formatNumber(hashtag.reach)} reach
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hashtag.trend === 'trending' && (
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                )}
                {getTrendBadge(hashtag.trend)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
