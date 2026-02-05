import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Plus, Mail, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface InfluencerTrackerProps {
  workspaceId?: string;
}

interface Influencer {
  id: string;
  name: string;
  handle: string;
  platform: string;
  platformIcon: string;
  followers: number;
  status: 'confirmed' | 'pending' | 'declined' | 'contacted';
  deliverables: string;
}

// Default influencers for display (would come from DB in production)
const DEFAULT_INFLUENCERS: Influencer[] = [
  {
    id: 'default-1',
    name: 'Tech Sarah',
    handle: '@techsarah',
    platform: 'Instagram',
    platformIcon: '📷',
    followers: 125000,
    status: 'confirmed',
    deliverables: '3 posts, 5 stories',
  },
  {
    id: 'default-2',
    name: 'Dev Mike',
    handle: '@devmike',
    platform: 'Twitter/X',
    platformIcon: '𝕏',
    followers: 89000,
    status: 'confirmed',
    deliverables: '5 tweets, 1 thread',
  },
  {
    id: 'default-3',
    name: 'Code Queen',
    handle: '@codequeen',
    platform: 'TikTok',
    platformIcon: '🎵',
    followers: 450000,
    status: 'pending',
    deliverables: '2 videos',
  },
];

export function InfluencerTracker({ workspaceId: _workspaceId }: InfluencerTrackerProps) {
  // For now, use default influencers since there's no dedicated influencer_partnerships table yet
  // In production, this would query a dedicated table
  const influencers: Influencer[] = DEFAULT_INFLUENCERS;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Confirmed
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20 text-xs flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case 'declined':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Declined
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            <Mail className="h-3 w-3" />
            Contacted
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Influencer Partnerships
          </CardTitle>
          <Button size="sm">
            <Plus className="h-3 w-3 mr-1" />
            Add Partner
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {influencers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No influencer partnerships yet</p>
            <Button variant="outline" size="sm" className="mt-3">
              <Plus className="h-3 w-3 mr-1" />
              Add First Partner
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {influencers.map((influencer) => (
              <div
                key={influencer.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {influencer.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{influencer.name}</p>
                    <span className="text-lg">{influencer.platformIcon}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {influencer.handle} • {formatNumber(influencer.followers)} followers
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {influencer.deliverables}
                  </p>
                </div>
                {getStatusBadge(influencer.status)}
              </div>
            ))}
          </div>
        )}
        <Button variant="ghost" className="w-full mt-3" size="sm">
          View All Partners
        </Button>
      </CardContent>
    </Card>
  );
}
