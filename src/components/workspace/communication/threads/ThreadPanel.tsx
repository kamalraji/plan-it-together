/**
 * ThreadPanel - Slack-style slide-out panel for threaded conversations
 */
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ThreadMessage {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string | null;
  created_at: string | null;
  parent_message_id: string | null;
}

interface ThreadPanelProps {
  parentMessage: {
    id: string;
    content: string;
    sender_id: string;
    sender_name: string | null;
    created_at: string;
    channel_id: string;
  };
  onClose: () => void;
  isOpen: boolean;
}

export const ThreadPanel: React.FC<ThreadPanelProps> = ({
  parentMessage,
  onClose,
  isOpen,
}) => {
  const { user } = useAuth();
  const [replies, setReplies] = useState<ThreadMessage[]>([]);
  const [newReply, setNewReply] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch thread replies
  useEffect(() => {
    if (!isOpen || !parentMessage.id) return;

    const fetchReplies = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('channel_messages')
        .select('id, content, sender_id, sender_name, created_at, parent_message_id')
        .eq('parent_message_id', parentMessage.id)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setReplies(data);
      }
      setIsLoading(false);
    };

    fetchReplies();

    // Real-time subscription for new replies
    const channel = supabase
      .channel(`thread-${parentMessage.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'channel_messages',
          filter: `parent_message_id=eq.${parentMessage.id}`,
        },
        (payload) => {
          setReplies((prev) => [...prev, payload.new as ThreadMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, parentMessage.id]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [replies]);

  const handleSendReply = async () => {
    if (!newReply.trim() || !user) return;

    setIsSending(true);
    const { error } = await supabase.from('channel_messages').insert({
      channel_id: parentMessage.channel_id,
      content: newReply.trim(),
      sender_id: user.id,
      sender_name: (user as any).user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      parent_message_id: parentMessage.id,
    });

    if (!error) {
      setNewReply('');
      // Update reply count on parent message
      await supabase
        .from('channel_messages')
        .update({ reply_count: replies.length + 1 })
        .eq('id', parentMessage.id);
    }
    setIsSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed right-0 top-0 h-full w-96 bg-background border-l shadow-xl z-50',
        'transform transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Thread</h3>
          <span className="text-sm text-muted-foreground">
            {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Parent Message */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {parentMessage.sender_name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {parentMessage.sender_name || 'Unknown'}
              </span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(parentMessage.created_at), 'MMM d, h:mm a')}
              </span>
            </div>
            <p className="text-sm mt-1 whitespace-pre-wrap">{parentMessage.content}</p>
          </div>
        </div>
      </div>

      {/* Replies */}
      <ScrollArea className="flex-1 h-[calc(100vh-280px)]" ref={scrollRef}>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : replies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <MessageCircle className="h-8 w-8 mb-2" />
            <p className="text-sm">No replies yet</p>
            <p className="text-xs">Be the first to reply!</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {replies.map((reply) => (
              <div key={reply.id} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {reply.sender_name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {reply.sender_name || 'Unknown'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {reply.created_at ? format(new Date(reply.created_at), 'h:mm a') : ''}
                    </span>
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{reply.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Reply Input */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background">
        <div className="flex gap-2">
          <Textarea
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Reply in thread..."
            className="min-h-[60px] resize-none"
            disabled={isSending}
          />
          <Button
            onClick={handleSendReply}
            disabled={!newReply.trim() || isSending}
            size="icon"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
