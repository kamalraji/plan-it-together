import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  MousePointer, 
  Target, 
  DollarSign,
  Download,
  Filter,
  Calendar
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useCampaigns, useMarketingAnalytics } from '@/hooks/useMarketingCommitteeData';

interface ViewAnalyticsMarketingTabProps {
  workspaceId: string;
}

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function ViewAnalyticsMarketingTab({ workspaceId }: ViewAnalyticsMarketingTabProps) {
  const [dateRange, setDateRange] = useState('30');
  const [channelFilter, setChannelFilter] = useState('all');

  const { data: analytics, isLoading: analyticsLoading } = useMarketingAnalytics(workspaceId);
  const { data: campaigns = [], isLoading: campaignsLoading } = useCampaigns(workspaceId);

  const isLoading = analyticsLoading || campaignsLoading;

  // Filter campaigns by channel
  const filteredCampaigns = channelFilter === 'all' 
    ? campaigns 
    : campaigns.filter(c => c.channel === channelFilter);

  // Generate performance data for charts
  const performanceData = Array.from({ length: 7 }, (_, i) => ({
    date: format(subDays(new Date(), 6 - i), 'MMM d'),
    impressions: Math.floor(Math.random() * 10000) + 5000,
    clicks: Math.floor(Math.random() * 500) + 100,
    conversions: Math.floor(Math.random() * 50) + 10,
  }));

  // Channel distribution
  const channelData = [
    { name: 'Social Media', value: 35 },
    { name: 'Email', value: 25 },
    { name: 'Search', value: 20 },
    { name: 'Display', value: 15 },
    { name: 'Other', value: 5 },
  ];

  const handleExport = () => {
    const csvData = filteredCampaigns.map(c => ({
      Name: c.name,
      Channel: c.channel,
      Status: c.status,
      Budget: c.budget,
      Spent: c.spent,
      Impressions: c.impressions,
      Clicks: c.clicks,
      Conversions: c.conversions,
      CTR: c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) + '%' : '0%',
    }));

    const headers = Object.keys(csvData[0] || {}).join(',');
    const rows = csvData.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marketing-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Marketing Analytics</h2>
          <p className="text-muted-foreground">Track campaign performance and ROI</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Reach"
          value={analytics?.totalReach.toLocaleString() || '0'}
          icon={Eye}
          trend={12.5}
          color="text-info"
        />
        <KPICard
          title="Total Clicks"
          value={analytics?.totalClicks.toLocaleString() || '0'}
          icon={MousePointer}
          trend={8.3}
          color="text-emerald-500"
        />
        <KPICard
          title="Conversions"
          value={analytics?.totalConversions.toLocaleString() || '0'}
          icon={Target}
          trend={-2.1}
          color="text-primary"
        />
        <KPICard
          title="Total Spent"
          value={`$${(analytics?.totalSpent || 0).toLocaleString()}`}
          icon={DollarSign}
          trend={5.7}
          color="text-warning"
          subtitle={`of $${(analytics?.totalBudget || 0).toLocaleString()} budget`}
        />
      </div>

      {/* Rate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{analytics?.avgCTR.toFixed(2) || '0'}%</p>
              <p className="text-sm text-muted-foreground">Average CTR</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-500">{analytics?.avgConversionRate.toFixed(2) || '0'}%</p>
              <p className="text-sm text-muted-foreground">Conversion Rate</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                ${analytics && analytics.totalConversions > 0 
                  ? (analytics.totalSpent / analytics.totalConversions).toFixed(2) 
                  : '0'}
              </p>
              <p className="text-sm text-muted-foreground">Cost per Conversion</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance Over Time</CardTitle>
            <CardDescription>Daily impressions and clicks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))' 
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="impressions" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Impressions"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="clicks" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    name="Clicks"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Channel Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Channel Distribution</CardTitle>
            <CardDescription>Traffic by marketing channel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {channelData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Campaign Performance</CardTitle>
              <CardDescription>Detailed metrics by campaign</CardDescription>
            </div>
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="social">Social Media</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="search">Search</SelectItem>
                <SelectItem value="display">Display</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {filteredCampaigns.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No campaigns found</p>
              ) : (
                filteredCampaigns.map(campaign => {
                  const ctr = campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0;
                  
                  return (
                    <div 
                      key={campaign.id} 
                      className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/30 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{campaign.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {campaign.channel}
                          </Badge>
                          <Badge className={cn(
                            'text-xs',
                            campaign.status === 'active' && 'bg-emerald-500/20 text-emerald-600',
                            campaign.status === 'paused' && 'bg-warning/20 text-warning',
                            campaign.status === 'completed' && 'bg-info/20 text-info',
                            campaign.status === 'draft' && 'bg-muted text-muted-foreground',
                          )}>
                            {campaign.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-5 gap-6 text-right text-sm">
                        <div>
                          <p className="font-medium">{campaign.impressions.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Impressions</p>
                        </div>
                        <div>
                          <p className="font-medium">{campaign.clicks.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Clicks</p>
                        </div>
                        <div>
                          <p className="font-medium">{ctr.toFixed(2)}%</p>
                          <p className="text-xs text-muted-foreground">CTR</p>
                        </div>
                        <div>
                          <p className="font-medium">{campaign.conversions}</p>
                          <p className="text-xs text-muted-foreground">Conversions</p>
                        </div>
                        <div>
                          <p className="font-medium">${campaign.spent.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Spent</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function KPICard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color, 
  subtitle 
}: { 
  title: string; 
  value: string; 
  icon: any; 
  trend: number; 
  color: string;
  subtitle?: string;
}) {
  const isPositive = trend >= 0;
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={cn('p-2 rounded-lg bg-muted', color)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className={cn(
          'flex items-center gap-1 text-xs mt-3',
          isPositive ? 'text-emerald-500' : 'text-destructive'
        )}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          <span>{Math.abs(trend)}% vs last period</span>
        </div>
      </CardContent>
    </Card>
  );
}
