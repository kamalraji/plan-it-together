import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { WorkspaceChannel, MessageResponse, SendMessageDTO } from '../../../types';
import { MessageComposer } from './MessageComposer';
import api from '../../../lib/api';

interface MessageThreadProps {
  channel: WorkspaceChannel;
  onSendMessage?: (messageData: SendMessageDTO & { isPriority?: boolean }) => void;
  isSending: boolean;
}

export function MessageThread({ channel, onSendMessage, isSending }: MessageThreadProps) {
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch channel messages
  const { data: messageHistory, isLoading } = useQuery({
    queryKey: ['channel-messages', channel.id],
    queryFn: async () => {
      const response = await api.get(`/workspaces/channels/${channel.id}/messages`);
      return response.data;
    },
    refetchInterval: 5000, // Poll for new messages every 5 seconds
  });

  // Update messages when data changes
  useEffect(() => {
    if (messageHistory?.messages) {
      setMessages(messageHistory.messages);
    }
  }, [messageHistory]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white border border-gray-200 rounded-lg">
      {/* Channel Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <div className="flex items-center space-x-2">
          <div>
            <h3 className="font-medium text-gray-900">#{channel.name}</h3>
            {channel.description && (
              <p className="text-sm text-gray-600">{channel.description}</p>
            )}
          </div>
          {channel.isPrivate && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
              🔒 Private
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-3xl mb-2">💭</div>
            <p className="text-gray-600">No messages yet</p>
            <p className="text-gray-500 text-sm mt-1">
              Be the first to start the conversation in #{channel.name}
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const showSenderInfo = !prevMessage || prevMessage.senderId !== message.senderId;
            const timeDiff = prevMessage 
              ? new Date(message.sentAt).getTime() - new Date(prevMessage.sentAt).getTime()
              : 0;
            const showTimeGap = timeDiff > 5 * 60 * 1000; // 5 minutes

            return (
              <div key={message.id}>
                {showTimeGap && (
                  <div className="text-center my-4">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {formatMessageTime(message.sentAt)}
                    </span>
                  </div>
                )}
                
                <div className={`flex space-x-3 ${showSenderInfo ? 'mt-4' : 'mt-1'}`}>
                  {showSenderInfo ? (
                    <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {message.senderId.charAt(0).toUpperCase()}
                    </div>
                  ) : (
                    <div className="w-8 h-8 flex items-center justify-center">
                      <span className="text-xs text-gray-400">
                        {formatMessageTime(message.sentAt)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    {showSenderInfo && (
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900">
                          User {message.senderId.slice(-4)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatMessageTime(message.sentAt)}
                        </span>
                      </div>
                    )}
                    
                    <div className="text-gray-700 text-sm leading-relaxed">
                      {message.content.startsWith('**Task Update**:') ? (
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-blue-600 font-medium text-xs">TASK UPDATE</span>
                          </div>
                          <p>{message.content.replace('**Task Update**: ', '')}</p>
                        </div>
                      ) : (
                        <p>{message.content}</p>
                      )}
                    </div>

                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.attachments.map((attachment, idx) => (
                          <div key={idx} className="flex items-center space-x-2 text-sm">
                            <span className="text-gray-400">📎</span>
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-700 underline"
                            >
                              {attachment.filename}
                            </a>
                            <span className="text-gray-500 text-xs">
                              ({Math.round(attachment.size / 1024)}KB)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {message.editedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        (edited {formatMessageTime(message.editedAt)})
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

      {/* Message Composer */}
      <div className="border-t border-gray-200 p-4">
        <MessageComposer
          onSendMessage={onSendMessage}
          isSending={isSending}
          placeholder={`Message #${channel.name}`}
          allowPriority={channel.type !== 'ANNOUNCEMENT'}
        />
      </div>
    </div>
  );
}