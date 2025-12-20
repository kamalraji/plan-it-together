import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  WorkspaceChannel, 
  SendMessageDTO, 
  BroadcastMessageDTO,
  CreateChannelDTO
} from '../../types';
import { ChannelList } from './communication/ChannelList';
import { MessageThread } from './communication/MessageThread';
import { BroadcastComposer } from './communication/BroadcastComposer';
import { MessageSearch } from './communication/MessageSearch';
import api from '../../lib/api';

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
}

export function WorkspaceCommunication({ workspaceId }: WorkspaceCommunicationProps) {
  const [activeTab, setActiveTab] = useState<'channels' | 'broadcast' | 'search'>('channels');
  const [selectedChannel, setSelectedChannel] = useState<WorkspaceChannel | null>(null);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const queryClient = useQueryClient();

  // Fetch workspace channels
  const { data: channels, isLoading: channelsLoading } = useQuery({
    queryKey: ['workspace-channels', workspaceId],
    queryFn: async () => {
      const response = await api.get(`/workspaces/${workspaceId}/channels`);
      return response.data.channels as WorkspaceChannel[];
    },
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
    mutationFn: async ({ channelId, messageData }: { channelId: string; messageData: SendMessageDTO & { isPriority?: boolean } }) => {
      const response = await api.post(`/workspaces/channels/${channelId}/messages`, messageData);
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
      return response.data.messages;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-channels', workspaceId] });
    },
  });

  // Auto-select general channel if available
  useEffect(() => {
    if (channels && channels.length > 0 && !selectedChannel) {
      const generalChannel = channels.find(ch => ch.name === 'general') || channels[0];
      setSelectedChannel(generalChannel);
    }
  }, [channels, selectedChannel]);

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

  const handleSendBroadcast = async (broadcastData: BroadcastMessageDTO & { isPriority?: boolean }) => {
    await sendBroadcastMutation.mutateAsync(broadcastData);
  };

  const handleCreateChannel = async (channelData: CreateChannelDTO) => {
    await createChannelMutation.mutateAsync(channelData);
  };

  if (channelsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header with tabs */}
      <div className="border-b border-gray-200">
        <div className="px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Team Communication</h2>
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'channels', label: 'Channels', icon: '💬' },
              { key: 'broadcast', label: 'Broadcast', icon: '📢' },
              { key: 'search', label: 'Search', icon: '🔍' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
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
                channels={channels || []}
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
                  onSendMessage={handleSendMessage}
                  isSending={sendMessageMutation.isPending}
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-gray-400 text-4xl mb-2">💬</div>
                    <p className="text-gray-600">Select a channel to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'broadcast' && (
          <BroadcastComposer
            workspace={workspace}
            onSendBroadcast={handleSendBroadcast}
            isSending={sendBroadcastMutation.isPending}
          />
        )}

        {activeTab === 'search' && (
          <MessageSearch
            workspaceId={workspaceId}
            channels={channels || []}
          />
        )}
      </div>
    </div>
  );
}