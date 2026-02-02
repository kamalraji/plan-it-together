import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  WorkspaceChannel,
  BroadcastMessageDTO,
  CreateChannelDTO,
  WorkspaceRole,
  UserRole,
  TeamMember,
  WorkspaceRoleScope,
} from '../../types';
import { ChannelList } from './communication/ChannelList';
import { EnhancedMessageThread } from './communication/EnhancedMessageThread';
import { BroadcastComposer } from './communication/BroadcastComposer';
import { MessageSearch } from './communication/MessageSearch';
import { ParticipantChannelManager } from './communication/ParticipantChannelManager';
import { ScheduledMessageComposer } from './communication/ScheduledMessageComposer';
import { MessageDeliveryAnalytics } from './communication/MessageDeliveryAnalytics';
import { ChannelModerationTools } from './communication/ChannelModerationTools';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * WorkspaceCommunication Component (Refactored)
 *
 * Now uses Supabase directly instead of broken API calls.
 * Features real-time message updates via EnhancedMessageThread.
 */
interface WorkspaceCommunicationProps {
  workspaceId: string;
  teamMembers?: TeamMember[];
  roleScope?: WorkspaceRoleScope;
}

export function WorkspaceCommunication({
  workspaceId,
  teamMembers,
  roleScope,
}: WorkspaceCommunicationProps) {
  const [activeTab, setActiveTab] = useState<'channels' | 'broadcast' | 'search' | 'participants' | 'scheduled' | 'analytics' | 'moderation'>('channels');
  const [selectedChannel, setSelectedChannel] = useState<WorkspaceChannel | null>(null);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const isGlobalManager =
    !!user && (user.role === UserRole.ORGANIZER || user.role === UserRole.SUPER_ADMIN);

  const currentMember = teamMembers?.find((member) => member.userId === user?.id);
  const managerWorkspaceRoles: WorkspaceRole[] = [
    WorkspaceRole.WORKSPACE_OWNER,
    WorkspaceRole.OPERATIONS_MANAGER,
    WorkspaceRole.GROWTH_MANAGER,
    WorkspaceRole.CONTENT_MANAGER,
    WorkspaceRole.TECH_FINANCE_MANAGER,
    WorkspaceRole.VOLUNTEERS_MANAGER,
    WorkspaceRole.EVENT_COORDINATOR,
  ];
  const isWorkspaceManager = currentMember
    ? managerWorkspaceRoles.includes(currentMember.role as WorkspaceRole)
    : false;

  const canPostMessages = isGlobalManager || isWorkspaceManager || !!currentMember;
  const canBroadcast = isGlobalManager || isWorkspaceManager;

  // Fetch workspace channels from Supabase directly
  const { data: channels, isLoading: channelsLoading } = useQuery({
    queryKey: ['workspace-channels', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_channels')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Transform to WorkspaceChannel type
      return (data || []).map((ch): WorkspaceChannel => ({
        id: ch.id,
        workspaceId: ch.workspace_id,
        name: ch.name,
        description: ch.description || undefined,
        type: (ch.type || 'GENERAL') as WorkspaceChannel['type'],
        isPrivate: ch.is_private || false,
        members: [], // Channel members fetched separately if needed
        createdAt: ch.created_at || new Date().toISOString(),
        updatedAt: ch.updated_at || new Date().toISOString(),
        roleScope: (ch.metadata as any)?.role_scope as WorkspaceRoleScope | undefined,
      }));
    },
  });

  const scopedChannels = (channels || []).filter((channel) => {
    if (!roleScope || roleScope === 'ALL') return true;
    const chScope = channel.roleScope;
    if (!chScope) return false;
    return chScope === roleScope;
  });

  // Fetch workspace for broadcast composer
  const { data: workspace } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Create channel mutation using Supabase
  const createChannelMutation = useMutation({
    mutationFn: async (channelData: CreateChannelDTO) => {
      const { data, error } = await supabase
        .from('workspace_channels')
        .insert({
          workspace_id: workspaceId,
          name: channelData.name,
          description: channelData.description,
          type: channelData.type || 'GENERAL',
          is_private: channelData.isPrivate || false,
          metadata: channelData.roleScope ? { role_scope: channelData.roleScope } : {},
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-channels', workspaceId] });
      setShowCreateChannel(false);
      toast({
        title: 'Channel created',
        description: 'Your new channel is ready for messages.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to create channel',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Send broadcast message mutation
  const sendBroadcastMutation = useMutation({
    mutationFn: async (broadcastData: BroadcastMessageDTO & { isPriority?: boolean }) => {
      // Get all channels or filter by target roles
      const channelsToSend = scopedChannels.filter(ch => 
        !broadcastData.targetRoles || 
        broadcastData.targetRoles.length === 0 ||
        (ch.roleScope && broadcastData.targetRoles.includes(ch.roleScope as any))
      );

      // Insert broadcast message to each channel
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const messages = await Promise.all(
        channelsToSend.map(async (channel) => {
          const { data, error } = await supabase
            .from('channel_messages')
            .insert({
              channel_id: channel.id,
              sender_id: userData.user!.id,
              sender_name: user?.name || user?.email || 'Broadcast',
              content: broadcastData.content,
              message_type: 'broadcast',
            })
            .select()
            .single();

          if (error) throw error;
          return data;
        })
      );

      // Log activity
      await supabase.from('workspace_activities').insert({
        workspace_id: workspaceId,
        type: 'communication',
        title: 'Broadcast sent',
        description: broadcastData.content?.slice(0, 140) || 'A broadcast was sent.',
      });

      return messages;
    },
    onSuccess: () => {
      toast({
        title: 'Broadcast sent',
        description: `Message sent to ${scopedChannels.length} channel(s).`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to send broadcast',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Auto-select general channel if available
  useEffect(() => {
    if (scopedChannels && scopedChannels.length > 0 && !selectedChannel) {
      const generalChannel =
        scopedChannels.find((ch) => ch.name === 'general') || scopedChannels[0];
      setSelectedChannel(generalChannel);
    }
  }, [scopedChannels, selectedChannel]);

  const handleChannelSelect = (channel: WorkspaceChannel) => {
    setSelectedChannel(channel);
    setActiveTab('channels');
  };

  const handleSendBroadcast = async (
    broadcastData: BroadcastMessageDTO & { isPriority?: boolean },
  ) => {
    await sendBroadcastMutation.mutateAsync(broadcastData);
  };

  const handleCreateChannel = async (channelData: CreateChannelDTO) => {
    await createChannelMutation.mutateAsync({
      ...channelData,
      roleScope: roleScope === 'ALL' ? undefined : roleScope,
    });
  };

  if (channelsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border">
      {/* Header with tabs */}
      <div className="border-b border-border">
        <div className="px-6 py-4">
          <h2 className="text-xl font-semibold text-foreground mb-4">Team Communication</h2>
          {!canPostMessages && (
            <div className="mb-4 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 px-3 py-2">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                <strong>Read-only access:</strong> You can view messages but cannot post or broadcast.
                Contact a manager for posting permissions.
              </p>
            </div>
          )}
          
          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="mb-4">
              <TabsTrigger value="channels">Channels</TabsTrigger>
              <TabsTrigger value="broadcast" disabled={!canBroadcast}>Broadcast</TabsTrigger>
              <TabsTrigger value="search">Search</TabsTrigger>
              {canBroadcast && (
                <>
                  <TabsTrigger value="participants">Participants</TabsTrigger>
                  <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="moderation">Moderation</TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="channels">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
                {/* Channel List */}
                <div className="lg:col-span-1">
                  <ChannelList
                    channels={scopedChannels}
                    selectedChannel={selectedChannel}
                    onChannelSelect={handleChannelSelect}
                    onCreateChannel={() => setShowCreateChannel(true)}
                    showCreateChannel={showCreateChannel}
                    onCreateChannelSubmit={handleCreateChannel}
                    onCancelCreate={() => setShowCreateChannel(false)}
                    isCreating={createChannelMutation.isPending}
                  />
                </div>

                {/* Enhanced Message Thread with real-time */}
                <div className="lg:col-span-2">
                  {selectedChannel ? (
                    <EnhancedMessageThread
                      channel={selectedChannel}
                      isSending={false}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-muted/20 rounded-lg">
                      <div className="text-center">
                        <p className="text-muted-foreground">Select a channel to start messaging</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="broadcast">
              {canBroadcast && (
                <BroadcastComposer
                  workspace={workspace}
                  onSendBroadcast={handleSendBroadcast}
                  isSending={sendBroadcastMutation.isPending}
                />
              )}
            </TabsContent>

            <TabsContent value="search">
              <MessageSearch workspaceId={workspaceId} channels={scopedChannels} />
            </TabsContent>

            <TabsContent value="participants">
              {canBroadcast && workspace?.event_id && selectedChannel && (
                <ParticipantChannelManager
                  eventId={workspace.event_id}
                  workspaceId={workspaceId}
                />
              )}
              {canBroadcast && !selectedChannel && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Select a channel from the Channels tab to manage participants</p>
                </div>
              )}
              {canBroadcast && !workspace?.event_id && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Participant management requires an event-linked workspace</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="scheduled">
              {canBroadcast && selectedChannel && (
                <ScheduledMessageComposer
                  channelId={selectedChannel.id}
                  channelName={selectedChannel.name}
                />
              )}
              {canBroadcast && !selectedChannel && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Select a channel from the Channels tab to schedule messages</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="analytics">
              {canBroadcast && (
                <MessageDeliveryAnalytics workspaceId={workspaceId} />
              )}
            </TabsContent>

            <TabsContent value="moderation">
              {canBroadcast && (
                <ChannelModerationTools
                  workspaceId={workspaceId}
                  channelId={selectedChannel?.id}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
