/**
 * ThreadNotifications - Unread thread tracking and notifications
 * Now using the thread_notifications table for proper tracking
 */
import React, { useState, useEffect } from 'react';
import { MessageCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

interface ThreadNotification {
  id: string;
  thread_id: string;
  thread_preview: string;
  channel_id: string;
  channel_name: string;
  last_reply_by: string;
  last_reply_at: string | null;
  unread_count: number;
}

interface ThreadNotificationsProps {
  workspaceId: string;
  onOpenThread: (threadId: string, channelId: string) => void;
}

export const ThreadNotifications: React.FC<ThreadNotificationsProps> = ({
  workspaceId,
  onOpenThread,
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch unread thread notifications from the database
  const { data: notifications = [], refetch } = useQuery({
    queryKey: ['thread-notifications', workspaceId, user?.id],
    queryFn: async () => {
      if (!user?.id || !workspaceId) return [];

      // Query thread_notifications with related thread and channel data
      const { data: notificationData, error } = await supabase
        .from('thread_notifications')
        .select(`
          id,
          thread_id,
          channel_id,
          unread_count,
          updated_at
        `)
        .eq('user_id', user.id)
        .eq('workspace_id', workspaceId)
        .eq('is_subscribed', true)
        .gt('unread_count', 0)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching thread notifications:', error);
        return [];
      }

      if (!notificationData?.length) return [];

      // Get thread details (parent messages)
      const threadIds = notificationData.map(n => n.thread_id);
      const { data: threads } = await supabase
        .from('channel_messages')
        .select('id, content, sender_name, created_at')
        .in('id', threadIds);

      // Get channel names
      const channelIds = [...new Set(notificationData.map(n => n.channel_id))];
      const { data: channels } = await supabase
        .from('workspace_channels')
        .select('id, name')
        .in('id', channelIds);

      // Get latest reply for each thread
      const { data: latestReplies } = await supabase
        .from('channel_messages')
        .select('parent_message_id, sender_name, created_at')
        .in('parent_message_id', threadIds)
        .order('created_at', { ascending: false });

      // Build notification objects
      const threadMap = new Map(threads?.map(t => [t.id, t]) || []);
      const channelMap = new Map(channels?.map(c => [c.id, c]) || []);
      const latestReplyMap = new Map<string, { sender_name: string; created_at: string }>();
      
      latestReplies?.forEach(reply => {
        if (reply.parent_message_id && !latestReplyMap.has(reply.parent_message_id)) {
          latestReplyMap.set(reply.parent_message_id, {
            sender_name: reply.sender_name || 'Someone',
            created_at: reply.created_at || ''
          });
        }
      });

      return notificationData.map(notification => {
        const thread = threadMap.get(notification.thread_id);
        const channel = channelMap.get(notification.channel_id);
        const latestReply = latestReplyMap.get(notification.thread_id);

        const threadContent = thread?.content || '';
        return {
          id: notification.id,
          thread_id: notification.thread_id,
          channel_id: notification.channel_id,
          thread_preview: threadContent.slice(0, 50) + (threadContent.length > 50 ? '...' : ''),
          channel_name: channel?.name || 'Channel',
          last_reply_by: latestReply?.sender_name || thread?.sender_name || 'Someone',
          last_reply_at: latestReply?.created_at || notification.updated_at,
          unread_count: notification.unread_count,
        };
      }) as ThreadNotification[];
    },
    enabled: !!user?.id && !!workspaceId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  // Refetch when popover opens
  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  const totalUnread = notifications.reduce((sum, n) => sum + n.unread_count, 0);

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    
    // Mark all threads as read in the database
    const threadIds = notifications.map(n => n.thread_id);
    for (const threadId of threadIds) {
      await supabase.rpc('mark_thread_read', { p_thread_id: threadId });
    }
    
    // Refetch to update the UI
    refetch();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <MessageCircle className="h-5 w-5" />
          {totalUnread > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {totalUnread > 9 ? '9+' : totalUnread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm">Thread Updates</h4>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="h-auto py-1 px-2 text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <MessageCircle className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No thread updates</p>
              <p className="text-xs">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => {
                    onOpenThread(notification.thread_id, notification.thread_id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full p-3 text-left hover:bg-muted/50 transition-colors',
                    notification.unread_count > 0 && 'bg-primary/5'
                  )}
                >
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {notification.last_reply_by.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {notification.last_reply_by}
                        </span>
                        {notification.unread_count > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {notification.unread_count} new
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {notification.thread_preview}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.last_reply_at
                          ? format(new Date(notification.last_reply_at), 'MMM d, h:mm a')
                          : ''}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
