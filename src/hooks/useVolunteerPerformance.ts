import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VolunteerPerformance {
  id: string;
  name: string;
  shiftsCompleted: number;
  shiftsAssigned: number;
  hoursLogged: number;
  attendanceRate: number;
  rating: number;
  kudosReceived: number;
  rank: number;
}

export function useVolunteerPerformance(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['volunteer-performance', workspaceId],
    queryFn: async (): Promise<VolunteerPerformance[]> => {
      if (!workspaceId) return [];

      // Get team members
      const { data: members } = await supabase
        .from('workspace_team_members')
        .select('id, user_id, role')
        .eq('workspace_id', workspaceId);

      if (!members?.length) return [];

      // Get user profiles for names
      const userIds = members.map(m => m.user_id).filter(Boolean);
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      // Get completed tasks as proxy for performance
      const { data: tasks } = await supabase
        .from('workspace_tasks')
        .select('id, assigned_to, status, updated_at, actual_hours_logged')
        .eq('workspace_id', workspaceId);

      // Build performance data based on task completion
      const performanceData: VolunteerPerformance[] = members.map(member => {
        const profile = profiles?.find(p => p.id === member.user_id);
        const memberName = profile?.full_name || profile?.email || member.role || 'Team Member';

        // Calculate task-based stats using assigned_to (user_id)
        const memberTasks = tasks?.filter(t => t.assigned_to === member.user_id) || [];
        const shiftsAssigned = memberTasks.length;
        const shiftsCompleted = memberTasks.filter(t => t.status === 'completed' || t.status === 'done').length;

        // Sum actual hours or estimate
        const hoursLogged = memberTasks.reduce((sum, t) => sum + (t.actual_hours_logged || 2), 0);

        // Calculate attendance rate
        const attendanceRate = shiftsAssigned > 0 
          ? Math.round((shiftsCompleted / shiftsAssigned) * 100) 
          : 100;

        return {
          id: member.id,
          name: memberName,
          shiftsCompleted,
          shiftsAssigned,
          hoursLogged,
          attendanceRate,
          rating: 4 + (Math.random() * 0.9), // Placeholder rating 4.0-4.9
          kudosReceived: Math.max(0, Math.floor(shiftsCompleted / 2)), // Placeholder
          rank: 0, // Will be calculated below
        };
      });

      // Sort by hours logged and assign ranks
      const sorted = performanceData.sort((a, b) => b.hoursLogged - a.hoursLogged);
      sorted.forEach((p, idx) => {
        p.rank = idx + 1;
      });

      return sorted;
    },
    enabled: !!workspaceId,
  });
}

export function usePerformanceStats(workspaceId: string | undefined) {
  const { data: performance = [] } = useVolunteerPerformance(workspaceId);

  const totalHours = performance.reduce((acc, v) => acc + v.hoursLogged, 0);
  const avgAttendance = performance.length > 0
    ? Math.round(performance.reduce((acc, v) => acc + v.attendanceRate, 0) / performance.length)
    : 0;
  const totalKudos = performance.reduce((acc, v) => acc + v.kudosReceived, 0);

  return {
    totalHours,
    avgAttendance,
    totalKudos,
    activeVolunteers: performance.length,
  };
}
