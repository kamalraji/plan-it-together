/**
 * ThreadNotifications - Unread thread tracking and notifications
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

interface ThreadNotification {
  id: string;
  thread_id: string;
  thread_preview: string;
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
  const [notifications, setNotifications] = useState<ThreadNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // For now, we'll use mock data since we don't have a thread_notifications table
  // In a real implementation, this would query a dedicated table
  useEffect(() => {
    if (!user || !workspaceId) return;

    // This is a simplified implementation
    // A full implementation would track which threads the user has participated in
    // and show unread replies
    const fetchUnreadThreads = async () => {
      // Query messages where the user has replied in a thread
      const { data: userReplies } = await supabase
        .from('channel_messages')
        .select('parent_message_id')
        .eq('sender_id', user.id)
        .not('parent_message_id', 'is', null)
        .limit(50);

      if (userReplies && userReplies.length > 0) {
        const parentIds = [...new Set(userReplies.map((r) => r.parent_message_id).filter(Boolean))] as string[];
        
        // Get the parent messages with their reply counts
        const { data: threads } = await supabase
          .from('channel_messages')
          .select('id, content, channel_id, reply_count, created_at, sender_name')
          .in('id', parentIds)
          .gt('reply_count', 0)
          .order('created_at', { ascending: false })
          .limit(10);

        if (threads) {
          setNotifications(
            threads.map((thread) => ({
              id: thread.id,
              thread_id: thread.id,
              thread_preview: thread.content.slice(0, 50) + (thread.content.length > 50 ? '...' : ''),
              channel_name: 'Channel',
              last_reply_by: thread.sender_name || 'Someone',
              last_reply_at: thread.created_at,
              unread_count: Math.max(0, (thread.reply_count || 0) - 1), // Simplified
            }))
          );
        }
      }
    };

    fetchUnreadThreads();
  }, [user, workspaceId, isOpen]);

  const totalUnread = notifications.reduce((sum, n) => sum + n.unread_count, 0);

  const handleMarkAllRead = () => {
    setNotifications([]);
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
