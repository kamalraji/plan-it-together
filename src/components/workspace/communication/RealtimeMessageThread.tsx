import { useState, useEffect, useRef } from 'react';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { useChannelPresence } from '@/hooks/useChannelPresence';
import { WorkspaceChannel } from '@/hooks/useWorkspaceChannels';
import { RealtimeMessageComposer } from './RealtimeMessageComposer';
import { TypingIndicator } from './TypingIndicator';
import { supabase } from '@/integrations/supabase/client';

interface RealtimeMessageThreadProps {
  channel: WorkspaceChannel;
  userName?: string;
}

export function RealtimeMessageThread({ channel, userName = 'User' }: RealtimeMessageThreadProps) {
  const [userId, setUserId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
      }
    });
  }, []);

  const { messages, isLoading, sendMessage } = useRealtimeMessages({
    channelId: channel.id,
    onNewMessage: () => {
      // Auto-scroll on new message
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    },
  });

  const { typingUsers, setTyping, onlineMembers } = useChannelPresence({
    channelId: channel.id,
    userId,
    userName,
  });

  // Auto-scroll on initial load
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

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

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage(content, userName);
    } catch {
      // Message send failed - error handled by the hook
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
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
            {channel.is_private && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                🔒 Private
              </span>
            )}
          </div>
          
          {/* Online indicator */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>{onlineMembers.length} online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground text-3xl mb-2">💭</div>
            <p className="text-muted-foreground">No messages yet</p>
            <p className="text-muted-foreground/70 text-sm mt-1">
              Be the first to start the conversation in #{channel.name}
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const showSenderInfo = !prevMessage || prevMessage.sender_id !== message.sender_id;
            const timeDiff = prevMessage
              ? new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime()
              : 0;
            const showTimeGap = timeDiff > 5 * 60 * 1000;

            return (
              <div key={message.id}>
                {showTimeGap && (
                  <div className="text-center my-4">
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      {formatMessageTime(message.created_at)}
                    </span>
                  </div>
                )}

                <div className={`flex space-x-3 ${showSenderInfo ? 'mt-4' : 'mt-1'}`}>
                  {showSenderInfo ? (
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                      {(message.sender_name || message.sender_id).charAt(0).toUpperCase()}
                    </div>
                  ) : (
                    <div className="w-8 h-8 flex items-center justify-center">
                      <span className="text-xs text-muted-foreground opacity-0 hover:opacity-100 transition-opacity">
                        {formatMessageTime(message.created_at)}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {showSenderInfo && (
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-foreground">
                          {message.sender_name || `User ${message.sender_id.slice(-4)}`}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatMessageTime(message.created_at)}
                        </span>
                      </div>
                    )}

                    <div className="text-foreground text-sm leading-relaxed">
                      {message.message_type === 'task_update' ? (
                        <div className="bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-400 p-3 rounded">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-blue-600 dark:text-blue-400 font-medium text-xs">
                              TASK UPDATE
                            </span>
                          </div>
                          <p>{message.content}</p>
                        </div>
                      ) : message.message_type === 'system' ? (
                        <div className="text-muted-foreground italic">{message.content}</div>
                      ) : (
                        <p>{message.content}</p>
                      )}
                    </div>

                    {message.is_edited && (
                      <p className="text-xs text-muted-foreground mt-1">
                        (edited {message.edited_at && formatMessageTime(message.edited_at)})
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      <TypingIndicator typingUsers={typingUsers} />

      {/* Message Composer */}
      <div className="border-t border-border p-4">
        <RealtimeMessageComposer
          onSendMessage={handleSendMessage}
          onTyping={setTyping}
          placeholder={`Message #${channel.name}`}
        />
      </div>
    </div>
  );
}
