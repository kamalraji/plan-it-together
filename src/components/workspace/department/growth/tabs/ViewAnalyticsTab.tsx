import { Workspace } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Eye, 
  MousePointer, 
  Target, 
  DollarSign, 
  Users, 
  Handshake,
  Trophy,
  Megaphone
} from 'lucide-react';
import { useGrowthAnalytics, useCampaigns, useSponsors, useGoals } from '@/hooks/useGrowthDepartmentData';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
interface ViewAnalyticsTabProps {
  workspace: Workspace;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function ViewAnalyticsTab({ workspace }: ViewAnalyticsTabProps) {
  const analytics = useGrowthAnalytics(workspace.id);
  const { data: campaigns } = useCampaigns(workspace.id);
  const { data: sponsors } = useSponsors(workspace.id);
  const { data: goals } = useGoals(workspace.id);

  // Prepare chart data
  const campaignPerformanceData = campaigns?.slice(0, 6).map(c => ({
    name: c.name.substring(0, 15),
    impressions: c.impressions,
    clicks: c.clicks,
    conversions: c.conversions,
  })) || [];

  const sponsorTierData = [
    { name: 'Platinum', value: sponsors?.filter(s => s.tier === 'platinum' && s.status === 'confirmed').length || 0 },
    { name: 'Gold', value: sponsors?.filter(s => s.tier === 'gold' && s.status === 'confirmed').length || 0 },
    { name: 'Silver', value: sponsors?.filter(s => s.tier === 'silver' && s.status === 'confirmed').length || 0 },
    { name: 'Bronze', value: sponsors?.filter(s => s.tier === 'bronze' && s.status === 'confirmed').length || 0 },
  ].filter(d => d.value > 0);

  const goalProgressData = goals?.filter(g => g.status === 'active').slice(0, 5).map(g => ({
    name: g.title.substring(0, 20),
    progress: g.target_value > 0 ? Math.min((g.current_value / g.target_value) * 100, 100) : 0,
    current: g.current_value,
    target: g.target_value,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Growth Analytics</h2>
        <p className="text-muted-foreground">Track your marketing and growth performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Impressions</p>
                <p className="text-2xl font-bold">{analytics.totalImpressions.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/10">
                <Eye className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-green-500">12.5%</span>
              <span className="text-muted-foreground">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Click-Through Rate</p>
                <p className="text-2xl font-bold">{analytics.ctr}%</p>
              </div>
              <div className="p-3 rounded-full bg-purple-500/10">
                <MousePointer className="h-5 w-5 text-purple-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-green-500">0.3%</span>
              <span className="text-muted-foreground">improvement</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Conversions</p>
                <p className="text-2xl font-bold">{analytics.totalConversions.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-green-500/10">
                <Target className="h-5 w-5 text-green-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-green-500">8.2%</span>
              <span className="text-muted-foreground">conversion rate</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sponsor Revenue</p>
                <p className="text-2xl font-bold">${analytics.sponsorRevenue.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-amber-500/10">
                <DollarSign className="h-5 w-5 text-amber-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <span className="text-muted-foreground">{analytics.confirmedSponsors} confirmed sponsors</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Campaign Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              Campaign Performance
            </CardTitle>
            <CardDescription>Impressions, clicks, and conversions by campaign</CardDescription>
          </CardHeader>
          <CardContent>
            {campaignPerformanceData.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No campaign data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={campaignPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="impressions" fill="hsl(var(--primary))" name="Impressions" />
                  <Bar dataKey="clicks" fill="hsl(var(--chart-2))" name="Clicks" />
                  <Bar dataKey="conversions" fill="hsl(var(--chart-3))" name="Conversions" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Sponsor Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Handshake className="h-4 w-4" />
              Sponsor Distribution
            </CardTitle>
            <CardDescription>Confirmed sponsors by tier</CardDescription>
          </CardHeader>
          <CardContent>
            {sponsorTierData.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No sponsor data available
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={sponsorTierData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {sponsorTierData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {sponsorTierData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm">{entry.name}</span>
                      </div>
                      <span className="font-medium">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Goal Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Active Goals Progress
          </CardTitle>
          <CardDescription>Track your growth objectives</CardDescription>
        </CardHeader>
        <CardContent>
          {goalProgressData.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              No active goals. Create goals to track your progress!
            </div>
          ) : (
            <div className="space-y-4">
              {goalProgressData.map((goal, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{goal.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {goal.current.toLocaleString()} / {goal.target.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={goal.progress} className="flex-1" />
                    <span className="text-sm font-medium w-12 text-right">{goal.progress.toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <Megaphone className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{analytics.activeCampaigns}</p>
            <p className="text-sm text-muted-foreground">Active Campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Users className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{analytics.activePartners}</p>
            <p className="text-sm text-muted-foreground">Active Partners</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <DollarSign className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">${analytics.totalSpent.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total Ad Spend</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{analytics.achievedGoals}/{analytics.totalGoals}</p>
            <p className="text-sm text-muted-foreground">Goals Achieved</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
