/**
 * MessageDeliveryAnalytics - Analytics dashboard for message delivery tracking
 * 
 * Provides organizers with insights into:
 * - Message delivery rates
 * - Read receipts
 * - Engagement metrics
 * - Channel activity over time
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  MessageSquare,
  Users,
  TrendingUp,
  Megaphone,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface MessageDeliveryAnalyticsProps {
  workspaceId: string;
}

interface ChannelStats {
  channelId: string;
  channelName: string;
  channelType: string;
  totalMessages: number;
  totalParticipants: number;
  messagesLast7Days: number;
  broadcastCount: number;
}

interface DailyActivity {
  date: string;
  messages: number;
  broadcasts: number;
  activeUsers: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export function MessageDeliveryAnalytics({ workspaceId }: MessageDeliveryAnalyticsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch channel statistics
  const { data: channelStats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['channel-stats', workspaceId],
    queryFn: async () => {
      const { data: channels, error: channelsError } = await supabase
        .from('workspace_channels')
        .select('id, name, type')
        .eq('workspace_id', workspaceId);

      if (channelsError) throw channelsError;

      const stats: ChannelStats[] = await Promise.all(
        (channels || []).map(async (channel) => {
          // Get total messages
          const { count: totalMessages } = await supabase
            .from('channel_messages')
            .select('*', { count: 'exact', head: true })
            .eq('channel_id', channel.id);

          // Get messages in last 7 days
          const sevenDaysAgo = subDays(new Date(), 7).toISOString();
          const { count: recentMessages } = await supabase
            .from('channel_messages')
            .select('*', { count: 'exact', head: true })
            .eq('channel_id', channel.id)
            .gte('created_at', sevenDaysAgo);

          // Get broadcast count
          const { count: broadcastCount } = await supabase
            .from('channel_messages')
            .select('*', { count: 'exact', head: true })
            .eq('channel_id', channel.id)
            .eq('message_type', 'broadcast');

          // Get participant count
          const { count: participantCount } = await supabase
            .from('channel_members')
            .select('*', { count: 'exact', head: true })
            .eq('channel_id', channel.id);

          return {
            channelId: channel.id,
            channelName: channel.name,
            channelType: channel.type || 'general',
            totalMessages: totalMessages || 0,
            totalParticipants: participantCount || 0,
            messagesLast7Days: recentMessages || 0,
            broadcastCount: broadcastCount || 0,
          };
        })
      );

      return stats;
    },
    enabled: !!workspaceId,
  });

  // Fetch daily activity for the last 14 days
  const { data: dailyActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['daily-activity', workspaceId],
    queryFn: async () => {
      const { data: channels } = await supabase
        .from('workspace_channels')
        .select('id')
        .eq('workspace_id', workspaceId);

      const channelIds = (channels || []).map(c => c.id);
      if (channelIds.length === 0) return [];

      const activity: DailyActivity[] = [];
      
      for (let i = 13; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dayStart = startOfDay(date).toISOString();
        const dayEnd = endOfDay(date).toISOString();

        const { count: messages } = await supabase
          .from('channel_messages')
          .select('*', { count: 'exact', head: true })
          .in('channel_id', channelIds)
          .gte('created_at', dayStart)
          .lte('created_at', dayEnd);

        const { count: broadcasts } = await supabase
          .from('channel_messages')
          .select('*', { count: 'exact', head: true })
          .in('channel_id', channelIds)
          .eq('message_type', 'broadcast')
          .gte('created_at', dayStart)
          .lte('created_at', dayEnd);

        const { data: uniqueSenders } = await supabase
          .from('channel_messages')
          .select('sender_id')
          .in('channel_id', channelIds)
          .gte('created_at', dayStart)
          .lte('created_at', dayEnd);

        const uniqueUsers = new Set(uniqueSenders?.map(m => m.sender_id) || []).size;

        activity.push({
          date: format(date, 'MMM d'),
          messages: messages || 0,
          broadcasts: broadcasts || 0,
          activeUsers: uniqueUsers,
        });
      }

      return activity;
    },
    enabled: !!workspaceId,
  });

  // Calculate totals
  const totals = channelStats?.reduce(
    (acc, stat) => ({
      totalMessages: acc.totalMessages + stat.totalMessages,
      totalParticipants: acc.totalParticipants + stat.totalParticipants,
      totalBroadcasts: acc.totalBroadcasts + stat.broadcastCount,
      recentMessages: acc.recentMessages + stat.messagesLast7Days,
    }),
    { totalMessages: 0, totalParticipants: 0, totalBroadcasts: 0, recentMessages: 0 }
  ) || { totalMessages: 0, totalParticipants: 0, totalBroadcasts: 0, recentMessages: 0 };

  // Channel type distribution
  const typeDistribution = channelStats?.reduce((acc, stat) => {
    const existing = acc.find(a => a.type === stat.channelType);
    if (existing) {
      existing.count += 1;
      existing.messages += stat.totalMessages;
    } else {
      acc.push({ type: stat.channelType, count: 1, messages: stat.totalMessages });
    }
    return acc;
  }, [] as { type: string; count: number; messages: number }[]) || [];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchStats();
    setIsRefreshing(false);
  };

  const isLoading = statsLoading || activityLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Message Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Track message delivery and engagement across channels
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Messages</p>
                    <p className="text-2xl font-bold">{totals.totalMessages.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Participants</p>
                    <p className="text-2xl font-bold">{totals.totalParticipants.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-chart-2/10 rounded-lg">
                    <Users className="h-5 w-5 text-chart-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Broadcasts Sent</p>
                    <p className="text-2xl font-bold">{totals.totalBroadcasts.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-chart-3/10 rounded-lg">
                    <Megaphone className="h-5 w-5 text-chart-3" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Last 7 Days</p>
                    <p className="text-2xl font-bold">{totals.recentMessages.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-chart-4/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-chart-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for different views */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="channels">By Channel</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Activity Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Message Activity (14 Days)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dailyActivity}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                            className="text-muted-foreground"
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }}
                            className="text-muted-foreground"
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))',
                              borderColor: 'hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="messages" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={2}
                            dot={{ fill: 'hsl(var(--primary))' }}
                            name="Messages"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="activeUsers" 
                            stroke="hsl(var(--chart-2))" 
                            strokeWidth={2}
                            dot={{ fill: 'hsl(var(--chart-2))' }}
                            name="Active Users"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Channel Type Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Channel Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={typeDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="messages"
                            nameKey="type"
                            label={({ type, percent }) => 
                              `${type} (${(percent * 100).toFixed(0)}%)`
                            }
                          >
                            {typeDistribution.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))',
                              borderColor: 'hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                            formatter={(value: number) => [value.toLocaleString(), 'Messages']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="channels">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Channel Performance</CardTitle>
                  <CardDescription>
                    Message volume and engagement by channel
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={channelStats} 
                        layout="vertical"
                        margin={{ left: 100 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" tick={{ fontSize: 12 }} />
                        <YAxis 
                          type="category" 
                          dataKey="channelName" 
                          tick={{ fontSize: 12 }}
                          width={90}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar 
                          dataKey="totalMessages" 
                          fill="hsl(var(--primary))" 
                          name="Total Messages"
                          radius={[0, 4, 4, 0]}
                        />
                        <Bar 
                          dataKey="messagesLast7Days" 
                          fill="hsl(var(--chart-2))" 
                          name="Last 7 Days"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Daily Activity Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {dailyActivity?.map((day) => (
                        <div 
                          key={day.date}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-sm font-medium w-16">{day.date}</div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4 text-primary" />
                                {day.messages} messages
                              </span>
                              <span className="flex items-center gap-1">
                                <Megaphone className="h-4 w-4 text-chart-3" />
                                {day.broadcasts} broadcasts
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4 text-chart-2" />
                                {day.activeUsers} active
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
