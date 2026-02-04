import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

// Types
export interface Speaker {
  id: string;
  workspace_id: string;
  name: string;
  avatar_url: string | null;
  role: string | null;
  bio: string | null;
  email: string | null;
  phone: string | null;
  session_title: string | null;
  session_time: string | null;
  location: string | null;
  status: 'pending' | 'confirmed' | 'cancelled';
  travel_arranged: boolean;
  accommodation_arranged: boolean;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  bio_submitted: boolean | null;
  photo_submitted: boolean | null;
  presentation_submitted: boolean | null;
  av_requirements_submitted: boolean | null;
  bio_approved: boolean | null;
  photo_approved: boolean | null;
  presentation_approved: boolean | null;
  av_requirements_approved: boolean | null;
  bio_url: string | null;
  photo_url: string | null;
  presentation_url: string | null;
  av_requirements_text: string | null;
  session_duration: string | null;
  session_type: string | null;
  room: string | null;
  created_at: string;
  updated_at: string;
}

export interface SpeakerTravel {
  id: string;
  speaker_id: string;
  workspace_id: string;
  flight_status: 'confirmed' | 'pending' | 'not_needed';
  flight_details: string | null;
  flight_number: string | null;
  arrival_time: string | null;
  departure_time: string | null;
  hotel_status: 'confirmed' | 'pending' | 'not_needed';
  hotel_details: string | null;
  hotel_name: string | null;
  check_in_date: string | null;
  check_out_date: string | null;
  transport_status: 'confirmed' | 'pending' | 'not_needed';
  transport_details: string | null;
  transport_type: string | null;
  meals_status: 'confirmed' | 'pending' | 'not_needed';
  meals_details: string | null;
  dietary_requirements: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined speaker data
  speaker?: Speaker;
}

export interface SpeakerCommunication {
  id: string;
  speaker_id: string;
  workspace_id: string;
  type: 'email' | 'call' | 'message';
  subject: string;
  content: string | null;
  status: 'sent' | 'read' | 'replied' | 'pending';
  sent_by: string | null;
  sent_by_name: string | null;
  created_at: string;
  updated_at: string;
  // Joined speaker data
  speaker?: Speaker;
}

export interface SpeakerSession {
  id: string;
  speaker_id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  session_type: 'keynote' | 'workshop' | 'panel' | 'breakout' | 'fireside';
  scheduled_date: string | null;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  room: string | null;
  location: string | null;
  is_published: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined speaker data
  speaker?: Speaker;
}

// ============ SPEAKERS ============

export function useSpeakerLiaisonSpeakers(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['speaker-liaison-speakers', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('workspace_speakers')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('name');

      if (error) throw error;
      return data as Speaker[];
    },
    enabled: !!workspaceId,
  });
}

export function useCreateSpeaker(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (speaker: { name: string; email?: string; phone?: string; role?: string; bio?: string; session_title?: string; status?: string }) => {
      if (!workspaceId) throw new Error('Workspace ID required');
      const { data, error } = await supabase
        .from('workspace_speakers')
        .insert([{ ...speaker, workspace_id: workspaceId, status: speaker.status || 'pending' }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['speaker-liaison-speakers', workspaceId] });
      toast.success('Speaker added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add speaker: ' + error.message);
    },
  });
}

export function useUpdateSpeaker(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { error } = await supabase
        .from('workspace_speakers')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['speaker-liaison-speakers', workspaceId] });
      toast.success('Speaker updated');
    },
    onError: (error) => {
      toast.error('Failed to update speaker: ' + error.message);
    },
  });
}

export function useDeleteSpeaker(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (speakerId: string) => {
      const { error } = await supabase
        .from('workspace_speakers')
        .delete()
        .eq('id', speakerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['speaker-liaison-speakers', workspaceId] });
      toast.success('Speaker removed');
    },
    onError: (error) => {
      toast.error('Failed to remove speaker: ' + error.message);
    },
  });
}

// ============ TRAVEL LOGISTICS ============

export function useSpeakerTravel(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['speaker-travel', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('speaker_travel')
        .select(`
          *,
          speaker:workspace_speakers(id, name, email, status)
        `)
        .eq('workspace_id', workspaceId);

      if (error) throw error;
      return data as SpeakerTravel[];
    },
    enabled: !!workspaceId,
  });
}

export function useUpsertSpeakerTravel(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (travel: Partial<SpeakerTravel> & { speaker_id: string }) => {
      if (!workspaceId) throw new Error('Workspace ID required');
      
      // Check if travel record exists for this speaker
      const { data: existing } = await supabase
        .from('speaker_travel')
        .select('id')
        .eq('speaker_id', travel.speaker_id)
        .eq('workspace_id', workspaceId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('speaker_travel')
          .update({ ...travel, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('speaker_travel')
          .insert([{ ...travel, workspace_id: workspaceId }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['speaker-travel', workspaceId] });
      toast.success('Travel details updated');
    },
    onError: (error) => {
      toast.error('Failed to update travel: ' + error.message);
    },
  });
}

// ============ COMMUNICATIONS ============

export function useSpeakerCommunications(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['speaker-communications', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('speaker_communications')
        .select(`
          *,
          speaker:workspace_speakers(id, name, email)
        `)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SpeakerCommunication[];
    },
    enabled: !!workspaceId,
  });
}

