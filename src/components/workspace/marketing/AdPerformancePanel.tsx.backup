import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface AdChannel {
  id: string;
  name: string;
  icon: string;
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
  conversions: number;
  cpc: number;
  trend: 'up' | 'down' | 'stable';
}

const mockChannels: AdChannel[] = [
  {
    id: '1',
    name: 'Google Ads',
    icon: '🔍',
    impressions: 125000,
    clicks: 3750,
    ctr: 3.0,
    spend: 4500,
    conversions: 225,
    cpc: 1.20,
    trend: 'up',
  },
  {
    id: '2',
    name: 'Meta Ads',
    icon: '📘',
    impressions: 89000,
    clicks: 2670,
    ctr: 3.0,
    spend: 2800,
    conversions: 156,
    cpc: 1.05,
    trend: 'up',
  },
  {
    id: '3',
    name: 'LinkedIn Ads',
    icon: '💼',
    impressions: 34000,
    clicks: 680,
    ctr: 2.0,
    spend: 1200,
    conversions: 45,
    cpc: 1.76,
    trend: 'down',
  },
  {
    id: '4',
    name: 'Twitter/X Ads',
    icon: '🐦',
    impressions: 56000,
    clicks: 1120,
    ctr: 2.0,
    spend: 800,
    conversions: 38,
    cpc: 0.71,
    trend: 'stable',
  },
];

export function AdPerformancePanel() {
  const totalSpend = mockChannels.reduce((acc, ch) => acc + ch.spend, 0);
  const totalConversions = mockChannels.reduce((acc, ch) => acc + ch.conversions, 0);
  const avgCPC = totalSpend / mockChannels.reduce((acc, ch) => acc + ch.clicks, 0);

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg font-semibold">Ad Performance by Channel</CardTitle>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">${totalSpend.toLocaleString()}</span>
            <span className="text-muted-foreground">spent</span>
          </div>
          <div className="text-muted-foreground">|</div>
          <span className="font-medium">{totalConversions}</span>
          <span className="text-muted-foreground">conversions</span>
          <div className="text-muted-foreground">|</div>
          <span className="font-medium">${avgCPC.toFixed(2)}</span>
          <span className="text-muted-foreground">avg CPC</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Channel
                </th>
                <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Impressions
                </th>
                <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Clicks
                </th>
                <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  CTR
                </th>
                <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Spend
                </th>
                <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Conversions
                </th>
                <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  CPC
                </th>
                <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody>
              {mockChannels.map((channel) => (
                <tr
                  key={channel.id}
                  className="border-b border-border/30 hover:bg-accent/5 transition-colors"
                >
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{channel.icon}</span>
                      <span className="font-medium text-foreground">{channel.name}</span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-2 text-sm text-muted-foreground">
                    {channel.impressions >= 1000
                      ? `${(channel.impressions / 1000).toFixed(0)}K`
                      : channel.impressions}
                  </td>
                  <td className="text-right py-3 px-2 text-sm text-muted-foreground">
                    {channel.clicks >= 1000
                      ? `${(channel.clicks / 1000).toFixed(1)}K`
                      : channel.clicks}
                  </td>
                  <td className="text-right py-3 px-2 text-sm text-muted-foreground">
                    {channel.ctr.toFixed(1)}%
                  </td>
                  <td className="text-right py-3 px-2 text-sm font-medium text-foreground">
                    ${channel.spend.toLocaleString()}
                  </td>
                  <td className="text-right py-3 px-2 text-sm font-medium text-foreground">
                    {channel.conversions}
                  </td>
                  <td className="text-right py-3 px-2 text-sm text-muted-foreground">
                    ${channel.cpc.toFixed(2)}
                  </td>
                  <td className="text-right py-3 px-2">
                    {channel.trend === 'up' && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Up
                      </Badge>
                    )}
                    {channel.trend === 'down' && (
                      <Badge className="bg-red-100 text-red-700 border-red-200">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        Down
                      </Badge>
                    )}
                    {channel.trend === 'stable' && (
                      <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                        Stable
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
