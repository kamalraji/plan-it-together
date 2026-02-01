import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WorkspaceChannel } from '../../../types';

interface MessageResult {
  id: string;
  content: string;
  senderId: string;
  senderName: string | null;
  channelId: string;
  sentAt: string;
  attachments: any[] | null;
}

interface MessageSearchProps {
  workspaceId: string;
  channels: WorkspaceChannel[];
}

export function MessageSearch({ workspaceId, channels }: MessageSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [hasSearched, setHasSearched] = useState(false);

  // Get channel IDs for this workspace
  const channelIds = channels.map(c => c.id);

  // Search messages using Supabase full-text search
  const { data: searchResults = [], isLoading, refetch } = useQuery({
    queryKey: ['search-messages', workspaceId, searchQuery, selectedChannelId],
    queryFn: async () => {
      if (!searchQuery.trim() || channelIds.length === 0) return [];
      
      let query = supabase
        .from('channel_messages')
        .select('id, content, sender_id, sender_name, channel_id, created_at, attachments')
        .in('channel_id', selectedChannelId ? [selectedChannelId] : channelIds)
        .ilike('content', `%${searchQuery.trim()}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(msg => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.sender_id,
        senderName: msg.sender_name,
        channelId: msg.channel_id,
        sentAt: msg.created_at,
        attachments: msg.attachments as any[] | null
      })) as MessageResult[];
    },
    enabled: false, // Only run when manually triggered
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setHasSearched(true);
    await refetch();
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

  const highlightSearchTerm = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-900/50 px-1 rounded">
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
        <h3 className="text-lg font-medium text-foreground mb-2">Search Messages</h3>
        <p className="text-muted-foreground">
          Search through all workspace messages and conversations.
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-foreground mb-2">
              Search query
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for messages, keywords, or phrases..."
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus-visible:ring-ring focus:border-transparent bg-background"
            />
          </div>

          <div className="w-64">
            <label className="block text-sm font-medium text-foreground mb-2">
              Channel (optional)
            </label>
            <select
              value={selectedChannelId}
              onChange={(e) => setSelectedChannelId(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus-visible:ring-ring focus:border-transparent bg-background"
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
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Searching messages...</p>
          </div>
        )}

        {hasSearched && !isLoading && (
          <>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
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
              <div className="text-center py-12 bg-muted/50 rounded-lg">
                <div className="text-muted-foreground text-4xl mb-4">🔍</div>
                <p className="text-muted-foreground mb-2">No messages found</p>
                <p className="text-muted-foreground text-sm">
                  Try different keywords or search in all channels
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {searchResults.map((message) => (
                  <div key={message.id} className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                        {(message.senderName || message.senderId).charAt(0).toUpperCase()}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-foreground">
                            {message.senderName || `User ${message.senderId.slice(-4)}`}
                          </span>
                          <span className="text-muted-foreground">in</span>
                          <span className="text-primary font-medium">
                            {getChannelName(message.channelId)}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">
                            {formatMessageTime(message.sentAt)}
                          </span>
                        </div>
                        
                        <div className="text-foreground leading-relaxed">
                          {message.content.startsWith('**Task Update**:') ? (
                            <div className="bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-400 p-3 rounded">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-blue-600 dark:text-blue-400 font-medium text-xs">TASK UPDATE</span>
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
                            {message.attachments.map((attachment: any, idx: number) => (
                              <div key={idx} className="flex items-center space-x-2 text-sm">
                                <span className="text-muted-foreground text-xs uppercase">Attachment</span>
                                <a
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:text-primary/80 underline"
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
          <div className="text-center py-12 bg-muted/50 rounded-lg">
            <div className="text-muted-foreground text-sm mb-2 uppercase tracking-wide">Search messages</div>
            <p className="text-muted-foreground mb-2">Search workspace messages</p>
            <p className="text-muted-foreground text-sm">
              Enter keywords to find messages across all channels
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
