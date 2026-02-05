import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar,
  Eye,
  MousePointerClick,
  Clock,
  Activity
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { format, subDays } from 'date-fns';

export const AnalyticsPage: React.FC = () => {
  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['user-analytics'],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return null;

      // Get events count by status
      const { data: events } = await supabase
        .from('events')
        .select('status, created_at')
        .order('created_at', { ascending: false });

      // Get registrations trend
      const { data: registrations } = await supabase
        .from('registrations')
        .select('created_at, status')
        .gte('created_at', subDays(new Date(), 30).toISOString())
        .order('created_at', { ascending: true });

      // Get workspace activity
      const { data: workspaces } = await supabase
        .from('workspaces')
        .select('status, created_at')
        .order('created_at', { ascending: false });

      return { events, registrations, workspaces };
    },
  });

  // Process data for charts
  const registrationTrend = React.useMemo(() => {
    if (!analyticsData?.registrations) return [];
    
    const grouped: Record<string, number> = {};
    analyticsData.registrations.forEach((reg) => {
      const date = format(new Date(reg.created_at), 'MMM d');
      grouped[date] = (grouped[date] || 0) + 1;
    });
    
    return Object.entries(grouped).map(([date, count]) => ({
      date,
      registrations: count,
    }));
  }, [analyticsData]);

  const eventStatusData = React.useMemo(() => {
    if (!analyticsData?.events) return [];
    
    const statusCounts: Record<string, number> = {};
    analyticsData.events.forEach((event) => {
      statusCounts[event.status] = (statusCounts[event.status] || 0) + 1;
    });
    
    const colors: Record<string, string> = {
      DRAFT: 'hsl(var(--muted-foreground))',
      PUBLISHED: 'hsl(var(--primary))',
      ONGOING: 'hsl(var(--chart-2))',
      COMPLETED: 'hsl(var(--chart-3))',
      CANCELLED: 'hsl(var(--destructive))',
    };
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
      color: colors[status] || 'hsl(var(--muted))',
    }));
  }, [analyticsData]);

  const statsCards = [
    {
      title: 'Total Events',
      value: analyticsData?.events?.length || 0,
      icon: Calendar,
      trend: '+12%',
      description: 'Events created',
    },
    {
      title: 'Total Registrations',
      value: analyticsData?.registrations?.length || 0,
      icon: Users,
      trend: '+8%',
      description: 'Last 30 days',
    },
    {
      title: 'Active Workspaces',
      value: analyticsData?.workspaces?.filter((w) => w.status === 'ACTIVE').length || 0,
      icon: Activity,
      trend: '+5%',
      description: 'Currently active',
    },
    {
      title: 'Conversion Rate',
      value: '24%',
      icon: TrendingUp,
      trend: '+3%',
      description: 'Views to registration',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your events, registrations, and engagement metrics
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="text-success">{stat.trend}</span>
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="registrations" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Registrations
            </TabsTrigger>
            <TabsTrigger value="engagement" className="flex items-center gap-2">
              <MousePointerClick className="h-4 w-4" />
              Engagement
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Registration Trend</CardTitle>
                  <CardDescription>Last 30 days</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={registrationTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))' 
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="registrations" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary) / 0.2)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Events by Status</CardTitle>
                  <CardDescription>Distribution of event statuses</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={eventStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {eventStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Registrations Tab */}
          <TabsContent value="registrations">
            <Card>
              <CardHeader>
                <CardTitle>Registration Analytics</CardTitle>
                <CardDescription>Detailed breakdown of registrations</CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={registrationTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))' 
                      }} 
                    />
                    <Bar dataKey="registrations" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Engagement Tab */}
          <TabsContent value="engagement">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Session Duration</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4m 32s</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-success">+12%</span> from last week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Page Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2,456</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-success">+8%</span> from last week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                  <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3.2%</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-success">+0.4%</span> from last week
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Engagement Over Time</CardTitle>
                <CardDescription>User interactions and engagement metrics</CardDescription>
              </CardHeader>
              <CardContent className="text-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Detailed engagement analytics will be available as more data is collected</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AnalyticsPage;