export function useCreateCommunication(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (comm: { speaker_id: string; type: 'email' | 'call' | 'message'; subject: string; content?: string; status?: string }) => {
      if (!workspaceId) throw new Error('Workspace ID required');
      const { error } = await supabase
        .from('speaker_communications')
        .insert([{
          ...comm,
          workspace_id: workspaceId,
          sent_by: user?.id,
          sent_by_name: user?.email,
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['speaker-communications', workspaceId] });
      toast.success('Communication logged');
    },
    onError: (error) => {
      toast.error('Failed to log communication: ' + error.message);
    },
  });
}

export function useUpdateCommunicationStatus(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('speaker_communications')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['speaker-communications', workspaceId] });
    },
  });
}

// ============ SESSIONS ============

export function useSpeakerSessions(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['speaker-sessions', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('speaker_sessions')
        .select(`
          *,
          speaker:workspace_speakers(id, name, email, status, avatar_url)
        `)
        .eq('workspace_id', workspaceId)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      return data as SpeakerSession[];
    },
    enabled: !!workspaceId,
  });
}

export function useCreateSession(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (session: { speaker_id: string; title: string; description?: string; session_type?: string; scheduled_date?: string; start_time?: string; end_time?: string; room?: string }) => {
      if (!workspaceId) throw new Error('Workspace ID required');
      const { error } = await supabase
        .from('speaker_sessions')
        .insert([{ ...session, workspace_id: workspaceId }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['speaker-sessions', workspaceId] });
      toast.success('Session created');
    },
    onError: (error) => {
      toast.error('Failed to create session: ' + error.message);
    },
  });
}

export function useUpdateSession(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SpeakerSession> & { id: string }) => {
      const { error } = await supabase
        .from('speaker_sessions')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['speaker-sessions', workspaceId] });
      toast.success('Session updated');
    },
    onError: (error) => {
      toast.error('Failed to update session: ' + error.message);
    },
  });
}

export function useDeleteSession(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('speaker_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['speaker-sessions', workspaceId] });
      toast.success('Session deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete session: ' + error.message);
    },
  });
}

// ============ STATS ============

export function useSpeakerLiaisonStats(workspaceId: string | undefined) {
  const { data: speakers } = useSpeakerLiaisonSpeakers(workspaceId);
  const { data: sessions } = useSpeakerSessions(workspaceId);
  const { data: travel } = useSpeakerTravel(workspaceId);

  const totalSpeakers = speakers?.length || 0;
  const confirmedSpeakers = speakers?.filter(s => s.status === 'confirmed').length || 0;
  const pendingSpeakers = speakers?.filter(s => s.status === 'pending').length || 0;
  const sessionsScheduled = sessions?.length || 0;
  
  // Calculate pending requirements (materials not submitted)
  const pendingRequirements = speakers?.reduce((count, s) => {
    let pending = 0;
    if (!s.bio_submitted) pending++;
    if (!s.photo_submitted) pending++;
    if (!s.presentation_submitted) pending++;
    if (!s.av_requirements_submitted) pending++;
    return count + pending;
  }, 0) || 0;

  // Travel stats
  const travelConfirmed = travel?.filter(t => 
    t.flight_status === 'confirmed' || t.hotel_status === 'confirmed'
  ).length || 0;
  const travelPending = travel?.filter(t => 
    t.flight_status === 'pending' || t.hotel_status === 'pending'
  ).length || 0;

  return {
    totalSpeakers,
    confirmedSpeakers,
    pendingSpeakers,
    sessionsScheduled,
    pendingRequirements,
    travelConfirmed,
    travelPending,
  };
}

// ============ MATERIALS STATS ============

export function useMaterialsStats(workspaceId: string | undefined) {
  const { data: speakers } = useSpeakerLiaisonSpeakers(workspaceId);

  const materials = speakers?.map(s => ({
    speakerId: s.id,
    speakerName: s.name,
    bio: { submitted: s.bio_submitted, approved: s.bio_approved },
    photo: { submitted: s.photo_submitted, approved: s.photo_approved },
    presentation: { submitted: s.presentation_submitted, approved: s.presentation_approved },
    avRequirements: { submitted: s.av_requirements_submitted, approved: s.av_requirements_approved },
  })) || [];

  const totalItems = materials.length * 4;
  const approvedItems = materials.reduce((sum, m) => {
    return sum + [m.bio, m.photo, m.presentation, m.avRequirements].filter(i => i.approved).length;
  }, 0);
  const submittedItems = materials.reduce((sum, m) => {
    return sum + [m.bio, m.photo, m.presentation, m.avRequirements].filter(i => i.submitted).length;
  }, 0);

  return {
    materials,
    totalItems,
    approvedItems,
    submittedItems,
  };
}

// ============ BULK ACTIONS ============

export function useSendBulkReminder(workspaceId: string | undefined) {
  const createCommunication = useCreateCommunication(workspaceId);

  return useMutation({
    mutationFn: async (speakerIds: string[]) => {
      const promises = speakerIds.map(speakerId =>
        createCommunication.mutateAsync({
          speaker_id: speakerId,
          type: 'email',
          subject: 'Reminder: Please submit your materials',
          status: 'sent',
        })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast.success('Reminders sent to selected speakers');
    },
    onError: (error) => {
      toast.error('Failed to send reminders: ' + error.message);
    },
  });
}
