import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Megaphone, 
  Play, 
  Pause, 
  MoreHorizontal,
  Eye,
  MousePointer,
  TrendingUp
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  channel: string;
  status: 'active' | 'paused' | 'scheduled' | 'completed';
  impressions: number;
  clicks: number;
  conversions: number;
  budget: number;
  spent: number;
}

export function CampaignOverview() {
  const campaigns: Campaign[] = [
    {
      id: '1',
      name: 'Early Bird Registration',
      channel: 'Multi-channel',
      status: 'active',
      impressions: 450000,
      clicks: 12500,
      conversions: 890,
      budget: 5000,
      spent: 3200,
    },
    {
      id: '2',
      name: 'Speaker Announcements',
      channel: 'Social Media',
      status: 'active',
      impressions: 280000,
      clicks: 8900,
      conversions: 0,
      budget: 2000,
      spent: 1100,
    },
    {
      id: '3',
      name: 'Partner Spotlight Series',
      channel: 'Email + Social',
      status: 'scheduled',
      impressions: 0,
      clicks: 0,
      conversions: 0,
      budget: 1500,
      spent: 0,
    },
    {
      id: '4',
      name: 'Workshop Promo',
      channel: 'LinkedIn',
      status: 'paused',
      impressions: 65000,
      clicks: 2100,
      conversions: 145,
      budget: 1000,
      spent: 450,
    },
  ];

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs">Active</Badge>;
      case 'paused':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-xs">Paused</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs">Scheduled</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="text-xs">Completed</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Megaphone className="h-5 w-5 text-primary" />
            Active Campaigns
          </CardTitle>
          <Button size="sm">New Campaign</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {campaigns.map((campaign) => (
          <div
            key={campaign.id}
            className="p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{campaign.name}</span>
                {getStatusBadge(campaign.status)}
              </div>
              <div className="flex items-center gap-1">
                {campaign.status === 'active' && (
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Pause className="h-3.5 w-3.5" />
                  </Button>
                )}
                {campaign.status === 'paused' && (
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Play className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground mb-2">{campaign.channel}</p>
            
            <div className="grid grid-cols-4 gap-2">
              <div className="flex items-center gap-1.5 text-xs">
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">{formatNumber(campaign.impressions)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <MousePointer className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">{formatNumber(campaign.clicks)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">{campaign.conversions}</span>
              </div>
              <div className="text-xs text-right">
                <span className="text-muted-foreground">${campaign.spent}</span>
                <span className="text-muted-foreground/50"> / ${campaign.budget}</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
