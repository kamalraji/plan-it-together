import { useState } from 'react';
import { WorkspaceChannel, CreateChannelDTO } from '../../../types';

interface ChannelListProps {
  channels: WorkspaceChannel[];
  selectedChannel: WorkspaceChannel | null;
  onChannelSelect: (channel: WorkspaceChannel) => void;
  onCreateChannel: () => void;
  showCreateChannel: boolean;
  onCreateChannelSubmit: (channelData: CreateChannelDTO) => void;
  onCancelCreate: () => void;
  isCreating: boolean;
}

export function ChannelList({
  channels,
  selectedChannel,
  onChannelSelect,
  onCreateChannel,
  showCreateChannel,
  onCreateChannelSubmit,
  onCancelCreate,
  isCreating,
}: ChannelListProps) {
  const [newChannelData, setNewChannelData] = useState<CreateChannelDTO>({
    name: '',
    type: 'GENERAL',
    description: '',
    isPrivate: false,
  });

  const getChannelIcon = (type: string) => {
    const icons = {
      GENERAL: '💬',
      ANNOUNCEMENT: '📢',
      ROLE_BASED: '👥',
      TASK_SPECIFIC: '📋',
    };
    return icons[type as keyof typeof icons] || '💬';
  };

  const getChannelTypeLabel = (type: string) => {
    const labels = {
      GENERAL: 'General',
      ANNOUNCEMENT: 'Announcements',
      ROLE_BASED: 'Role-based',
      TASK_SPECIFIC: 'Task-specific',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newChannelData.name.trim()) {
      onCreateChannelSubmit({
        ...newChannelData,
        name: newChannelData.name.toLowerCase().replace(/\s+/g, '-'),
      });
      setNewChannelData({
        name: '',
        type: 'GENERAL',
        description: '',
        isPrivate: false,
      });
    }
  };

  // Group channels by type
  const groupedChannels = channels.reduce((acc, channel) => {
    const type = channel.type || 'GENERAL';
    if (!acc[type]) acc[type] = [];
    acc[type].push(channel);
    return acc;
  }, {} as Record<string, WorkspaceChannel[]>);

  // Sort channel types for consistent display
  const channelTypes = ['ANNOUNCEMENT', 'GENERAL', 'ROLE_BASED', 'TASK_SPECIFIC'];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Channels</h3>
        <button
          onClick={onCreateChannel}
          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
        >
          + New Channel
        </button>
      </div>

      {/* Create Channel Form */}
      {showCreateChannel && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <form onSubmit={handleSubmitCreate} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Channel Name
              </label>
              <input
                type="text"
                value={newChannelData.name}
                onChange={(e) => setNewChannelData({ ...newChannelData, name: e.target.value })}
                placeholder="e.g., marketing-updates"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Channel Type
              </label>
              <select
                value={newChannelData.type}
                onChange={(e) => setNewChannelData({ ...newChannelData, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="GENERAL">General Discussion</option>
                <option value="ROLE_BASED">Role-based Team</option>
                <option value="TASK_SPECIFIC">Task-specific</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <input
                type="text"
                value={newChannelData.description}
                onChange={(e) => setNewChannelData({ ...newChannelData, description: e.target.value })}
                placeholder="Brief description of the channel purpose"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPrivate"
                checked={newChannelData.isPrivate}
                onChange={(e) => setNewChannelData({ ...newChannelData, isPrivate: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isPrivate" className="ml-2 text-sm text-gray-700">
                Private channel (invite-only)
              </label>
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={isCreating || !newChannelData.name.trim()}
                className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Creating...' : 'Create Channel'}
              </button>
              <button
                type="button"
                onClick={onCancelCreate}
                className="flex-1 bg-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {channelTypes.map((type) => {
          const typeChannels = groupedChannels[type];
          if (!typeChannels || typeChannels.length === 0) return null;

          return (
            <div key={type}>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {getChannelTypeLabel(type)}
              </h4>
              <div className="space-y-1">
                {typeChannels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => onChannelSelect(channel)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedChannel?.id === channel.id
                        ? 'bg-indigo-100 text-indigo-700 border-l-4 border-indigo-500'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-base">{getChannelIcon(channel.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1">
                          <span className="font-medium truncate">#{channel.name}</span>
                          {channel.isPrivate && (
                            <span className="text-xs text-gray-500">🔒</span>
                          )}
                        </div>
                        {channel.description && (
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {channel.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {channels.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 text-3xl mb-2">💬</div>
            <p className="text-gray-600 text-sm">No channels yet</p>
            <p className="text-gray-500 text-xs mt-1">
              Create your first channel to start communicating
            </p>
          </div>
        )}
      </div>
    </div>
  );
}