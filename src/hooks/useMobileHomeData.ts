import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationFeed } from '@/hooks/useNotificationFeed';
import { startOfDay, endOfDay, addDays } from 'date-fns';

interface TodayEvent {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  organization_id: string;
}

interface TodayTask {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  workspace_id: string;
  workspace_name?: string;
}

interface UpcomingShift {
  id: string;
  name: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  workspace_id: string;
}

interface RecentWorkspace {
  id: string;
  name: string;
  workspace_type: string;
  event_id: string;
  slug: string | null;
}

export interface MobileHomeData {
  todayEvents: TodayEvent[];
  tasksDueToday: TodayTask[];
  upcomingShifts: UpcomingShift[];
  recentWorkspaces: RecentWorkspace[];
  unreadNotificationCount: number;
  isLoading: boolean;
  error: string | null;
}

export function useMobileHomeData(organizationId: string | undefined): MobileHomeData {
  const { user } = useAuth();
  const { notifications, loading: notificationsLoading } = useNotificationFeed();

  // Fetch today's events for the organization
  const todayEventsQuery = useQuery({
    queryKey: ['mobile-home-today-events', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const today = new Date();
      const todayStart = startOfDay(today).toISOString();
      const todayEnd = endOfDay(today).toISOString();

      const { data, error } = await supabase
        .from('events')
        .select('id, name, start_date, end_date, status, organization_id')
        .eq('organization_id', organizationId)
        .lte('start_date', todayEnd)
        .gte('end_date', todayStart)
        .in('status', ['PUBLISHED', 'ONGOING'])
        .order('start_date', { ascending: true })
        .limit(5);

      if (error) throw error;
      return (data || []) as TodayEvent[];
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch tasks due today assigned to the current user
  const tasksDueTodayQuery = useQuery({
    queryKey: ['mobile-home-tasks-today', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('workspace_tasks')
        .select(`
          id, title, description, priority, status, due_date, workspace_id,
          workspaces!inner(name)
        `)
        .eq('assigned_to', user.id)
        .lte('due_date', todayStr + 'T23:59:59')
        .neq('status', 'DONE')
        .order('priority', { ascending: true })
        .limit(10);

      if (error) throw error;
      
      return (data || []).map((task: any) => ({
        ...task,
        workspace_name: task.workspaces?.name,
      })) as TodayTask[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Fetch upcoming volunteer shifts for the current user
  const upcomingShiftsQuery = useQuery({
    queryKey: ['mobile-home-upcoming-shifts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const nextWeek = addDays(today, 7).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('volunteer_assignments')
        .select(`
          id, status,
          volunteer_shifts!inner(id, name, date, start_time, end_time, location, workspace_id)
        `)
        .eq('user_id', user.id)
        .eq('status', 'CONFIRMED')
        .gte('volunteer_shifts.date', todayStr)
        .lte('volunteer_shifts.date', nextWeek)
        .order('volunteer_shifts(date)', { ascending: true })
        .limit(5);

      if (error) throw error;
      
      return (data || []).map((assignment: any) => ({
        id: assignment.volunteer_shifts.id,
        name: assignment.volunteer_shifts.name,
        date: assignment.volunteer_shifts.date,
        start_time: assignment.volunteer_shifts.start_time,
        end_time: assignment.volunteer_shifts.end_time,
        location: assignment.volunteer_shifts.location,
        workspace_id: assignment.volunteer_shifts.workspace_id,
      })) as UpcomingShift[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch recent workspaces the user is a member of
  const recentWorkspacesQuery = useQuery({
    queryKey: ['mobile-home-recent-workspaces', user?.id, organizationId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('workspace_team_members')
        .select(`
          workspace_id,
          workspaces!inner(id, name, workspace_type, event_id, slug)
        `)
        .eq('user_id', user.id)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      
      return (data || []).map((member: any) => ({
        id: member.workspaces.id,
        name: member.workspaces.name,
        workspace_type: member.workspaces.workspace_type,
        event_id: member.workspaces.event_id,
        slug: member.workspaces.slug,
      })) as RecentWorkspace[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  const isLoading = 
    todayEventsQuery.isLoading || 
    tasksDueTodayQuery.isLoading || 
    upcomingShiftsQuery.isLoading || 
    recentWorkspacesQuery.isLoading ||
    notificationsLoading;

  const error = 
    todayEventsQuery.error?.message || 
    tasksDueTodayQuery.error?.message || 
    upcomingShiftsQuery.error?.message || 
    recentWorkspacesQuery.error?.message || 
    null;

  return {
    todayEvents: todayEventsQuery.data || [],
    tasksDueToday: tasksDueTodayQuery.data || [],
    upcomingShifts: upcomingShiftsQuery.data || [],
    recentWorkspaces: recentWorkspacesQuery.data || [],
    unreadNotificationCount,
    isLoading,
    error,
  };
}
