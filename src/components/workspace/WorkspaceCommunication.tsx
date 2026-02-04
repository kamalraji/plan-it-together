import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  WorkspaceChannel,
  SendMessageDTO,
  BroadcastMessageDTO,
  CreateChannelDTO,
  WorkspaceRole,
  UserRole,
  TeamMember,
  WorkspaceRoleScope,
} from '../../types';
import { ChannelList } from './communication/ChannelList';
import { MessageThread } from './communication/MessageThread';
import { BroadcastComposer } from './communication/BroadcastComposer';
import { MessageSearch } from './communication/MessageSearch';
import { supabase } from '@/integrations/supabase/client';
import api from '../../lib/api';
import { useAuth } from '@/hooks/useAuth';

/**
 * WorkspaceCommunication Component
 *
 * Provides comprehensive team communication features for workspace collaboration:
 * - Channel-based messaging with different channel types (General, Announcements, Role-based, Task-specific)
 * - Broadcast messaging to all members or specific role groups
 * - Message search across all workspace channels
 * - Priority messaging with immediate notifications
 * - Integration with task management for task-specific discussions
 *
 * Requirements validated: 7.1, 7.2, 7.3, 7.4, 7.5
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
  const [activeTab, setActiveTab] = useState<'channels' | 'broadcast' | 'search'>('channels');
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

  // Fetch workspace channels
  const { data: channels, isLoading: channelsLoading } = useQuery({
    queryKey: ['workspace-channels', workspaceId],
    queryFn: async () => {
      const response = await api.get(`/workspaces/${workspaceId}/channels`);
      return response.data.channels as WorkspaceChannel[];
    },
  });

  const scopedChannels = (channels || []).filter((channel) => {
    if (!roleScope || roleScope === 'ALL') return true;
    const chScope = channel.roleScope as WorkspaceRoleScope | undefined;
    if (!chScope) return false;
    return chScope === roleScope;
  });

  // Fetch workspace details for team member info
  const { data: workspace } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: async () => {
      const response = await api.get(`/workspaces/${workspaceId}`);
      return response.data.workspace;
    },
  });

  // Create channel mutation
  const createChannelMutation = useMutation({
    mutationFn: async (channelData: CreateChannelDTO) => {
      const response = await api.post(`/workspaces/${workspaceId}/channels`, channelData);
      return response.data.channel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-channels', workspaceId] });
      setShowCreateChannel(false);
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({
      channelId,
      messageData,
    }: {
      channelId: string;
      messageData: SendMessageDTO & { isPriority?: boolean };
    }) => {
      const response = await api.post(`/workspaces/channels/${channelId}/messages`, messageData);

      // Log workspace activity (non-blocking)
      await supabase.from('workspace_activities').insert({
        workspace_id: workspaceId,
        type: 'communication',
        title: 'New channel message',
        description:
          messageData.content?.slice(0, 140) || 'A new message was posted in a channel.',
        metadata: { channelId },
      });

      return response.data.message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-messages', selectedChannel?.id] });
    },
  });

  // Send broadcast message mutation
  const sendBroadcastMutation = useMutation({
    mutationFn: async (broadcastData: BroadcastMessageDTO & { isPriority?: boolean }) => {
      const response = await api.post(`/workspaces/${workspaceId}/broadcast`, broadcastData);

      // Log workspace activity (non-blocking)
      await supabase.from('workspace_activities').insert({
        workspace_id: workspaceId,
        type: 'communication',
        title: 'Broadcast sent to workspace',
        description:
          broadcastData.content?.slice(0, 140) || 'A broadcast was sent to the workspace.',
      });

      return response.data.messages;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-channels', workspaceId] });
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

  const handleSendMessage = async (messageData: SendMessageDTO & { isPriority?: boolean }) => {
    if (!selectedChannel) return;

    await sendMessageMutation.mutateAsync({
      channelId: selectedChannel.id,
      messageData,
    });
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
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
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'channels', label: 'Channels' },
              { key: 'broadcast', label: 'Broadcast', disabled: !canBroadcast },
              { key: 'search', label: 'Search' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => !tab.disabled && setActiveTab(tab.key as any)}
                disabled={tab.disabled}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === tab.key
                    ? 'border-primary text-primary'
                    : tab.disabled
                      ? 'border-transparent text-muted-foreground/40 cursor-not-allowed'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'channels' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
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

            {/* Message Thread */}
            <div className="lg:col-span-2">
              {selectedChannel ? (
                <MessageThread
                  channel={selectedChannel}
                  onSendMessage={canPostMessages ? handleSendMessage : undefined}
                  isSending={sendMessageMutation.isPending}
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
        )}

        {activeTab === 'broadcast' && canBroadcast && (
          <BroadcastComposer
            workspace={workspace}
            onSendBroadcast={handleSendBroadcast}
            isSending={sendBroadcastMutation.isPending}
          />
        )}

        {activeTab === 'search' && (
          <MessageSearch workspaceId={workspaceId} channels={scopedChannels} />
        )}
      </div>
    </div>
  );
}
