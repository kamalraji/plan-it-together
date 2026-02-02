import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  MessageSquare, 
  Users, 
  TrendingUp,
  Clock,
  Hash
} from 'lucide-react';
import { WorkspaceChannel } from '@/hooks/useWorkspaceChannels';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CommunicationAnalyticsPanelProps {
  workspaceId: string;
  channels: WorkspaceChannel[];
}

export function CommunicationAnalyticsPanel({
  workspaceId,
  channels,
}: CommunicationAnalyticsPanelProps) {
  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['channel-analytics', workspaceId],
    queryFn: async () => {
      // Get channel IDs
      const channelIds = channels.map(c => c.id);
      
      if (channelIds.length === 0) {
        return {
          totalMessages: 0,
          activeChannels: 0,
          avgMessagesPerChannel: 0,
          topChannels: [],
        };
      }

      // Get message counts per channel
      const { data: messageCounts, error } = await supabase
        .from('channel_messages')
        .select('channel_id')
        .in('channel_id', channelIds);

      if (error) throw error;

      // Count messages per channel
      const countByChannel: Record<string, number> = {};
      messageCounts?.forEach(msg => {
        countByChannel[msg.channel_id] = (countByChannel[msg.channel_id] || 0) + 1;
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

      return {
        totalMessages,
        activeChannels,
        avgMessagesPerChannel,
        topChannels,
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics?.totalMessages || 0}</p>
                <p className="text-xs text-muted-foreground">Total Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Hash className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics?.activeChannels || 0}</p>
                <p className="text-xs text-muted-foreground">Active Channels</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics?.avgMessagesPerChannel || 0}</p>
                <p className="text-xs text-muted-foreground">Avg per Channel</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Users className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{channels.length}</p>
                <p className="text-xs text-muted-foreground">Total Channels</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Most Active Channels
            </CardTitle>
            <CardDescription>Channels with the highest message count</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.topChannels.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No messages yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {analytics?.topChannels.map((channel, index) => (
                  <div 
                    key={channel.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border/50"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium text-sm">{channel.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{channel.type}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {channel.messageCount} msgs
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Timeline Placeholder */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Activity Timeline
            </CardTitle>
            <CardDescription>Message activity over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-sm text-muted-foreground">
                Detailed analytics coming soon
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Track message trends and peak activity hours
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Breakdown by Type */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Channel Breakdown</CardTitle>
          <CardDescription>Distribution of channels by type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['announcement', 'general', 'private', 'task'].map(type => {
              const count = channels.filter(c => c.type === type).length;
              const percentage = channels.length > 0 
                ? Math.round((count / channels.length) * 100) 
                : 0;

              return (
                <div 
                  key={type}
                  className="p-4 rounded-lg border border-border/50 text-center"
                >
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm capitalize text-muted-foreground">{type}</p>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {percentage}%
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
