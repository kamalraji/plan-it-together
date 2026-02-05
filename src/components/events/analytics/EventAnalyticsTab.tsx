/**
 * EventAnalyticsTab
 * Industrial-standard event analytics dashboard with charts and metrics
 * 
 * Features:
 * - URL state for date range (deep-linkable)
 * - Responsive chart heights for mobile
 * - LiveRegion announcements for accessibility
 */

import React from 'react';
import { 
  Users, 
  CheckCircle, 
  DollarSign, 
  TrendingUp,
  Calendar,
  Clock,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEventRegistrationStats } from '@/hooks/useEventRegistrations';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryPresets } from '@/lib/query-config';
import { eventQueryKeys } from '@/lib/query-keys/events';
import { useUrlState } from '@/hooks/useUrlState';
import { LiveRegion, useLiveAnnouncement } from '@/components/accessibility/LiveRegion';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { format, subDays, eachDayOfInterval, startOfDay } from 'date-fns';

interface EventAnalyticsTabProps {
  eventId: string;
}

// Color palette for charts
const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

// Date range options
const DATE_RANGES = ['7d', '30d', '90d'] as const;
type DateRange = typeof DATE_RANGES[number];

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
};

const getDaysForRange = (range: DateRange): number => {
  switch (range) {
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
    default: return 30;
  }
};

