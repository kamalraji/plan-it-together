import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TrainingSession {
  id: string;
  title: string;
  type: 'in-person' | 'virtual' | 'self-paced';
  date: string;
  time: string;
  duration: string;
  location?: string;
  instructor: string;
  enrolled: number;
  capacity: number;
  status: 'upcoming' | 'in-progress' | 'completed';
}

export interface TrainingSessionFormData {
  title: string;
  type: 'in-person' | 'virtual' | 'self-paced';
  date: string;
  time: string;
  duration: string;
  location?: string;
  instructor: string;
  capacity: number;
}

export interface TrainingEnrollment {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  status: string;
  completedAt?: string;
}

// Training metadata prefix for description field
const TRAINING_PREFIX = '[[TRAINING]]';

interface TrainingMetadata {
  is_training: true;
  training_type: 'in-person' | 'virtual' | 'self-paced';
  duration: string;
  instructor: string;
  completed?: boolean;
  completed_at?: string;
  display_description?: string;
}

function encodeTrainingDescription(metadata: TrainingMetadata, displayDesc?: string): string {
  const data = { ...metadata, display_description: displayDesc };
  return `${TRAINING_PREFIX}${JSON.stringify(data)}`;
}

function decodeTrainingDescription(description: string | null): { metadata: TrainingMetadata | null; displayDescription: string } {
  if (!description || !description.startsWith(TRAINING_PREFIX)) {
    return { metadata: null, displayDescription: description || '' };
  }
  
  try {
    const jsonStr = description.slice(TRAINING_PREFIX.length);
    const metadata = JSON.parse(jsonStr) as TrainingMetadata;
    return { 
      metadata, 
      displayDescription: metadata.display_description || '' 
    };
  } catch {
    return { metadata: null, displayDescription: description };
  }
}

