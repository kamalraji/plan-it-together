import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Megaphone, 
  BarChart3, 
  Settings, 
  Users, 
  Bell, 
  Send,
  Clock,
  TrendingUp,
  Hash,
  Shield,
  Plus
} from 'lucide-react';
import { useWorkspaceChannels, WorkspaceChannel } from '@/hooks/useWorkspaceChannels';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BroadcastComposerDialog } from './BroadcastComposerDialog';
import { ChannelCategoryManager } from './ChannelCategoryManager';
import { CommunicationAnalyticsPanel } from './CommunicationAnalyticsPanel';

interface UnifiedCommunicationHubProps {
  workspaceId: string;
  eventId?: string;
  onChannelSelect?: (channel: WorkspaceChannel) => void;
}

export function UnifiedCommunicationHub({ 
  workspaceId, 
  eventId,
  onChannelSelect 
}: UnifiedCommunicationHubProps) {
  const [activeTab, setActiveTab] = useState('channels');
  const [showBroadcastDialog, setShowBroadcastDialog] = useState(false);

  const { channels, createChannel } = useWorkspaceChannels(workspaceId);

  // Fetch broadcast statistics
  const { data: broadcastStats } = useQuery({
    queryKey: ['broadcast-stats', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_broadcasts')
        .select('id, status, delivery_stats, created_at')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      const total = data?.length || 0;
      const sent = data?.filter(b => b.status === 'sent').length || 0;
      const scheduled = data?.filter(b => b.status === 'scheduled').length || 0;
      const totalDelivered = data?.reduce((acc, b) => {
        const stats = b.delivery_stats as { delivered?: number } | null;
        return acc + (stats?.delivered || 0);
      }, 0) || 0;

      return { total, sent, scheduled, totalDelivered, recentBroadcasts: data || [] };
    },
    enabled: !!workspaceId,
  });

  // Fetch channel categories
  const { data: categories = [] } = useQuery({
    queryKey: ['channel-categories', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_channel_categories')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!workspaceId,
  });

  // Calculate channel stats
  const channelStats = {
    total: channels.length,
    announcement: channels.filter(c => c.type === 'announcement').length,
    general: channels.filter(c => c.type === 'general').length,
    private: channels.filter(c => c.type === 'private').length,
    participantChannels: channels.filter(c => (c as unknown as { is_participant_channel?: boolean }).is_participant_channel).length,
  };

  const handleCreateChannel = async () => {
    const name = prompt('Enter channel name:');
    if (name) {
      await createChannel({ workspaceId, name, type: 'general' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Hash className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{channelStats.total}</p>
                <p className="text-xs text-muted-foreground">Channels</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Megaphone className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{broadcastStats?.sent || 0}</p>
                <p className="text-xs text-muted-foreground">Broadcasts Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{channelStats.participantChannels}</p>
                <p className="text-xs text-muted-foreground">Participant Channels</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{broadcastStats?.totalDelivered || 0}</p>
                <p className="text-xs text-muted-foreground">Messages Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setShowBroadcastDialog(true)} className="gap-2">
          <Send className="h-4 w-4" />
          Send Broadcast
        </Button>
        <Button variant="outline" onClick={handleCreateChannel} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Channel
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="channels" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Channels</span>
          </TabsTrigger>
          <TabsTrigger value="broadcasts" className="gap-2">
            <Megaphone className="h-4 w-4" />
            <span className="hidden sm:inline">Broadcasts</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Channels Tab */}
        <TabsContent value="channels" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Channel Categories */}
            <div className="lg:col-span-2">
              <ChannelCategoryManager 
                workspaceId={workspaceId}
                channels={channels}
                categories={categories}
                onChannelSelect={onChannelSelect}
              />
            </div>

            {/* Channel Quick Stats */}
            <Card className="border-border/50 h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Channel Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Announcement</span>
                  <Badge variant="secondary">{channelStats.announcement}</Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">General</span>
                  <Badge variant="secondary">{channelStats.general}</Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Private</span>
                  <Badge variant="secondary">{channelStats.private}</Badge>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">For Participants</span>
                  <Badge className="bg-primary/10 text-primary">{channelStats.participantChannels}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Broadcasts Tab */}
        <TabsContent value="broadcasts" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Recent Broadcasts</CardTitle>
                      <CardDescription>Messages sent to participants</CardDescription>
                    </div>
                    <Button onClick={() => setShowBroadcastDialog(true)} size="sm">
                      <Send className="h-4 w-4 mr-2" />
                      New Broadcast
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {broadcastStats?.recentBroadcasts.length === 0 ? (
                    <div className="text-center py-8">
                      <Megaphone className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-sm text-muted-foreground mb-3">No broadcasts yet</p>
                      <Button variant="outline" size="sm" onClick={() => setShowBroadcastDialog(true)}>
                        Send First Broadcast
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {broadcastStats?.recentBroadcasts.map((broadcast) => {
                        const stats = broadcast.delivery_stats as { sent?: number; delivered?: number; read?: number } | null;
                        return (
                          <div 
                            key={broadcast.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-border/50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-amber-500/10">
                                <Megaphone className="h-4 w-4 text-amber-500" />
                              </div>
                              <div>
                                <Badge 
                                  variant={broadcast.status === 'sent' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {broadcast.status}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {broadcast.created_at ? new Date(broadcast.created_at).toLocaleDateString() : 'N/A'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right text-xs text-muted-foreground">
                              <p>{stats?.delivered || 0} delivered</p>
                              <p>{stats?.read || 0} read</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Scheduled Broadcasts */}
            <Card className="border-border/50 h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Scheduled
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-2xl font-bold">{broadcastStats?.scheduled || 0}</p>
                  <p className="text-xs text-muted-foreground">Pending broadcasts</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <CommunicationAnalyticsPanel workspaceId={workspaceId} channels={channels} />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>Configure how participants receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">Push Notifications</p>
                    <p className="text-xs text-muted-foreground">Send push for urgent broadcasts</p>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-500">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">Email Notifications</p>
                    <p className="text-xs text-muted-foreground">Send email for important updates</p>
                  </div>
                  <Badge variant="secondary">Disabled</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Moderation
                </CardTitle>
                <CardDescription>Manage channel moderation settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">Auto-Moderation</p>
                    <p className="text-xs text-muted-foreground">Filter inappropriate content</p>
                  </div>
                  <Badge variant="secondary">Off</Badge>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">Rate Limiting</p>
                    <p className="text-xs text-muted-foreground">Prevent message spam</p>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-500">Active</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Broadcast Dialog */}
      <BroadcastComposerDialog
        open={showBroadcastDialog}
        onOpenChange={setShowBroadcastDialog}
        workspaceId={workspaceId}
        eventId={eventId}
        channels={channels}
      />
    </div>
  );
}
