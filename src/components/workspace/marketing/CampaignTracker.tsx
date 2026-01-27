import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, Plus, TrendingUp, Calendar } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  type: 'social' | 'email' | 'paid' | 'influencer';
  status: 'active' | 'scheduled' | 'completed' | 'paused';
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  reach: number;
  conversions: number;
}

const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Early Bird Registration Push',
    type: 'paid',
    status: 'active',
    startDate: '2025-01-01',
    endDate: '2025-01-15',
    budget: 3000,
    spent: 1850,
    reach: 25000,
    conversions: 342,
  },
  {
    id: '2',
    name: 'Speaker Announcement Series',
    type: 'social',
    status: 'active',
    startDate: '2025-01-05',
    endDate: '2025-01-20',
    budget: 500,
    spent: 200,
    reach: 12000,
    conversions: 156,
  },
  {
    id: '3',
    name: 'Newsletter - Event Updates',
    type: 'email',
    status: 'scheduled',
    startDate: '2025-01-10',
    endDate: '2025-01-10',
    budget: 100,
    spent: 0,
    reach: 0,
    conversions: 0,
  },
  {
    id: '4',
    name: 'Tech Influencer Partnership',
    type: 'influencer',
    status: 'completed',
    startDate: '2024-12-15',
    endDate: '2024-12-30',
    budget: 5000,
    spent: 5000,
    reach: 45000,
    conversions: 890,
  },
];

const statusColors: Record<Campaign['status'], string> = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-muted text-foreground border-border',
  paused: 'bg-amber-100 text-amber-700 border-amber-200',
};

const typeLabels: Record<Campaign['type'], string> = {
  social: 'Social Media',
  email: 'Email',
  paid: 'Paid Ads',
  influencer: 'Influencer',
};

export function CampaignTracker() {
  const [campaigns] = useState<Campaign[]>(mockCampaigns);

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
        {campaigns.map((campaign) => {
          const budgetPercent = (campaign.spent / campaign.budget) * 100;
          
          return (
            <div
              key={campaign.id}
              className="p-4 rounded-lg border border-border/50 bg-card hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-foreground">{campaign.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {typeLabels[campaign.type]}
                    </Badge>
                    <Badge className={`text-xs ${statusColors[campaign.status]}`}>
                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
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
                    {campaign.reach >= 1000 ? `${(campaign.reach / 1000).toFixed(1)}K` : campaign.reach} reach
                  </span>
                  <span>{campaign.conversions} conversions</span>
                </div>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {campaign.endDate}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