export const EventAnalyticsTab: React.FC<EventAnalyticsTabProps> = ({ eventId }) => {
  // URL state for filters (deep-linkable)
  const [dateRange, setDateRange] = useUrlState<string>('range', '30d');
  const { message: announcement, announce } = useLiveAnnouncement();
  
  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useEventRegistrationStats(eventId);

  // Fetch registration timeline data
  const { data: timelineData, isLoading: timelineLoading } = useQuery({
    queryKey: eventQueryKeys.timeline(eventId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registrations')
        .select('created_at, status, total_amount')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by day based on selected range
      const days = getDaysForRange(dateRange as DateRange);
      const interval = eachDayOfInterval({
        start: subDays(new Date(), days - 1),
        end: new Date(),
      });

      const dailyData = interval.map(day => {
        const dayStart = startOfDay(day);
        const dayRegistrations = (data || []).filter(r => {
          const regDate = startOfDay(new Date(r.created_at));
          return regDate.getTime() === dayStart.getTime();
        });

        return {
          date: format(day, 'MMM dd'),
          registrations: dayRegistrations.length,
          revenue: dayRegistrations.reduce((sum, r) => sum + (r.total_amount || 0), 0),
        };
      });

      // Announce data update for screen readers
      announce(`Analytics updated: ${data?.length ?? 0} registrations in the selected period`);

      return dailyData;
    },
    staleTime: queryPresets.dynamic.staleTime,
  });

  // Fetch ticket tier breakdown
  const { data: tierBreakdown, isLoading: tierLoading } = useQuery({
    queryKey: eventQueryKeys.tierBreakdown(eventId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          ticket_tier_id,
          quantity,
          ticket_tiers (name)
        `)
        .eq('event_id', eventId)
        .neq('status', 'CANCELLED');

      if (error) throw error;

      // Group by tier
      const tierCounts: Record<string, { name: string; count: number }> = {};
      
      (data || []).forEach((r: any) => {
        const tierName = r.ticket_tiers?.name || 'General';
        if (!tierCounts[tierName]) {
          tierCounts[tierName] = { name: tierName, count: 0 };
        }
        tierCounts[tierName].count += r.quantity || 1;
      });

      return Object.values(tierCounts);
    },
    staleTime: queryPresets.dynamic.staleTime,
  });

  // Fetch attendance data
  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: eventQueryKeys.attendanceHourly(eventId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('check_in_time')
        .eq('event_id', eventId);

      if (error) throw error;

      // Group by hour
      const hourlyData: Record<string, number> = {};
      
      (data || []).forEach(r => {
        const hour = format(new Date(r.check_in_time), 'HH:00');
        hourlyData[hour] = (hourlyData[hour] || 0) + 1;
      });

      return Object.entries(hourlyData)
        .map(([hour, count]) => ({ hour, checkIns: count }))
        .sort((a, b) => a.hour.localeCompare(b.hour));
    },
    staleTime: queryPresets.dynamic.staleTime,
  });

  const isLoading = statsLoading || timelineLoading || tierLoading || attendanceLoading;

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  const checkInRate = stats && stats.confirmed > 0 
    ? Math.round((stats.checkedIn / stats.confirmed) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Accessibility: Live region for dynamic updates */}
      <LiveRegion message={announcement} priority="polite" />

      {/* Date Range Filter - URL preserved for deep linking */}
      <div className="flex justify-end">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-40" aria-label="Select date range">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            {DATE_RANGES.map((range) => (
              <SelectItem key={range} value={range}>
                {DATE_RANGE_LABELS[range]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Registrations"
          value={stats?.total ?? 0}
          icon={Users}
          trend={12}
          trendLabel="vs last event"
        />
        <MetricCard
          title="Confirmed"
          value={stats?.confirmed ?? 0}
          icon={CheckCircle}
          subtitle={`${stats?.conversionRate?.toFixed(1) ?? 0}% conversion`}
        />
        <MetricCard
          title="Total Revenue"
          value={`$${(stats?.totalRevenue ?? 0).toLocaleString()}`}
          icon={DollarSign}
          subtitle={`Avg: $${(stats?.averageTicketValue ?? 0).toFixed(2)}`}
        />
        <MetricCard
          title="Check-in Rate"
          value={`${checkInRate}%`}
          icon={TrendingUp}
          subtitle={`${stats?.checkedIn ?? 0} of ${stats?.confirmed ?? 0}`}
        />
      </div>

      {/* Charts Row - Responsive heights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Registration Timeline
            </CardTitle>
            <CardDescription>Daily registrations over {DATE_RANGE_LABELS[dateRange as DateRange]?.toLowerCase() || 'the selected period'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="registrations"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Ticket Tier Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Ticket Distribution
            </CardTitle>
            <CardDescription>Breakdown by ticket tier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] sm:h-[300px]">
              {tierBreakdown && tierBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={tierBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="name"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {tierBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPie>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No ticket data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Check-in Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Check-in Pattern
            </CardTitle>
            <CardDescription>Hourly check-in distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] sm:h-[300px]">
              {attendanceData && attendanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="hour" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar 
                      dataKey="checkIns" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No check-in data yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Registration Funnel
            </CardTitle>
            <CardDescription>Conversion through registration stages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <FunnelStage 
                label="Total Registrations" 
                value={stats?.total ?? 0} 
                percentage={100}
              />
              <FunnelStage 
                label="Confirmed" 
                value={stats?.confirmed ?? 0} 
                percentage={stats?.total ? Math.round((stats.confirmed / stats.total) * 100) : 0}
              />
              <FunnelStage 
                label="Checked In" 
                value={stats?.checkedIn ?? 0} 
                percentage={stats?.confirmed ? Math.round((stats.checkedIn / stats.confirmed) * 100) : 0}
              />
              
              <div className="pt-4 border-t border-border space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pending</span>
                  <span className="font-medium">{stats?.pending ?? 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Waitlisted</span>
                  <span className="font-medium">{stats?.waitlisted ?? 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cancelled</span>
                  <span className="font-medium text-destructive">{stats?.cancelled ?? 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: number;
  trendLabel?: string;
  subtitle?: string;
}> = ({ title, value, icon: Icon, trend, trendLabel, subtitle }) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div className="flex items-center mt-2 text-xs">
              {trend >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-success mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-destructive mr-1" />
              )}
              <span className={trend >= 0 ? 'text-success' : 'text-destructive'}>
                {Math.abs(trend)}%
              </span>
              {trendLabel && (
                <span className="text-muted-foreground ml-1">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Funnel Stage Component
const FunnelStage: React.FC<{
  label: string;
  value: number;
  percentage: number;
}> = ({ label, value, percentage }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-sm">
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground">{value} ({percentage}%)</span>
    </div>
    <Progress value={percentage} className="h-2" />
  </div>
);

// Loading Skeleton
const AnalyticsSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(2)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] sm:h-[300px] w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default EventAnalyticsTab;
