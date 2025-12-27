import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { WorkspaceChannel, MessageResponse } from '../../../types';
import api from '../../../lib/api';

interface MessageSearchProps {
  workspaceId: string;
  channels: WorkspaceChannel[];
}

export function MessageSearch({ workspaceId, channels }: MessageSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [searchResults, setSearchResults] = useState<MessageResponse[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Search messages
  const { isLoading, refetch } = useQuery({
    queryKey: ['search-messages', workspaceId, searchQuery, selectedChannelId],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      
      const params = new URLSearchParams({
        query: searchQuery.trim(),
        ...(selectedChannelId && { channelId: selectedChannelId }),
      });
      
      const response = await api.get(`/workspaces/${workspaceId}/messages/search?${params}`);
      return response.data.messages as MessageResponse[];
    },
    enabled: false, // Only run when manually triggered
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setHasSearched(true);
    const { data } = await refetch();
    setSearchResults(data || []);
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getChannelName = (channelId: string) => {
    const channel = channels.find(ch => ch.id === channelId);
    return channel ? `#${channel.name}` : 'Unknown Channel';
  };

  const getChannelIcon = (channelId: string) => {
    const channel = channels.find(ch => ch.id === channelId);
    if (!channel) return '';
    return '';
  };

  const highlightSearchTerm = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Search Messages</h3>
        <p className="text-gray-600">
          Search through all workspace messages and conversations.
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search query
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for messages, keywords, or phrases..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="w-64">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Channel (optional)
            </label>
            <select
              value={selectedChannelId}
              onChange={(e) => setSelectedChannelId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All channels</option>
              {channels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  #{channel.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isLoading || !searchQuery.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <span>🔍</span>
                  <span>Search</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Search Results */}
      <div>
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching messages...</p>
          </div>
        )}

        {hasSearched && !isLoading && (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {searchResults.length > 0 ? (
                  <>
                    Found {searchResults.length} message{searchResults.length !== 1 ? 's' : ''} 
                    {searchQuery && (
                      <> for "<strong>{searchQuery}</strong>"</>
                    )}
                    {selectedChannelId && (
                      <> in {getChannelName(selectedChannelId)}</>
                    )}
                  </>
                ) : (
                  <>
                    No messages found
                    {searchQuery && (
                      <> for "<strong>{searchQuery}</strong>"</>
                    )}
                    {selectedChannelId && (
                      <> in {getChannelName(selectedChannelId)}</>
                    )}
                  </>
                )}
              </p>
            </div>

            {searchResults.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <div className="text-gray-400 text-4xl mb-4">🔍</div>
                <p className="text-gray-600 mb-2">No messages found</p>
                <p className="text-gray-500 text-sm">
                  Try different keywords or search in all channels
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {searchResults.map((message) => (
                  <div key={message.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {message.senderId.charAt(0).toUpperCase()}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-gray-900">
                            User {message.senderId.slice(-4)}
                          </span>
                          <span className="text-gray-400">in</span>
                          <div className="flex items-center space-x-1">
                            <span>{getChannelIcon(message.channelId)}</span>
                            <span className="text-indigo-600 font-medium">
                              {getChannelName(message.channelId)}
                            </span>
                          </div>
                          <span className="text-gray-400">•</span>
                          <span className="text-sm text-gray-500">
                            {formatMessageTime(message.sentAt)}
                          </span>
                        </div>
                        
                        <div className="text-gray-700 leading-relaxed">
                          {message.content.startsWith('**Task Update**:') ? (
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-blue-600 font-medium text-xs">TASK UPDATE</span>
                              </div>
                              <p>{highlightSearchTerm(message.content.replace('**Task Update**: ', ''), searchQuery)}</p>
                            </div>
                          ) : (
                            <p>{highlightSearchTerm(message.content, searchQuery)}</p>
                          )}
                        </div>

                        {/* Attachments */}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {message.attachments.map((attachment, idx) => (
                              <div key={idx} className="flex items-center space-x-2 text-sm">
                                <span className="text-gray-500 text-xs uppercase">Attachment</span>
                                <a
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:text-indigo-700 underline"
                                >
                                  {attachment.filename}
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {!hasSearched && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-gray-400 text-sm mb-2 uppercase tracking-wide">Search messages</div>
            <p className="text-gray-600 mb-2">Search workspace messages</p>
            <p className="text-gray-500 text-sm">
              Enter keywords to find messages across all channels
            </p>
          </div>
        )}
      </div>
    </div>
  );
}