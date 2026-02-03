/**
 * MobileThreadView - Full-screen thread view for mobile devices
 */
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Loader2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';

interface ThreadMessage {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string | null;
  created_at: string | null;
}

interface MobileThreadViewProps {
  parentMessage: {
    id: string;
    content: string;
    sender_id: string;
    sender_name: string | null;
    created_at: string;
    channel_id: string;
  };
  channelName?: string;
  onBack: () => void;
}

export const MobileThreadView: React.FC<MobileThreadViewProps> = ({
  parentMessage,
  channelName = 'Thread',
  onBack,
}) => {
  const { user } = useAuth();
  const [replies, setReplies] = useState<ThreadMessage[]>([]);
  const [newReply, setNewReply] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchReplies = async () => {
      const { data, error } = await supabase
        .from('channel_messages')
        .select('id, content, sender_id, sender_name, created_at')
        .eq('parent_message_id', parentMessage.id)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setReplies(data);
      }
      setIsLoading(false);
    };

    fetchReplies();

    // Real-time subscription
    const channel = supabase
      .channel(`mobile-thread-${parentMessage.id}`)
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
  }, [parentMessage.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies]);

  const handleSend = async () => {
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
    }
    setIsSending(false);
  };

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return format(date, 'h:mm a');
    if (isYesterday(date)) return `Yesterday ${format(date, 'h:mm a')}`;
    return format(date, 'MMM d, h:mm a');
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-semibold">Thread</h1>
          <p className="text-xs text-muted-foreground">in #{channelName}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Copy link</DropdownMenuItem>
            <DropdownMenuItem>Turn off notifications</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {/* Parent Message */}
        <div className="p-4 border-b bg-muted/20">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {parentMessage.sender_name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">
                  {parentMessage.sender_name || 'Unknown'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatMessageDate(parentMessage.created_at)}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap">{parentMessage.content}</p>
            </div>
          </div>
        </div>

        {/* Replies */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {replies.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                No replies yet. Start the conversation!
              </p>
            ) : (
              replies.map((reply) => {
                const isOwn = reply.sender_id === user?.id;
                return (
                  <div
                    key={reply.id}
                    className={cn('flex gap-3', isOwn && 'flex-row-reverse')}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-sm">
                        {reply.sender_name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        'max-w-[75%] rounded-lg p-3',
                        isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      {!isOwn && (
                        <p className="text-xs font-medium mb-1">
                          {reply.sender_name || 'Unknown'}
                        </p>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                      <p
                        className={cn(
                          'text-xs mt-1',
                          isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        )}
                      >
                        {reply.created_at ? format(new Date(reply.created_at), 'h:mm a') : ''}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-background safe-area-bottom">
        <div className="flex gap-2">
          <Textarea
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            placeholder="Reply..."
            className="min-h-[44px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!newReply.trim() || isSending}
            size="icon"
            className="shrink-0"
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
