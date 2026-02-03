import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VoiceParticipant {
  id: string;
  oderId: string;
  name: string;
  avatarUrl?: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  isScreenSharing: boolean;
  isHost?: boolean;
}

interface VoiceChannelState {
  channelId: string | null;
  sessionId: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  isScreenSharing: boolean;
  participants: VoiceParticipant[];
  error: string | null;
}

interface UseVoiceChannelOptions {
  workspaceId: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
}

export function useVoiceChannel(options: UseVoiceChannelOptions) {
  const { userId } = options;
  const { toast } = useToast();
  const [state, setState] = useState<VoiceChannelState>({
    channelId: null,
    sessionId: null,
    isConnected: false,
    isConnecting: false,
    isMuted: false,
    isDeafened: false,
    isScreenSharing: false,
    participants: [],
    error: null,
  });

  const agoraClientRef = useRef<any>(null);
  const localAudioTrackRef = useRef<any>(null);

  // Fetch Agora token from edge function
  const getAgoraToken = useCallback(async (channelName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('agora-token', {
        body: { channelName, role: 'publisher' },
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error getting Agora token:', err);
      throw err;
    }
  }, []);

  // Update participants list
  const updateParticipantsList = useCallback(async (sessionId: string) => {
    const { data: participants } = await supabase
      .from('workspace_voice_participants')
      .select(`
        id,
        user_id,
        is_muted,
        is_deafened,
        is_speaking,
        is_screen_sharing
      `)
      .eq('voice_session_id', sessionId)
      .is('left_at', null);

    if (participants) {
      // Fetch user details
      const userIds = participants.map(p => p.user_id);
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      setState(prev => ({
        ...prev,
        participants: participants.map(p => {
          const profile = profilesMap.get(p.user_id);
          return {
            id: p.id,
            oderId: p.user_id,
            name: profile?.full_name || 'Unknown',
            avatarUrl: profile?.avatar_url ?? undefined,
            isMuted: p.is_muted ?? false,
            isDeafened: p.is_deafened ?? false,
            isSpeaking: p.is_speaking ?? false,
            isScreenSharing: p.is_screen_sharing ?? false,
          };
        }),
      }));
    }
  }, []);

  // Join voice channel
  const joinChannel = useCallback(async (voiceChannelId: string) => {
    if (state.isConnected || state.isConnecting) return;

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Get voice channel details
      const { data: voiceChannel, error: channelError } = await supabase
        .from('workspace_voice_channels')
        .select('*')
        .eq('id', voiceChannelId)
        .single();

      if (channelError) throw channelError;

      // Get or create active session
      const { data: existingSession } = await supabase
        .from('workspace_voice_sessions')
        .select('*')
        .eq('voice_channel_id', voiceChannelId)
        .is('ended_at', null)
        .single();

      let session = existingSession;

      if (!session) {
        const { data: newSession, error: createError } = await supabase
          .from('workspace_voice_sessions')
          .insert({
            voice_channel_id: voiceChannelId,
          })
          .select()
          .single();

        if (createError) throw createError;
        session = newSession;
      }

      // Add participant to session
      const { error: participantError } = await supabase
        .from('workspace_voice_participants')
        .upsert({
          voice_session_id: session.id,
          user_id: userId,
          is_muted: false,
          is_deafened: false,
        });

      if (participantError) throw participantError;

      // Get Agora token
      const tokenData = await getAgoraToken(voiceChannel.agora_channel_name);

      // Initialize Agora (dynamic import to avoid SSR issues)
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
      
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      agoraClientRef.current = client;

      // Join Agora channel
      await client.join(tokenData.appId, voiceChannel.agora_channel_name, tokenData.token, userId);

      // Create and publish audio track
      const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      localAudioTrackRef.current = localAudioTrack;
      await client.publish([localAudioTrack]);

      // Set up event handlers
      client.on('user-published', async (user: any, mediaType: "audio" | "video") => {
        await client.subscribe(user, mediaType);
        if (mediaType === 'audio') {
          user.audioTrack?.play();
        }
        updateParticipantsList(session.id);
      });

      client.on('user-unpublished', () => {
        updateParticipantsList(session.id);
      });

      client.on('user-left', () => {
        updateParticipantsList(session.id);
      });

      setState(prev => ({
        ...prev,
        channelId: voiceChannelId,
        sessionId: session.id,
        isConnected: true,
        isConnecting: false,
      }));

      toast({
        title: 'Joined voice channel',
        description: `Connected to ${voiceChannel.name}`,
      });

      // Start listening for participant updates
      updateParticipantsList(session.id);
    } catch (err: any) {
      console.error('Error joining voice channel:', err);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: err.message || 'Failed to join voice channel',
      }));
      toast({
        title: 'Failed to join',
        description: err.message || 'Could not connect to voice channel',
        variant: 'destructive',
      });
    }
  }, [state.isConnected, state.isConnecting, userId, getAgoraToken, toast, updateParticipantsList]);

  // Leave voice channel
  const leaveChannel = useCallback(async () => {
    if (!state.isConnected || !state.sessionId) return;

    try {
      // Stop and close local audio track
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop();
        localAudioTrackRef.current.close();
        localAudioTrackRef.current = null;
      }

      // Leave Agora channel
      if (agoraClientRef.current) {
        await agoraClientRef.current.leave();
        agoraClientRef.current = null;
      }

      // Update participant record
      await supabase
        .from('workspace_voice_participants')
        .update({ left_at: new Date().toISOString() })
        .eq('voice_session_id', state.sessionId)
        .eq('user_id', userId);

      // Check if session should be ended (no more participants)
      const { data: remainingParticipants } = await supabase
        .from('workspace_voice_participants')
        .select('id')
        .eq('voice_session_id', state.sessionId)
        .is('left_at', null);

      if (!remainingParticipants || remainingParticipants.length === 0) {
        await supabase
          .from('workspace_voice_sessions')
          .update({ ended_at: new Date().toISOString() })
          .eq('id', state.sessionId);
      }

      setState({
        channelId: null,
        sessionId: null,
        isConnected: false,
        isConnecting: false,
        isMuted: false,
        isDeafened: false,
        isScreenSharing: false,
        participants: [],
        error: null,
      });

      toast({
        title: 'Left voice channel',
      });
    } catch (err: any) {
      console.error('Error leaving voice channel:', err);
      toast({
        title: 'Error leaving channel',
        description: err.message,
        variant: 'destructive',
      });
    }
  }, [state.isConnected, state.sessionId, userId, toast]);

  // Toggle mute
  const toggleMute = useCallback(async () => {
    if (!localAudioTrackRef.current) return;

    const newMuted = !state.isMuted;
    localAudioTrackRef.current.setEnabled(!newMuted);

    // Update database
    if (state.sessionId) {
      await supabase
        .from('workspace_voice_participants')
        .update({ is_muted: newMuted })
        .eq('voice_session_id', state.sessionId)
        .eq('user_id', userId);
    }

    setState(prev => ({ ...prev, isMuted: newMuted }));
  }, [state.isMuted, state.sessionId, userId]);

  // Toggle deafen
  const toggleDeafen = useCallback(async () => {
    const newDeafened = !state.isDeafened;

    // Mute all remote audio tracks
    if (agoraClientRef.current) {
      agoraClientRef.current.remoteUsers.forEach((user: any) => {
        if (user.audioTrack) {
          user.audioTrack.setVolume(newDeafened ? 0 : 100);
        }
      });
    }

    // Update database
    if (state.sessionId) {
      await supabase
        .from('workspace_voice_participants')
        .update({ is_deafened: newDeafened })
        .eq('voice_session_id', state.sessionId)
        .eq('user_id', userId);
    }

    setState(prev => ({ ...prev, isDeafened: newDeafened }));
  }, [state.isDeafened, state.sessionId, userId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.isConnected) {
        leaveChannel();
      }
    };
  }, []);

  return {
    ...state,
    joinChannel,
    leaveChannel,
    toggleMute,
    toggleDeafen,
  };
}
