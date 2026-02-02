import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Loader2 } from 'lucide-react';
import { useAdChannels, AdChannel } from '@/hooks/useMarketingData';

interface AdPerformancePanelProps {
  workspaceId: string;
}

export function AdPerformancePanel({ workspaceId }: AdPerformancePanelProps) {
  const { channels, isLoading, metrics } = useAdChannels(workspaceId);

  const getTrendBadge = (trend: AdChannel['trend']) => {
    switch (trend) {
      case 'up':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
            <TrendingUp className="h-3 w-3 mr-1" />
            Up
          </Badge>
        );
      case 'down':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200">
            <TrendingDown className="h-3 w-3 mr-1" />
            Down
          </Badge>
        );
      case 'stable':
        return (
          <Badge className="bg-muted text-foreground border-border">
            Stable
          </Badge>
        );
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(num >= 10000 ? 0 : 1)}K`;
    }
    return num.toString();
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

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
            <span className="font-medium">${metrics.totalSpend.toLocaleString()}</span>
            <span className="text-muted-foreground">spent</span>
          </div>
          <div className="text-muted-foreground">|</div>
          <span className="font-medium">{metrics.totalConversions}</span>
          <span className="text-muted-foreground">conversions</span>
          <div className="text-muted-foreground">|</div>
          <span className="font-medium">${metrics.avgCPC.toFixed(2)}</span>
          <span className="text-muted-foreground">avg CPC</span>
        </div>
      </CardHeader>
      <CardContent>
        {channels.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No ad channels configured yet
          </p>
        ) : (
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
                {channels.map((channel) => {
                  const ctr = channel.impressions > 0 
                    ? ((channel.clicks / channel.impressions) * 100).toFixed(1) 
                    : '0.0';
                  const cpc = channel.clicks > 0 
                    ? (channel.spend / channel.clicks).toFixed(2) 
                    : '0.00';

                  return (
                    <tr
                      key={channel.id}
                      className="border-b border-border/30 hover:bg-accent/5 transition-colors"
                    >
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{channel.icon || '📊'}</span>
                          <span className="font-medium text-foreground">{channel.name}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-2 text-sm text-muted-foreground">
                        {formatNumber(channel.impressions)}
                      </td>
                      <td className="text-right py-3 px-2 text-sm text-muted-foreground">
                        {formatNumber(channel.clicks)}
                      </td>
                      <td className="text-right py-3 px-2 text-sm text-muted-foreground">
                        {ctr}%
                      </td>
                      <td className="text-right py-3 px-2 text-sm font-medium text-foreground">
                        ${channel.spend.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-2 text-sm font-medium text-foreground">
                        {channel.conversions}
                      </td>
                      <td className="text-right py-3 px-2 text-sm text-muted-foreground">
                        ${cpc}
                      </td>
                      <td className="text-right py-3 px-2">
                        {getTrendBadge(channel.trend)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}