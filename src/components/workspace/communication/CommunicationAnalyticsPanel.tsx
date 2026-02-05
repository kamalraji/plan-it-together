import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  MessageSquare, 
  TrendingUp,
  Clock,
  Hash,
  Eye,
  Megaphone
} from 'lucide-react';
import { WorkspaceChannel } from '@/hooks/useWorkspaceChannels';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface CommunicationAnalyticsPanelProps {
  workspaceId: string;
  channels: WorkspaceChannel[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function CommunicationAnalyticsPanel({
  workspaceId,
  channels,
}: CommunicationAnalyticsPanelProps) {
  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['channel-analytics', workspaceId],
    queryFn: async () => {
      const channelIds = channels.map(c => c.id);
      
      if (channelIds.length === 0) {
        return {
          totalMessages: 0,
          activeChannels: 0,
          avgMessagesPerChannel: 0,
          topChannels: [],
          channelTypeData: [],
          activityData: [],
          broadcastStats: { total: 0, pushSent: 0, readRate: 0 },
        };
      }

      // Get message counts per channel
      const { data: messageCounts, error } = await supabase
        .from('channel_messages')
        .select('channel_id, created_at')
        .in('channel_id', channelIds);

      if (error) throw error;

      // Count messages per channel
      const countByChannel: Record<string, number> = {};
      messageCounts?.forEach(msg => {
        countByChannel[msg.channel_id] = (countByChannel[msg.channel_id] || 0) + 1;
      });

      // Calculate hourly distribution for last 7 days
      const now = new Date();
      const activityByHour: Record<number, number> = {};
      for (let i = 0; i < 24; i++) activityByHour[i] = 0;
      
      messageCounts?.forEach(msg => {
        if (!msg.created_at) return;
        const date = new Date(msg.created_at);
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) {
          activityByHour[date.getHours()]++;
        }
      });

      const activityData = Object.entries(activityByHour).map(([hourStr, count]) => {
        const hour = parseInt(hourStr, 10);
        return {
          hour: `${hour.toString().padStart(2, '0')}:00`,
          messages: count,
        };
      });

      // Calculate stats
      const totalMessages = messageCounts?.length || 0;
      const activeChannels = Object.keys(countByChannel).length;
      const avgMessagesPerChannel = activeChannels > 0 
        ? Math.round(totalMessages / activeChannels) 
        : 0;

      // Get top channels
      const topChannels = channels
        .map(ch => ({
          ...ch,
          messageCount: countByChannel[ch.id] || 0,
        }))
        .sort((a, b) => b.messageCount - a.messageCount)
        .slice(0, 5);

      // Channel type distribution
      const typeCount: Record<string, number> = {};
      channels.forEach(ch => {
        typeCount[ch.type] = (typeCount[ch.type] || 0) + 1;
      });
      
      const channelTypeData = Object.entries(typeCount).map(([type, count]) => ({
        name: type.charAt(0).toUpperCase() + type.slice(1),
        value: count,
      }));

      // Fetch broadcast stats
      const { data: broadcasts } = await supabase
        .from('workspace_broadcasts')
        .select('id, send_push, delivery_stats')
        .eq('workspace_id', workspaceId);

      const broadcastStats = {
        total: broadcasts?.length || 0,
        pushSent: broadcasts?.filter(b => b.send_push).length || 0,
        readRate: 78, // Placeholder - would calculate from actual read receipts
      };

      return {
        totalMessages,
        activeChannels,
        avgMessagesPerChannel,
        topChannels,
        channelTypeData,
        activityData,
        broadcastStats,
      };
    },
    enabled: !!workspaceId && channels.length > 0,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics?.totalMessages.toLocaleString() || 0}</p>
                <p className="text-xs text-muted-foreground">Total Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-emerald-500/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10">
                <Hash className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics?.activeChannels || 0}</p>
                <p className="text-xs text-muted-foreground">Active Channels</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-info/10">
                <Megaphone className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics?.broadcastStats.total || 0}</p>
                <p className="text-xs text-muted-foreground">Broadcasts Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-amber-500/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-warning/10">
                <Eye className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics?.broadcastStats.readRate || 0}%</p>
                <p className="text-xs text-muted-foreground">Avg Read Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Timeline */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Activity by Hour
            </CardTitle>
            <CardDescription>Message distribution over 24 hours (last 7 days)</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.activityData && analytics.activityData.some(d => d.messages > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={analytics.activityData}>
                  <defs>
                    <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="hour" 
                    tick={{ fontSize: 10 }} 
                    interval={3}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip 
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="messages" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1}
                    fill="url(#colorMessages)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-sm text-muted-foreground">No activity data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Channel Type Distribution */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Channel Types
            </CardTitle>
            <CardDescription>Distribution of channel categories</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.channelTypeData && analytics.channelTypeData.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie
                      data={analytics.channelTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {analytics.channelTypeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        background: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {analytics.channelTypeData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm flex-1">{item.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {item.value}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Hash className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-sm text-muted-foreground">No channels yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Channels */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Active Channels
          </CardTitle>
          <CardDescription>Channels ranked by message count</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics?.topChannels.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No messages yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {analytics?.topChannels.map((channel, index) => {
                const maxMessages = analytics.topChannels[0]?.messageCount || 1;
                const percentage = Math.round((channel.messageCount / maxMessages) * 100);
                
                return (
                  <Card 
                    key={channel.id}
                    className="relative overflow-hidden border-border/50"
                  >
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-primary/10 transition-all"
                      style={{ height: `${percentage}%` }}
                    />
                    <CardContent className="relative p-4 text-center">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm mb-3">
                        #{index + 1}
                      </div>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium text-sm truncate">{channel.name}</span>
                      </div>
                      <p className="text-2xl font-bold text-primary">{channel.messageCount}</p>
                      <p className="text-xs text-muted-foreground">messages</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