export function useTrainingSessions(workspaceId: string) {
  const queryClient = useQueryClient();

  // Fetch all training sessions with enrollment counts
  const sessionsQuery = useQuery({
    queryKey: ['training-sessions', workspaceId],
    queryFn: async (): Promise<TrainingSession[]> => {
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('volunteer_shifts')
        .select('id, name, date, start_time, end_time, location, required_volunteers, description')
        .eq('workspace_id', workspaceId)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (sessionsError) throw sessionsError;
      
      // Filter for training sessions (those with training metadata in description)
      const trainingSessions = (sessionsData || []).filter(s => {
        return s.description?.startsWith(TRAINING_PREFIX);
      });

      if (!trainingSessions.length) return [];

      const sessionIds = trainingSessions.map(s => s.id);
      const { data: enrollmentsData } = await supabase
        .from('volunteer_assignments')
        .select('shift_id, status')
        .in('shift_id', sessionIds)
        .neq('status', 'CANCELLED');

      const enrollmentCounts = (enrollmentsData || []).reduce((acc, a) => {
        acc[a.shift_id] = (acc[a.shift_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const now = new Date();
      
      return trainingSessions.map(session => {
        const { metadata } = decodeTrainingDescription(session.description);
        const sessionDate = new Date(session.date);
        const isCompleted = metadata?.completed === true;
        
        let status: 'upcoming' | 'in-progress' | 'completed' = 'upcoming';
        if (isCompleted) {
          status = 'completed';
        } else if (sessionDate <= now && !isCompleted) {
          status = 'in-progress';
        }

        return {
          id: session.id,
          title: session.name,
          type: metadata?.training_type || 'in-person',
          date: session.date,
          time: session.start_time || 'TBD',
          duration: metadata?.duration || '1 hour',
          location: session.location || undefined,
          instructor: metadata?.instructor || 'TBD',
          capacity: session.required_volunteers || 20,
          enrolled: enrollmentCounts[session.id] || 0,
          status,
        };
      });
    },
    enabled: !!workspaceId,
  });

  // Training stats
  const stats = {
    totalSessions: sessionsQuery.data?.length || 0,
    upcomingSessions: sessionsQuery.data?.filter(s => s.status === 'upcoming').length || 0,
    totalEnrolled: sessionsQuery.data?.reduce((acc, s) => acc + s.enrolled, 0) || 0,
    completedSessions: sessionsQuery.data?.filter(s => s.status === 'completed').length || 0,
  };

  // Create training session
  const createSession = useMutation({
    mutationFn: async (data: TrainingSessionFormData) => {
      const trainingDesc = encodeTrainingDescription({
        is_training: true,
        training_type: data.type,
        duration: data.duration,
        instructor: data.instructor,
        completed: false,
      }, `Training session: ${data.title}`);

      const { error } = await supabase
        .from('volunteer_shifts')
        .insert({
          workspace_id: workspaceId,
          name: data.title,
          date: data.date,
          start_time: data.time,
          end_time: data.time, // Simplified - same as start for now
          required_volunteers: data.capacity,
          location: data.location || null,
          description: trainingDesc,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Training session created');
      queryClient.invalidateQueries({ queryKey: ['training-sessions', workspaceId] });
    },
    onError: (error) => {
      console.error('Error creating training session:', error);
      toast.error('Failed to create training session');
    },
  });

  // Update training session
  const updateSession = useMutation({
    mutationFn: async ({ sessionId, data }: { sessionId: string; data: TrainingSessionFormData }) => {
      const trainingDesc = encodeTrainingDescription({
        is_training: true,
        training_type: data.type,
        duration: data.duration,
        instructor: data.instructor,
      }, `Training session: ${data.title}`);

      const { error } = await supabase
        .from('volunteer_shifts')
        .update({
          name: data.title,
          date: data.date,
          start_time: data.time,
          required_volunteers: data.capacity,
          location: data.location || null,
          description: trainingDesc,
        })
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Training session updated');
      queryClient.invalidateQueries({ queryKey: ['training-sessions', workspaceId] });
    },
    onError: (error) => {
      console.error('Error updating training session:', error);
      toast.error('Failed to update training session');
    },
  });

  // Delete training session
  const deleteSession = useMutation({
    mutationFn: async (sessionId: string) => {
      // First delete all enrollments
      await supabase
        .from('volunteer_assignments')
        .delete()
        .eq('shift_id', sessionId);

      const { error } = await supabase
        .from('volunteer_shifts')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Training session deleted');
      queryClient.invalidateQueries({ queryKey: ['training-sessions', workspaceId] });
    },
    onError: (error) => {
      console.error('Error deleting training session:', error);
      toast.error('Failed to delete training session');
    },
  });

  // Mark session as completed
  const completeSession = useMutation({
    mutationFn: async (sessionId: string) => {
      // Get current session
      const { data: session } = await supabase
        .from('volunteer_shifts')
        .select('description')
        .eq('id', sessionId)
        .single();

      const { metadata } = decodeTrainingDescription(session?.description || null);
      
      if (metadata) {
        const updatedDesc = encodeTrainingDescription({
          ...metadata,
          completed: true,
          completed_at: new Date().toISOString(),
        });

        const { error } = await supabase
          .from('volunteer_shifts')
          .update({ description: updatedDesc })
          .eq('id', sessionId);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Training session marked as complete');
      queryClient.invalidateQueries({ queryKey: ['training-sessions', workspaceId] });
    },
    onError: (error) => {
      console.error('Error completing session:', error);
      toast.error('Failed to complete session');
    },
  });

  // Enroll user in training
  const enrollUser = useMutation({
    mutationFn: async ({ sessionId, userId }: { sessionId: string; userId: string }) => {
      const { error } = await supabase
        .from('volunteer_assignments')
        .insert({
          shift_id: sessionId,
          user_id: userId,
          status: 'CONFIRMED',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Enrolled in training');
      queryClient.invalidateQueries({ queryKey: ['training-sessions', workspaceId] });
    },
    onError: (error) => {
      console.error('Error enrolling:', error);
      toast.error('Failed to enroll');
    },
  });

  // Get session enrollments
  const getSessionEnrollments = async (sessionId: string): Promise<TrainingEnrollment[]> => {
    const { data: enrollments, error } = await supabase
      .from('volunteer_assignments')
      .select('id, shift_id, user_id, status, check_out_time')
      .eq('shift_id', sessionId)
      .neq('status', 'CANCELLED');

    if (error) throw error;
    if (!enrollments?.length) return [];

    const userIds = enrollments.map(e => e.user_id);
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, full_name')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

    return enrollments.map(e => ({
      id: e.id,
      sessionId: e.shift_id,
      userId: e.user_id,
      userName: profileMap.get(e.user_id) || 'Unknown',
      status: e.status,
      completedAt: e.check_out_time || undefined,
    }));
  };

  return {
    sessions: sessionsQuery.data || [],
    isLoading: sessionsQuery.isLoading,
    stats,
    createSession,
    updateSession,
    deleteSession,
    completeSession,
    enrollUser,
    getSessionEnrollments,
  };
}
