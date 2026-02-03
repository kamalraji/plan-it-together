import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';

export interface RunsheetCue {
  id: string;
  workspaceId: string;
  eventId: string | null;
  scheduledTime: string;
  durationMinutes: number;
  title: string;
  description: string | null;
  cueType: 'audio' | 'visual' | 'lighting' | 'stage' | 'general';
  technicianId: string | null;
  technicianName: string | null;
  status: 'upcoming' | 'live' | 'completed' | 'delayed' | 'skipped';
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  orderIndex: number;
}

interface UseRunsheetOptions {
  workspaceId: string;
  eventId?: string;
}

export function useRunsheet({ workspaceId, eventId }: UseRunsheetOptions) {
  const queryClient = useQueryClient();
  const queryKey = ['runsheet', workspaceId, eventId];

  // Fetch cues with technician names
  const { data: cues = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const query = supabase
        .from('workspace_runsheet_cues')
        .select(`
          *,
          technician:technician_id(
            id,
            full_name
          )
        `)
        .eq('workspace_id', workspaceId)
        .order('scheduled_time', { ascending: true })
        .order('order_index', { ascending: true });

      if (eventId) {
        query.eq('event_id', eventId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((cue: any) => ({
        id: cue.id,
        workspaceId: cue.workspace_id,
        eventId: cue.event_id,
        scheduledTime: cue.scheduled_time,
        durationMinutes: cue.duration_minutes,
        title: cue.title,
        description: cue.description,
        cueType: cue.cue_type,
        technicianId: cue.technician_id,
        technicianName: cue.technician?.full_name || null,
        status: cue.status,
        startedAt: cue.started_at,
        completedAt: cue.completed_at,
        notes: cue.notes,
        orderIndex: cue.order_index,
      })) as RunsheetCue[];
    },
    enabled: !!workspaceId,
  });

  // Fetch team members for assignment
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['workspace-team', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_team_members')
        .select(`
          user_id,
          user_profiles:user_id(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('workspace_id', workspaceId)
        .eq('status', 'ACTIVE');

      if (error) throw error;

      return (data || []).map((m: any) => ({
        id: m.user_id,
        name: m.user_profiles?.full_name || 'Unknown',
        avatar: m.user_profiles?.avatar_url,
      }));
    },
    enabled: !!workspaceId,
  });

  // Calculate stats
  const stats = useMemo(() => {
    const total = cues.length;
    const completed = cues.filter(c => c.status === 'completed').length;
    const live = cues.filter(c => c.status === 'live').length;
    const upcoming = cues.filter(c => c.status === 'upcoming').length;
    const delayed = cues.filter(c => c.status === 'delayed').length;
    
    return { total, completed, live, upcoming, delayed };
  }, [cues]);

  // Get current live cue
  const currentCue = useMemo(() => {
    return cues.find(c => c.status === 'live') || null;
  }, [cues]);

  // Real-time subscription
  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase
      .channel(`runsheet-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_runsheet_cues',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient, queryKey]);

  // Create cue
  const createCue = useMutation({
    mutationFn: async (cue: {
      scheduledTime: string;
      durationMinutes?: number;
      title: string;
      description?: string;
      cueType?: string;
      technicianId?: string;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('workspace_runsheet_cues')
        .insert({
          workspace_id: workspaceId,
          event_id: eventId || null,
          scheduled_time: cue.scheduledTime,
          duration_minutes: cue.durationMinutes || 5,
          title: cue.title,
          description: cue.description || null,
          cue_type: cue.cueType || 'general',
          technician_id: cue.technicianId || null,
          notes: cue.notes || null,
          created_by: user?.id,
          order_index: cues.length,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Cue added');
    },
    onError: (error) => {
      toast.error('Failed to add cue: ' + error.message);
    },
  });

  // Update cue
  const updateCue = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RunsheetCue> & { id: string }) => {
      const dbUpdates: Record<string, any> = {};
      
      if (updates.scheduledTime !== undefined) dbUpdates.scheduled_time = updates.scheduledTime;
      if (updates.durationMinutes !== undefined) dbUpdates.duration_minutes = updates.durationMinutes;
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.cueType !== undefined) dbUpdates.cue_type = updates.cueType;
      if (updates.technicianId !== undefined) dbUpdates.technician_id = updates.technicianId;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.startedAt !== undefined) dbUpdates.started_at = updates.startedAt;
      if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.orderIndex !== undefined) dbUpdates.order_index = updates.orderIndex;

      const { error } = await supabase
        .from('workspace_runsheet_cues')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      toast.error('Failed to update cue: ' + error.message);
    },
  });

  // Delete cue
  const deleteCue = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_runsheet_cues')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Cue deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete cue: ' + error.message);
    },
  });

  // Start cue (set to live)
  const startCue = async (id: string) => {
    // First, complete any currently live cues
    const liveCues = cues.filter(c => c.status === 'live');
    for (const cue of liveCues) {
      await updateCue.mutateAsync({
        id: cue.id,
        status: 'completed',
        completedAt: new Date().toISOString(),
      });
    }

    // Then start the new cue
    await updateCue.mutateAsync({
      id,
      status: 'live',
      startedAt: new Date().toISOString(),
    });
    toast.success('Cue started');
  };

  // Complete cue
  const completeCue = async (id: string) => {
    await updateCue.mutateAsync({
      id,
      status: 'completed',
      completedAt: new Date().toISOString(),
    });
    toast.success('Cue completed');
  };

  // Skip cue
  const skipCue = async (id: string) => {
    await updateCue.mutateAsync({
      id,
      status: 'skipped',
    });
    toast.info('Cue skipped');
  };

  // Mark cue as delayed
  const delayCue = async (id: string) => {
    await updateCue.mutateAsync({
      id,
      status: 'delayed',
    });
    toast.warning('Cue marked as delayed');
  };

  // Reset all cues
  const resetAllCues = async () => {
    const promises = cues.map(cue =>
      supabase
        .from('workspace_runsheet_cues')
        .update({
          status: 'upcoming',
          started_at: null,
          completed_at: null,
        })
        .eq('id', cue.id)
    );

    await Promise.all(promises);
    queryClient.invalidateQueries({ queryKey });
    toast.success('All cues reset');
  };

  // Create default template
  const createDefaultTemplate = async () => {
    const defaultCues = [
      { time: '08:00', duration: 30, title: 'Venue Open / Tech Setup', description: 'Final equipment checks and setup', type: 'general' },
      { time: '08:30', duration: 30, title: 'AV System Warmup', description: 'Power on all AV systems, run diagnostics', type: 'audio' },
      { time: '09:00', duration: 15, title: 'Speaker Mic Check', description: 'Test all wireless mics with speakers', type: 'audio' },
      { time: '09:15', duration: 45, title: 'Opening Ceremony Support', description: 'Manage lighting and audio cues', type: 'lighting' },
      { time: '10:00', duration: 60, title: 'Keynote Session', description: 'Full AV support, live streaming', type: 'visual' },
      { time: '11:00', duration: 30, title: 'Breakout Room Setup', description: 'Configure displays in breakout rooms', type: 'visual' },
    ];

    const { data: { user } } = await supabase.auth.getUser();

    for (let i = 0; i < defaultCues.length; i++) {
      const cue = defaultCues[i];
      await supabase.from('workspace_runsheet_cues').insert({
        workspace_id: workspaceId,
        event_id: eventId || null,
        scheduled_time: cue.time,
        duration_minutes: cue.duration,
        title: cue.title,
        description: cue.description,
        cue_type: cue.type,
        order_index: i,
        created_by: user?.id,
      });
    }

    queryClient.invalidateQueries({ queryKey });
    toast.success('Default template created');
  };

  return {
    cues,
    currentCue,
    stats,
    teamMembers,
    isLoading,
    isSaving: createCue.isPending || updateCue.isPending || deleteCue.isPending,
    createCue,
    updateCue,
    deleteCue,
    startCue,
    completeCue,
    skipCue,
    delayCue,
    resetAllCues,
    createDefaultTemplate,
  };
}
