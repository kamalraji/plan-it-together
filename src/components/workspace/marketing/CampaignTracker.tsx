import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, Plus, TrendingUp, Calendar, Loader2 } from 'lucide-react';
import { useCampaigns, type Campaign, type CampaignStatus, type CampaignChannel } from '@/hooks/useCampaigns';

interface CampaignTrackerProps {
  workspaceId?: string;
}

const statusColors: Record<CampaignStatus, string> = {
  draft: 'bg-muted text-foreground border-border',
  scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  paused: 'bg-amber-100 text-amber-700 border-amber-200',
  completed: 'bg-muted text-foreground border-border',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

const channelLabels: Record<CampaignChannel, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'Twitter',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  google: 'Google Ads',
  email: 'Email',
  other: 'Other',
};

export function CampaignTracker({ workspaceId }: CampaignTrackerProps) {
  const { data: campaigns = [], isLoading } = useCampaigns(workspaceId);

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-pink-600" />
            <CardTitle className="text-lg font-semibold">Campaign Tracker</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-pink-600" />
            <CardTitle className="text-lg font-semibold">Campaign Tracker</CardTitle>
          </div>
          <Button size="sm" variant="outline" className="gap-1">
            <Plus className="h-4 w-4" />
            New Campaign
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[200px] text-center">
          <Target className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No campaigns yet</p>
          <p className="text-sm text-muted-foreground/70">Create your first marketing campaign</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-pink-600" />
          <CardTitle className="text-lg font-semibold">Campaign Tracker</CardTitle>
        </div>
        <Button size="sm" variant="outline" className="gap-1">
          <Plus className="h-4 w-4" />
          New Campaign
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {campaigns.map((campaign) => (
          <CampaignRow key={campaign.id} campaign={campaign} />
        ))}
      </CardContent>
    </Card>
  );
}

function CampaignRow({ campaign }: { campaign: Campaign }) {
  const budgetPercent = campaign.budget > 0 ? (campaign.spent / campaign.budget) * 100 : 0;
  const statusLabel = campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1);

  return (
    <div className="p-4 rounded-lg border border-border/50 bg-card hover:bg-accent/5 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-foreground">{campaign.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {channelLabels[campaign.channel]}
            </Badge>
            <Badge className={`text-xs ${statusColors[campaign.status]}`}>
              {statusLabel}
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-foreground">
            ${campaign.spent.toLocaleString()} / ${campaign.budget.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">Budget Used</p>
        </div>
      </div>
      
      <Progress value={budgetPercent} className="h-2 mb-3" />
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {campaign.impressions >= 1000 
              ? `${(campaign.impressions / 1000).toFixed(1)}K` 
              : campaign.impressions} reach
          </span>
          <span>{campaign.conversions} conversions</span>
        </div>
        {campaign.endDate && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(campaign.endDate).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}
