/**
 * Thread Reply Panel Component
 * Shows threaded replies to a parent message
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Send, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { MessageReactions } from './MessageReactions';

interface ThreadReplyPanelProps {
  parentMessage: {
    id: string;
    content: string;
    sender_name: string | null;
    sender_id: string;
    created_at: string;
    channel_id: string;
  };
  onClose: () => void;
}

interface ThreadReply {
  id: string;
  parent_message_id: string;
  channel_id: string;
  sender_id: string;
  sender_name: string | null;
  content: string;
  created_at: string;
  is_edited: boolean;
  edited_at: string | null;
}

export function ThreadReplyPanel({ parentMessage, onClose }: ThreadReplyPanelProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [replyContent, setReplyContent] = useState('');
  const repliesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch thread replies
  const { data: replies = [], isLoading } = useQuery({
    queryKey: ['thread-replies', parentMessage.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('channel_messages')
        .select('id, parent_message_id, channel_id, sender_id, sender_name, content, created_at, is_edited, edited_at')
        .eq('parent_message_id', parentMessage.id)
        .order('created_at', { ascending: true });

      if (error) {
        // Handle case where parent_message_id column doesn't exist
        if (error.code === '42703') return [];
        throw error;
      }
      return (data || []) as ThreadReply[];
    },
  });

  // Send reply mutation
  const sendReply = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('channel_messages')
        .insert({
          channel_id: parentMessage.channel_id,
          parent_message_id: parentMessage.id,
          sender_id: user.id,
          sender_name: user.name || user.email?.split('@')[0] || 'User',
          content,
          message_type: 'text',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thread-replies', parentMessage.id] });
      // Also update the reply count on the parent message
      queryClient.invalidateQueries({ queryKey: ['channel-messages'] });
      setReplyContent('');
    },
  });

  // Set up real-time subscription for thread replies
  useEffect(() => {
    const subscription = supabase
      .channel(`thread-replies:${parentMessage.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'channel_messages',
          filter: `parent_message_id=eq.${parentMessage.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['thread-replies', parentMessage.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [parentMessage.id, queryClient]);

  // Scroll to bottom when new replies arrive
  useEffect(() => {
    repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies.length]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!replyContent.trim()) return;
      sendReply.mutate(replyContent.trim());
    },
    [replyContent, sendReply]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit]
  );

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium text-foreground">Thread</h3>
          <span className="text-sm text-muted-foreground">
            {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Parent Message */}
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {(parentMessage.sender_name || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-medium text-foreground text-sm">
                {parentMessage.sender_name || 'Unknown User'}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(parentMessage.created_at), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap break-words">
              {parentMessage.content}
            </p>
            <div className="mt-2">
              <MessageReactions messageId={parentMessage.id} compact />
            </div>
          </div>
        </div>
      </div>

      {/* Replies */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : replies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No replies yet. Be the first to reply!
          </div>
        ) : (
          replies.map((reply) => (
            <div key={reply.id} className="flex gap-3 group">
              <Avatar className="h-7 w-7 flex-shrink-0">
                <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                  {(reply.sender_name || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-medium text-foreground text-sm">
                    {reply.sender_name || 'Unknown User'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                  </span>
                  {reply.is_edited && (
                    <span className="text-xs text-muted-foreground">(edited)</span>
                  )}
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                  {reply.content}
                </p>
                <div className="mt-1">
                  <MessageReactions messageId={reply.id} compact />
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={repliesEndRef} />
      </div>

      {/* Reply Composer */}
      <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-border">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Reply to thread..."
            className="min-h-[40px] max-h-[120px] resize-none text-sm"
            rows={1}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!replyContent.trim() || sendReply.isPending}
            className="flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  );
}

// Thread indicator shown on messages with replies
export function ThreadIndicator({
  replyCount,
  latestReplyAt,
  onClick,
}: {
  replyCount: number;
  latestReplyAt?: string;
  onClick: () => void;
}) {
  if (replyCount === 0) return null;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 hover:underline mt-1"
    >
      <MessageSquare className="h-3 w-3" />
      <span>
        {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
      </span>
      {latestReplyAt && (
        <span className="text-muted-foreground">
          · Last reply {formatDistanceToNow(new Date(latestReplyAt), { addSuffix: true })}
        </span>
      )}
    </button>
  );
}
