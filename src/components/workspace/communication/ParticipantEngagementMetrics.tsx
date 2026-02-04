import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Activity,
  Clock,
  UserCheck,
  Zap,
  Eye,
  ThumbsUp,
  Reply
} from 'lucide-react';
import { format, subDays, eachDayOfInterval, startOfDay } from 'date-fns';

interface ParticipantEngagementMetricsProps {
  workspaceId: string;
  eventId?: string;
}

interface EngagementStats {
  totalParticipants: number;
  activeParticipants: number;
  engagementRate: number;
  totalMessages: number;
  totalReactions: number;
  avgResponseTime: number;
  peakHour: number;
  topChannels: { name: string; messages: number }[];
  dailyActivity: { date: string; messages: number; activeUsers: number }[];
  hourlyDistribution: { hour: number; messages: number }[];
}

const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  color = 'primary'
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string;
  icon: React.ElementType;
  trend?: number;
  color?: 'primary' | 'green' | 'amber' | 'blue';
}) => {
  const colorClasses = {
    primary: 'text-primary bg-primary/10',
    green: 'text-green-600 bg-green-500/10',
    amber: 'text-amber-600 bg-amber-500/10',
    blue: 'text-blue-600 bg-blue-500/10',
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-2.5 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-3">
            <TrendingUp className={`h-3.5 w-3.5 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            <span className={`text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
            <span className="text-xs text-muted-foreground">vs last week</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export function ParticipantEngagementMetrics({ workspaceId, eventId }: ParticipantEngagementMetricsProps) {
  // Fetch engagement data
  const { data: stats, isLoading } = useQuery({
    queryKey: ['engagement-metrics', workspaceId, eventId],
    queryFn: async (): Promise<EngagementStats> => {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      
      // Fetch channels for this workspace
      const { data: channels } = await supabase
        .from('workspace_channels')
        .select('id, name')
        .eq('workspace_id', workspaceId);

      const channelIds = channels?.map(c => c.id) || [];
      
      if (channelIds.length === 0) {
        return {
          totalParticipants: 0,
          activeParticipants: 0,
          engagementRate: 0,
          totalMessages: 0,
          totalReactions: 0,
          avgResponseTime: 0,
          peakHour: 12,
          topChannels: [],
          dailyActivity: [],
          hourlyDistribution: [],
        };
      }

      // Fetch messages
      const { data: messages } = await supabase
        .from('channel_messages')
        .select('id, sender_id, channel_id, created_at')
        .in('channel_id', channelIds)
        .gte('created_at', sevenDaysAgo);

      // Fetch channel members (participants)
      const { data: members } = await supabase
        .from('channel_members')
        .select('user_id')
        .in('channel_id', channelIds);

      // Fetch reactions
      const messageIds = messages?.map(m => m.id) || [];
      const { data: reactions } = messageIds.length > 0 ? await supabase
        .from('message_reactions')
        .select('id')
        .in('message_id', messageIds) : { data: [] };

      // Calculate stats
      const uniqueParticipants = new Set(members?.map(m => m.user_id) || []);
      const activeSenders = new Set(messages?.map(m => m.sender_id) || []);
      
      // Messages per channel
      const channelMessageCounts: Record<string, number> = {};
      messages?.forEach(m => {
        channelMessageCounts[m.channel_id] = (channelMessageCounts[m.channel_id] || 0) + 1;
      });

      const topChannels = channels?.map(c => ({
        name: c.name,
        messages: channelMessageCounts[c.id] || 0,
      })).sort((a, b) => b.messages - a.messages).slice(0, 5) || [];

      // Daily activity
      const days = eachDayOfInterval({
        start: subDays(new Date(), 6),
        end: new Date(),
      });

      const dailyActivity = days.map(day => {
        const dayStart = startOfDay(day);
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        
        const dayMessages = messages?.filter(m => {
          if (!m.created_at) return false;
          const msgDate = new Date(m.created_at);
          return msgDate >= dayStart && msgDate < dayEnd;
        }) || [];

        const uniqueUsers = new Set(dayMessages.map(m => m.sender_id));

        return {
          date: format(day, 'EEE'),
          messages: dayMessages.length,
          activeUsers: uniqueUsers.size,
        };
      });

      // Hourly distribution
      const hourCounts: Record<number, number> = {};
      messages?.forEach(m => {
        if (!m.created_at) return;
        const hour = new Date(m.created_at).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });

      const hourlyDistribution = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        messages: hourCounts[i] || 0,
      }));

      const peakHourEntry = Object.entries(hourCounts).sort(([, a], [, b]) => b - a)[0];
      const peakHour = peakHourEntry ? parseInt(peakHourEntry[0]) : 12;

      const totalParticipants = uniqueParticipants.size;
      const activeParticipants = activeSenders.size;

      return {
        totalParticipants,
        activeParticipants,
        engagementRate: totalParticipants > 0 
          ? Math.round((activeParticipants / totalParticipants) * 100) 
          : 0,
        totalMessages: messages?.length || 0,
        totalReactions: reactions?.length || 0,
        avgResponseTime: 5, // Placeholder - would need thread analysis
        peakHour,
        topChannels,
        dailyActivity,
        hourlyDistribution,
      };
    },
    enabled: !!workspaceId,
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            Loading engagement metrics...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Participants"
          value={stats.totalParticipants}
          subtitle="Across all channels"
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Active This Week"
          value={stats.activeParticipants}
          subtitle={`${stats.engagementRate}% engagement`}
          icon={UserCheck}
          color="green"
        />
        <StatCard
          title="Messages"
          value={stats.totalMessages}
          subtitle="Last 7 days"
          icon={MessageSquare}
          color="blue"
        />
        <StatCard
          title="Peak Activity"
          value={`${stats.peakHour}:00`}
          subtitle="Most active hour"
          icon={Zap}
          color="amber"
        />
      </div>

      {/* Engagement Rate Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Engagement Rate
          </CardTitle>
          <CardDescription>
            Percentage of participants who posted at least one message
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {stats.activeParticipants} of {stats.totalParticipants} participants active
              </span>
              <span className="font-medium">{stats.engagementRate}%</span>
            </div>
            <Progress value={stats.engagementRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily Activity</CardTitle>
            <CardDescription>Messages and active users over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="messages"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                    name="Messages"
                  />
                  <Area
                    type="monotone"
                    dataKey="activeUsers"
                    stroke="hsl(var(--chart-2))"
                    fill="hsl(var(--chart-2))"
                    fillOpacity={0.3}
                    name="Active Users"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Hourly Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity by Hour</CardTitle>
            <CardDescription>When participants are most active</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.hourlyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="hour" 
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(h) => `${h}h`}
                  />
                  <YAxis 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    labelFormatter={(h) => `${h}:00 - ${h}:59`}
                  />
                  <Bar 
                    dataKey="messages" 
                    fill="hsl(var(--primary))"
                    radius={[2, 2, 0, 0]}
                    name="Messages"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Most Active Channels
          </CardTitle>
          <CardDescription>Channels with the highest message volume</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.topChannels.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No channel activity yet
            </p>
          ) : (
            <div className="space-y-3">
              {stats.topChannels.map((channel, index) => {
                const maxMessages = stats.topChannels[0]?.messages || 1;
                const percentage = (channel.messages / maxMessages) * 100;
                
                return (
                  <div key={channel.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <span className="font-medium">#{channel.name}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {channel.messages} messages
                      </span>
                    </div>
                    <Progress value={percentage} className="h-1.5" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Quick Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <ThumbsUp className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{stats.totalReactions}</p>
                <p className="text-xs text-muted-foreground">Total reactions</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Reply className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">~{stats.avgResponseTime}min</p>
                <p className="text-xs text-muted-foreground">Avg response time</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{stats.topChannels[0]?.name || 'N/A'}</p>
                <p className="text-xs text-muted-foreground">Most active channel</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
