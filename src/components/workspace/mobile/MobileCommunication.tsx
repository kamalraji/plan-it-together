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
import { WorkspaceChannel, MessageResponse, TeamMember } from '../../../types';
import api from '../../../lib/api';
import { supabase } from '@/integrations/supabase/client';

interface MobileCommunicationProps {
  workspaceId: string;
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

  // Fetch channels
  const { data: channels, isLoading: channelsLoading } = useQuery({
    queryKey: ['workspace-channels', workspaceId],
    queryFn: async () => {
      const response = await api.get(`/workspaces/${workspaceId}/channels`);
      return response.data.channels as WorkspaceChannel[];
    },
  });

  // Fetch messages for selected channel
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['channel-messages', selectedChannel?.id],
    queryFn: async () => {
      if (!selectedChannel) return [];
      const response = await api.get(`/channels/${selectedChannel.id}/messages`);
      return response.data.messages as MessageResponse[];
    },
    enabled: !!selectedChannel,
  });

  // Fetch team members for message attribution
  const { data: teamMembers } = useQuery({
    queryKey: ['workspace-team-members', workspaceId],
    queryFn: async () => {
      const response = await api.get(`/workspaces/${workspaceId}/team-members`);
      return response.data.teamMembers as TeamMember[];
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ channelId, content }: { channelId: string; content: string }) => {
      await api.post(`/channels/${channelId}/messages`, { content });

      // Log workspace activity for mobile text messages (non-blocking for UX)
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
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);

      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (_error) {
      // Microphone access denied or failed
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

  const handleSendVoiceMessage = async (audioBlob: Blob) => {
    if (!selectedChannel) return;

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-message.wav');
      formData.append('channelId', selectedChannel.id);

      await api.post(`/channels/${selectedChannel.id}/voice-messages`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Log workspace activity for mobile voice messages
      await supabase.from('workspace_activities').insert({
        workspace_id: workspaceId,
        type: 'communication',
        title: 'Mobile voice message',
        description: 'A voice message was sent from mobile.',
        metadata: { channelId: selectedChannel.id, source: 'mobile', kind: 'voice' },
      });

      queryClient.invalidateQueries({ queryKey: ['channel-messages', selectedChannel.id] });
    } catch (_error) {
      // Voice message upload failed
      alert('Failed to send voice message. Please try again.');
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (!selectedChannel) return;

    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('channelId', selectedChannel.id);

      await api.post(`/channels/${selectedChannel.id}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Log workspace activity for mobile photo uploads
      await supabase.from('workspace_activities').insert({
        workspace_id: workspaceId,
        type: 'communication',
        title: 'Mobile photo shared',
        description: 'A photo was shared from mobile.',
        metadata: { channelId: selectedChannel.id, source: 'mobile', kind: 'photo' },
      });

      queryClient.invalidateQueries({ queryKey: ['channel-messages', selectedChannel.id] });
    } catch (_error) {
      // Photo upload failed
      alert('Failed to upload photo. Please try again.');
    }
  };

  const triggerPhotoUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use rear camera on mobile
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
    const member = teamMembers?.find(m => m.userId === userId);
    return member?.user.name || 'Unknown User';
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
      case 'GENERAL':
        return <HashtagIcon className="w-4 h-4" />;
      case 'ANNOUNCEMENT':
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
          <button className="p-2 rounded-md hover:bg-muted transition-colors">
            <PlusIcon className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search channels..."
            className="w-full pl-10 pr-4 py-2 border border-input rounded-md focus-visible:ring-ring focus-visible:border-primary"
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
              className="w-full flex items-center space-x-3 p-3 bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow text-left"
            >
              <div className="flex-shrink-0 p-2 bg-muted rounded-lg">
                {getChannelIcon(channel.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-foreground truncate">
                  {channel.name}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {channel.description || 'No description'}
                </p>
              </div>
              <div className="flex-shrink-0">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {channel.members?.length || 0}
                </span>
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
          className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
        >
          <div className="p-1 bg-muted rounded">
            {getChannelIcon(selectedChannel.type)}
          </div>
          <div className="text-left">
            <h3 className="text-sm font-medium text-foreground">{selectedChannel.name}</h3>
            <p className="text-xs text-muted-foreground">{selectedChannel.members?.length || 0} members</p>
          </div>
        </button>
        
        <button className="p-2 rounded-md hover:bg-muted transition-colors">
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
              messages[index - 1].senderId === message.senderId &&
              new Date(message.sentAt).getTime() - new Date(messages[index - 1].sentAt).getTime() < 300000; // 5 minutes

            return (
              <div key={message.id} className={`flex space-x-3 ${isConsecutive ? 'mt-1' : 'mt-4'}`}>
                {!isConsecutive && (
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-600 font-medium text-xs">
                      {getInitials(getMemberName(message.senderId))}
                    </span>
                  </div>
                )}
                
                <div className={`flex-1 ${isConsecutive ? 'ml-11' : ''}`}>
                  {!isConsecutive && (
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-foreground">
                        {getMemberName(message.senderId)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatMessageTime(message.sentAt)}
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
              className="p-2 rounded-md hover:bg-muted transition-colors"
            >
              <PhotoIcon className="w-5 h-5 text-muted-foreground" />
            </button>
            <button className="p-2 rounded-md hover:bg-muted transition-colors">
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
              className="w-full px-3 py-2 border border-input rounded-lg focus-visible:ring-ring focus-visible:border-primary resize-none"
              style={{ minHeight: '40px', maxHeight: '120px' }}
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
            className={`p-2 rounded-md transition-colors ${
              isRecording ? 'bg-red-100 text-red-600' : 'hover:bg-muted text-muted-foreground'
            }`}
          >
            <MicrophoneIcon className="w-5 h-5" />
          </button>

          {/* Send button */}
          <button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sendMessageMutation.isPending}
            className="p-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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