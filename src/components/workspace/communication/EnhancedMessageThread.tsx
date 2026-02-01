/**
 * Enhanced Message Thread Component
 * Production-ready message thread with full real-time features
 * - Real-time message updates (no polling)
 * - Typing indicators
 * - Online presence indicators
 * - Optimistic message sending
 * - @mention highlighting
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { WorkspaceChannel, SendMessageDTO } from '../../../types';
import { MessageComposer } from './MessageComposer';
import { useRealtimeMessages, ChannelMessage } from '@/hooks/useRealtimeMessages';
import { useChannelPresence } from '@/hooks/useChannelPresence';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface EnhancedMessageThreadProps {
  channel: WorkspaceChannel;
  onSendMessage?: (messageData: SendMessageDTO & { isPriority?: boolean }) => void;
  isSending?: boolean;
}

export function EnhancedMessageThread({ 
  channel, 
  onSendMessage,
  isSending = false,
}: EnhancedMessageThreadProps) {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Real-time messages hook
  const { 
    messages, 
    isLoading, 
    sendMessage,
    error,
  } = useRealtimeMessages({
    channelId: channel.id,
    onNewMessage: () => {
      // Auto-scroll only if user is at bottom
      if (isAtBottom) {
        scrollToBottom();
      }
    },
  });

  // Presence and typing indicators
  const { typingUsers, setTyping, onlineMembers } = useChannelPresence({
    channelId: channel.id,
    userId: user?.id || '',
    userName: user?.name || user?.email || 'User',
  });

  // Track scroll position
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsAtBottom(atBottom);
  }, []);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Auto-scroll on initial load
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      scrollToBottom();
    }
  }, [isLoading, messages.length, scrollToBottom]);

  // Handle sending message
  const handleSendMessage = useCallback(async (messageData: SendMessageDTO & { isPriority?: boolean }) => {
    // Use the real-time hook's sendMessage for optimistic updates
    try {
      await sendMessage(messageData.content, user?.name || user?.email || 'User', 'text');
      setTyping(false);
      scrollToBottom();
    } catch (err) {
      console.error('Failed to send message:', err);
    }

    // Also call the parent handler if provided
    onSendMessage?.(messageData);
  }, [sendMessage, user, setTyping, scrollToBottom, onSendMessage]);

  // Note: Typing indicator is controlled by the useChannelPresence hook
  // The setTyping function is called during sendMessage flow

  // Format message time
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  // Highlight @mentions in message content
  const renderMessageContent = useCallback((content: string) => {
    // Match @mentions
    const mentionRegex = /@(\w+)/g;
    const parts = content.split(mentionRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is a mention
        const isMe = user?.name?.toLowerCase() === part.toLowerCase();
        return (
          <span
            key={index}
            className={cn(
              "px-1 rounded font-medium",
              isMe 
                ? "bg-primary/20 text-primary" 
                : "bg-muted text-muted-foreground"
            )}
          >
            @{part}
          </span>
        );
      }
      return part;
    });
  }, [user]);

  // Group messages by sender for compact display
  const groupedMessages = useMemo(() => {
    return messages.reduce<{
      message: ChannelMessage;
      showSender: boolean;
      showTimeGap: boolean;
    }[]>((acc, message, index) => {
      const prevMessage = index > 0 ? messages[index - 1] : null;
      const showSender = !prevMessage || prevMessage.sender_id !== message.sender_id;
      const timeDiff = prevMessage
        ? new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime()
        : 0;
      const showTimeGap = timeDiff > 5 * 60 * 1000; // 5 minutes

      acc.push({ message, showSender: showSender || showTimeGap, showTimeGap });
      return acc;
    }, []);
  }, [messages]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Failed to load messages</p>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-card border border-border rounded-lg">
      {/* Channel Header */}
      <div className="px-4 py-3 border-b border-border bg-muted/50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div>
              <h3 className="font-medium text-foreground">#{channel.name}</h3>
              {channel.description && (
                <p className="text-sm text-muted-foreground">{channel.description}</p>
              )}
            </div>
            {channel.isPrivate && (
              <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded-full">
                🔒 Private
              </span>
            )}
          </div>
          
          {/* Online members indicator */}
          {onlineMembers.length > 0 && (
            <div className="flex items-center gap-1">
              <div className="flex -space-x-2">
                {onlineMembers.slice(0, 3).map((member: any) => (
                  <div
                    key={member.userId}
                    className="w-6 h-6 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-xs font-medium text-primary"
                    title={member.userName}
                  >
                    {member.userName?.charAt(0).toUpperCase() || '?'}
                  </div>
                ))}
              </div>
              {onlineMembers.length > 3 && (
                <span className="text-xs text-muted-foreground ml-1">
                  +{onlineMembers.length - 3}
                </span>
              )}
              <span className="relative flex h-2 w-2 ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-1"
      >
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground text-3xl mb-2">💭</div>
            <p className="text-muted-foreground">No messages yet</p>
            <p className="text-muted-foreground text-sm mt-1">
              Be the first to start the conversation in #{channel.name}
            </p>
          </div>
        ) : (
          groupedMessages.map(({ message, showSender, showTimeGap }) => (
            <div key={message.id}>
              {showTimeGap && (
                <div className="text-center my-4">
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {formatMessageTime(message.created_at)}
                  </span>
                </div>
              )}
              
              <div className={cn(
                "flex space-x-3 group hover:bg-muted/30 rounded px-2 py-1 -mx-2 transition-colors",
                showSender ? 'mt-3' : 'mt-0.5'
              )}>
                {showSender ? (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {(message.sender_name || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  {showSender && (
                    <div className="flex items-center space-x-2 mb-0.5">
                      <span className="font-medium text-foreground text-sm">
                        {message.sender_name || 'Unknown User'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </span>
                      {message.is_edited && (
                        <span className="text-xs text-muted-foreground">(edited)</span>
                      )}
                    </div>
                  )}
                  
                  <div className="text-foreground text-sm leading-relaxed">
                    {message.message_type === 'task_update' ? (
                      <div className="bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-400 p-3 rounded">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-blue-600 dark:text-blue-400 font-medium text-xs">TASK UPDATE</span>
                        </div>
                        <p>{message.content}</p>
                      </div>
                    ) : message.message_type === 'system' ? (
                      <p className="text-muted-foreground italic">{message.content}</p>
                    ) : (
                      <p className="whitespace-pre-wrap break-words">
                        {renderMessageContent(message.content)}
                      </p>
                    )}
                  </div>

                  {/* Attachments */}
                  {message.attachments && (message.attachments as any[]).length > 0 && (
                    <div className="mt-2 space-y-2">
                      {(message.attachments as any[]).map((attachment: any, idx: number) => (
                        <div key={idx} className="flex items-center space-x-2 text-sm">
                          <span className="text-muted-foreground">📎</span>
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {attachment.filename}
                          </a>
                          {attachment.size && (
                            <span className="text-muted-foreground text-xs">
                              ({Math.round(attachment.size / 1024)}KB)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-2 text-sm text-muted-foreground border-t border-border">
          <div className="flex items-center gap-2">
            <div className="flex space-x-1">
              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>
              {typingUsers.length === 1 
                ? `${typingUsers[0]} is typing...`
                : `${typingUsers.slice(0, 2).join(', ')}${typingUsers.length > 2 ? ` and ${typingUsers.length - 2} others` : ''} are typing...`
              }
            </span>
          </div>
        </div>
      )}

      {/* Message Composer */}
      <div className="border-t border-border p-4">
        <MessageComposer
          onSendMessage={handleSendMessage}
          isSending={isSending}
          placeholder={`Message #${channel.name}`}
          allowPriority={channel.type !== 'ANNOUNCEMENT'}
        />
      </div>

      {/* Scroll to bottom button */}
      {!isAtBottom && messages.length > 10 && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-8 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
        >
          ↓
        </button>
      )}
    </div>
  );
}
