import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Handshake, Building2, TrendingUp } from 'lucide-react';

interface SponsorTier {
  tier: string;
  count: number;
  target: number;
  revenue: number;
  color: string;
}

export function SponsorshipSummary() {
  const tiers: SponsorTier[] = [
    { tier: 'Platinum', count: 2, target: 3, revenue: 60000, color: 'bg-slate-400' },
    { tier: 'Gold', count: 4, target: 5, revenue: 40000, color: 'bg-amber-400' },
    { tier: 'Silver', count: 6, target: 10, revenue: 18000, color: 'bg-slate-300' },
    { tier: 'Bronze', count: 8, target: 15, revenue: 8000, color: 'bg-warning' },
  ];

  const totalRevenue = tiers.reduce((sum, t) => sum + t.revenue, 0);
  const totalSponsors = tiers.reduce((sum, t) => sum + t.count, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Handshake className="h-5 w-5 text-primary" />
            Sponsorship Summary
          </CardTitle>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-semibold text-emerald-500">+15%</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-muted/50">
          <div className="text-center">
            <p className="text-2xl font-bold">{totalSponsors}</p>
            <p className="text-xs text-muted-foreground">Total Sponsors</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">${(totalRevenue / 1000).toFixed(0)}K</p>
            <p className="text-xs text-muted-foreground">Revenue Secured</p>
          </div>
        </div>
        
        <div className="space-y-3">
          {tiers.map((tier) => {
            const progress = (tier.count / tier.target) * 100;
            
            return (
              <div key={tier.tier} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${tier.color}`} />
                    <span className="font-medium text-sm">{tier.tier}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {tier.count}/{tier.target}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      ${(tier.revenue / 1000).toFixed(0)}K
                    </span>
                  </div>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>
            );
          })}
        </div>
        
        <div className="pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            <span>12 proposals in pipeline</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
