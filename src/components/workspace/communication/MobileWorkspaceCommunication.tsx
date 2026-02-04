import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  MessageSquare, 
  Users, 
  Hash, 
  Plus, 
  Search,
  Bell,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface MobileWorkspaceCommunicationProps {
  workspaceId: string;
  userId: string;
  onChannelSelect?: (channelId: string) => void;
}

interface Channel {
  id: string;
  name: string;
  type: 'PUBLIC' | 'PRIVATE' | 'DIRECT';
  description: string | null;
  created_at: string;
  unread_count?: number;
  last_message?: string;
  last_message_at?: string;
}

export function MobileWorkspaceCommunication({
  workspaceId,
  userId,
  onChannelSelect
}: MobileWorkspaceCommunicationProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'direct'>('all');

  // Fetch channels for this workspace
  const { data: channels, isLoading, refetch } = useQuery({
    queryKey: ['workspace-channels', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_channels')
        .select(`
          id,
          name,
          type,
          description,
          created_at
        `)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Get unread counts for each channel
      const channelsWithUnread = await Promise.all(
        (data || []).map(async (channel) => {
          // Get member's last_read_at
          const { data: memberData } = await supabase
            .from('channel_members')
            .select('last_read_at')
            .eq('channel_id', channel.id)
            .eq('user_id', userId)
            .single();

          // Count unread messages
          let unreadCount = 0;
          if (memberData?.last_read_at) {
            const { count } = await supabase
              .from('channel_messages')
              .select('*', { count: 'exact', head: true })
              .eq('channel_id', channel.id)
              .gt('created_at', memberData.last_read_at);
            unreadCount = count || 0;
          }

          // Get last message
          const { data: lastMessage } = await supabase
            .from('channel_messages')
            .select('content, created_at')
            .eq('channel_id', channel.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...channel,
            unread_count: unreadCount,
            last_message: lastMessage?.content,
            last_message_at: lastMessage?.created_at
          } as Channel;
        })
      );

      return channelsWithUnread;
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const { pullDistance, isRefreshing, progress, handlers, containerRef } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  // Filter channels based on search and active filter
  const filteredChannels = (channels || []).filter(channel => {
    const matchesSearch = channel.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === 'unread') {
      return matchesSearch && (channel.unread_count || 0) > 0;
    }
    if (activeFilter === 'direct') {
      return matchesSearch && channel.type === 'DIRECT';
    }
    return matchesSearch;
  });

  const totalUnread = (channels || []).reduce((sum, c) => sum + (c.unread_count || 0), 0);

  const getChannelIcon = (type: Channel['type']) => {
    switch (type) {
      case 'DIRECT':
        return <Users className="h-5 w-5" />;
      case 'PRIVATE':
        return <MessageSquare className="h-5 w-5" />;
      default:
        return <Hash className="h-5 w-5" />;
    }
  };

  const formatTime = (dateString: string | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Messages</h2>
            {totalUnread > 0 && (
              <Badge variant="destructive" className="ml-2">
                {totalUnread}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="min-h-[48px] min-w-[48px]"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="min-h-[48px] min-w-[48px]"
              aria-label="Settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mt-3">
          {(['all', 'unread', 'direct'] as const).map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter(filter)}
              className="min-h-[40px] capitalize"
            >
              {filter}
              {filter === 'unread' && totalUnread > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {totalUnread}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Pull to Refresh Indicator */}
      <div 
        className="relative flex items-center justify-center"
        style={{ 
          height: pullDistance,
          opacity: progress,
          transition: pullDistance > 0 ? 'none' : 'all 0.3s ease-out'
        }}
      >
        {pullDistance > 0 && (
          <div 
            className={cn(
              "p-2 rounded-full bg-primary/10",
              isRefreshing && "animate-spin"
            )}
            style={{
              transform: `rotate(${progress * 360}deg)`,
            }}
          >
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
        )}
      </div>

      {/* Channel List */}
      <ScrollArea 
        ref={containerRef}
        className="flex-1"
        {...handlers}
      >
        <div 
          className="divide-y divide-border"
          style={{
            transform: `translateY(${pullDistance}px)`,
            transition: pullDistance > 0 ? 'none' : 'transform 0.3s ease-out'
          }}
        >
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))
          ) : filteredChannels.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No conversations</p>
              <p className="text-sm mt-1">
                {searchQuery ? 'Try a different search term' : 'Start a new conversation'}
              </p>
            </div>
          ) : (
            filteredChannels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => onChannelSelect?.(channel.id)}
                className={cn(
                  "w-full p-4 flex items-center gap-3 text-left",
                  "hover:bg-muted/50 active:bg-muted transition-colors",
                  "min-h-[72px]", // 48px minimum + padding for touch targets
                  (channel.unread_count || 0) > 0 && "bg-primary/5"
                )}
              >
                {/* Channel Icon */}
                <div className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center shrink-0",
                  channel.type === 'DIRECT' ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {getChannelIcon(channel.type)}
                </div>

                {/* Channel Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn(
                      "font-medium truncate",
                      (channel.unread_count || 0) > 0 ? "text-foreground" : "text-foreground/80"
                    )}>
                      {channel.type === 'PUBLIC' && '# '}
                      {channel.name}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatTime(channel.last_message_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <p className={cn(
                      "text-sm truncate",
                      (channel.unread_count || 0) > 0 ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {channel.last_message || channel.description || 'No messages yet'}
                    </p>
                    {(channel.unread_count || 0) > 0 && (
                      <Badge variant="destructive" className="shrink-0">
                        {channel.unread_count}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Floating Action Button */}
      <Button
        className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg"
        size="icon"
        aria-label="New conversation"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}
