import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PaperAirplaneIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  HashtagIcon,
  UserGroupIcon,
  SpeakerWaveIcon,
  MicrophoneIcon,
  PhotoIcon,
  PaperClipIcon,
  FaceSmileIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/integrations/supabase/client';

interface MobileCommunicationProps {
  workspaceId: string;
}

interface WorkspaceChannel {
  id: string;
  name: string;
  description: string | null;
  channel_type: string;
  is_private: boolean;
}

interface ChannelMessage {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string | null;
  created_at: string;
  attachments: unknown[] | null;
}

export function MobileCommunication({ workspaceId }: MobileCommunicationProps) {
  const [selectedChannel, setSelectedChannel] = useState<WorkspaceChannel | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showChannelList, setShowChannelList] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  // Fetch channels from Supabase
  const { data: channels, isLoading: channelsLoading } = useQuery({
    queryKey: ['workspace-channels', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_channels')
        .select('id, name, description, is_private')
        .eq('workspace_id', workspaceId)
        .order('name');
      
      if (error) throw error;
      return (data || []).map(c => ({ ...c, channel_type: 'general' })) as WorkspaceChannel[];
    },
  });

  // Fetch messages for selected channel
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['channel-messages', selectedChannel?.id],
    queryFn: async () => {
      if (!selectedChannel) return [];
      const { data, error } = await supabase
        .from('channel_messages')
        .select('id, content, sender_id, sender_name, created_at, attachments')
        .eq('channel_id', selectedChannel.id)
        .order('created_at', { ascending: true })
        .limit(100);
      
      if (error) throw error;
      return data as ChannelMessage[];
    },
    enabled: !!selectedChannel,
  });

  // Fetch team members for message attribution
  const { data: teamMembers } = useQuery({
    queryKey: ['workspace-team-members', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_team_members')
        .select(`
          id,
          user_id,
          role,
          status,
          user_profiles!workspace_team_members_user_id_fkey(id, name, email)
        `)
        .eq('workspace_id', workspaceId);
      
      if (error) throw error;
      return data;
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ channelId, content }: { channelId: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('channel_messages')
        .insert({
          channel_id: channelId,
          content,
          sender_id: user.id,
          sender_name: user.email?.split('@')[0] || 'User',
        });

      if (error) throw error;

      // Log workspace activity for mobile text messages
      await supabase.from('workspace_activities').insert({
        workspace_id: workspaceId,
        type: 'communication',
        title: 'Mobile channel message',
        description: content.slice(0, 140) || 'A new message was posted from mobile.',
        metadata: { channelId, source: 'mobile', kind: 'text' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-messages', selectedChannel?.id] });
      setMessageText('');
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Select first channel by default
  useEffect(() => {
    if (channels && channels.length > 0 && !selectedChannel) {
      setSelectedChannel(channels[0]);
      setShowChannelList(false);
    }
  }, [channels, selectedChannel]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedChannel) return;
    
    await sendMessageMutation.mutateAsync({
      channelId: selectedChannel.id,
      content: messageText.trim()
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        await handleSendVoiceMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (_error) {
      alert('Failed to access microphone. Please check permissions.');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const handleSendVoiceMessage = async (_audioBlob: Blob) => {
    if (!selectedChannel) return;

    // For now, log the voice message activity (file upload would require storage bucket)
    await supabase.from('workspace_activities').insert({
      workspace_id: workspaceId,
      type: 'communication',
      title: 'Mobile voice message',
      description: 'A voice message was sent from mobile.',
      metadata: { channelId: selectedChannel.id, source: 'mobile', kind: 'voice' },
    });

    queryClient.invalidateQueries({ queryKey: ['channel-messages', selectedChannel.id] });
  };

  const handlePhotoUpload = async (_file: File) => {
    if (!selectedChannel) return;

    // For now, log the photo upload activity
    await supabase.from('workspace_activities').insert({
      workspace_id: workspaceId,
      type: 'communication',
      title: 'Mobile photo shared',
      description: 'A photo was shared from mobile.',
      metadata: { channelId: selectedChannel.id, source: 'mobile', kind: 'photo' },
    });

    queryClient.invalidateQueries({ queryKey: ['channel-messages', selectedChannel.id] });
  };

  const triggerPhotoUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handlePhotoUpload(file);
      }
    };
    input.click();
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMemberName = (userId: string) => {
    const member = teamMembers?.find(m => m.user_id === userId);
    return (member?.user_profiles as any)?.name || 'Unknown User';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'general':
        return <HashtagIcon className="w-4 h-4" />;
      case 'announcements':
        return <SpeakerWaveIcon className="w-4 h-4" />;
      default:
        return <UserGroupIcon className="w-4 h-4" />;
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (channelsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Channel List View
  if (showChannelList || !selectedChannel) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Channels</h2>
          <button className="p-2 rounded-md hover:bg-muted transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center">
            <PlusIcon className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search channels..."
            className="w-full pl-10 pr-4 py-3 border border-input rounded-md focus-visible:ring-ring focus-visible:border-primary min-h-[48px]"
          />
        </div>

        {/* Channels List */}
        <div className="space-y-2">
          {channels?.map((channel) => (
            <button
              key={channel.id}
              onClick={() => {
                setSelectedChannel(channel);
                setShowChannelList(false);
              }}
              className="w-full flex items-center space-x-3 p-4 bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow text-left min-h-[64px]"
            >
              <div className="flex-shrink-0 p-2 bg-muted rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center">
                {getChannelIcon(channel.channel_type)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-foreground truncate">
                  {channel.name}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {channel.description || 'No description'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Chat View
  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 bg-card border-b border-border">
        <button
          onClick={() => setShowChannelList(true)}
          className="flex items-center space-x-2 text-muted-foreground hover:text-foreground min-h-[48px]"
        >
          <div className="p-1 bg-muted rounded min-h-[32px] min-w-[32px] flex items-center justify-center">
            {getChannelIcon(selectedChannel.channel_type)}
          </div>
          <div className="text-left">
            <h3 className="text-sm font-medium text-foreground">{selectedChannel.name}</h3>
          </div>
        </button>
        
        <button className="p-2 rounded-md hover:bg-muted transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center">
          <EllipsisVerticalIcon className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/50">
        {messagesLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          </div>
        ) : messages && messages.length > 0 ? (
          messages.map((message, index) => {
            const isConsecutive = index > 0 && 
              messages[index - 1].sender_id === message.sender_id &&
              new Date(message.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() < 300000;

            return (
              <div key={message.id} className={`flex space-x-3 ${isConsecutive ? 'mt-1' : 'mt-4'}`}>
                {!isConsecutive && (
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-600 font-medium text-xs">
                      {getInitials(message.sender_name || getMemberName(message.sender_id))}
                    </span>
                  </div>
                )}
                
                <div className={`flex-1 ${isConsecutive ? 'ml-11' : ''}`}>
                  {!isConsecutive && (
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-foreground">
                        {message.sender_name || getMemberName(message.sender_id)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatMessageTime(message.created_at)}
                      </span>
                    </div>
                  )}
                  
                  <div className="bg-card rounded-lg p-3 shadow-sm">
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <HashtagIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-sm font-medium text-foreground mb-1">No messages yet</h3>
            <p className="text-xs text-muted-foreground">Start the conversation!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 bg-card border-t border-border">
        <div className="flex items-end space-x-2">
          {/* Attachment buttons */}
          <div className="flex space-x-1">
            <button 
              onClick={triggerPhotoUpload}
              className="p-3 rounded-md hover:bg-muted transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center"
            >
              <PhotoIcon className="w-5 h-5 text-muted-foreground" />
            </button>
            <button className="p-3 rounded-md hover:bg-muted transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center">
              <PaperClipIcon className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Message input */}
          <div className="flex-1 relative">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-3 py-3 border border-input rounded-lg focus-visible:ring-ring focus-visible:border-primary resize-none min-h-[48px]"
              style={{ maxHeight: '120px' }}
            />
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-md hover:bg-muted transition-colors">
              <FaceSmileIcon className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Voice message button */}
          <button
            onTouchStart={startVoiceRecording}
            onTouchEnd={stopVoiceRecording}
            onMouseDown={startVoiceRecording}
            onMouseUp={stopVoiceRecording}
            onMouseLeave={stopVoiceRecording}
            className={`p-3 rounded-md transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center ${
              isRecording ? 'bg-red-100 text-red-600' : 'hover:bg-muted text-muted-foreground'
            }`}
          >
            <MicrophoneIcon className="w-5 h-5" />
          </button>

          {/* Send button */}
          <button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sendMessageMutation.isPending}
            className="p-3 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
        
        {isRecording && (
          <div className="mt-2 text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-red-600 font-medium">
                Recording: {formatRecordingTime(recordingTime)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Release to send, hold to record</p>
          </div>
        )}
      </div>
    </div>
  );
}
