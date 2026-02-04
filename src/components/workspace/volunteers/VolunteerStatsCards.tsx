import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, Clock, UserCheck, CalendarClock, AlertCircle } from 'lucide-react';
import { startOfWeek, endOfWeek, format } from 'date-fns';

interface VolunteerStatsCardsProps {
  workspaceId: string;
}

export function VolunteerStatsCards({ workspaceId }: VolunteerStatsCardsProps) {
  // Fetch active volunteers count
  const { data: volunteers = [] } = useQuery({
    queryKey: ['volunteer-stats-members', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_team_members')
        .select('id, status')
        .eq('workspace_id', workspaceId);
      if (error) throw error;
      return data;
    },
  });

  // Fetch shifts and assignments for this week
  const { data: shiftsData } = useQuery({
    queryKey: ['volunteer-stats-shifts', workspaceId],
    queryFn: async () => {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

      const { data: shifts, error: shiftsError } = await supabase
        .from('volunteer_shifts')
        .select('id, date, required_volunteers')
        .eq('workspace_id', workspaceId)
        .gte('date', format(weekStart, 'yyyy-MM-dd'))
        .lte('date', format(weekEnd, 'yyyy-MM-dd'));

      if (shiftsError) throw shiftsError;

      const shiftIds = shifts?.map(s => s.id) || [];
      
      if (shiftIds.length === 0) {
        return { shifts: [], assignments: [], hoursLogged: 0 };
      }

      const { data: assignments, error: assignError } = await supabase
        .from('volunteer_assignments')
        .select('id, status, hours_logged, check_in_time')
        .in('shift_id', shiftIds);

      if (assignError) throw assignError;

      const hoursLogged = assignments?.reduce((sum, a) => sum + (a.hours_logged || 0), 0) || 0;

      return { shifts: shifts || [], assignments: assignments || [], hoursLogged };
    },
  });

  // Fetch today's check-in stats
  const { data: todayStats } = useQuery({
    queryKey: ['volunteer-stats-today', workspaceId],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data: todayShifts, error } = await supabase
        .from('volunteer_shifts')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('date', today);

      if (error) throw error;

      const shiftIds = todayShifts?.map(s => s.id) || [];
      
      if (shiftIds.length === 0) {
        return { total: 0, checkedIn: 0 };
      }

      const { data: assignments } = await supabase
        .from('volunteer_assignments')
        .select('id, check_in_time')
        .in('shift_id', shiftIds);

      const total = assignments?.length || 0;
      const checkedIn = assignments?.filter(a => a.check_in_time).length || 0;

      return { total, checkedIn };
    },
  });

  const activeVolunteers = volunteers.filter(v => v.status === 'ACTIVE').length;
  const totalShifts = shiftsData?.shifts.length || 0;
  const totalRequired = shiftsData?.shifts.reduce((sum, s) => sum + s.required_volunteers, 0) || 0;
  const totalAssigned = shiftsData?.assignments.length || 0;
  const hoursThisWeek = shiftsData?.hoursLogged || 0;
  const checkInRate = todayStats?.total ? Math.round((todayStats.checkedIn / todayStats.total) * 100) : 0;
  const openSlots = Math.max(0, totalRequired - totalAssigned);

  const stats = [
    {
      label: 'Active Volunteers',
      value: activeVolunteers,
      subtext: `${volunteers.length} total registered`,
      icon: Users,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'Hours This Week',
      value: hoursThisWeek,
      subtext: `${totalShifts} shifts scheduled`,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Check-In Rate',
      value: `${checkInRate}%`,
      subtext: `${todayStats?.checkedIn || 0}/${todayStats?.total || 0} today`,
      icon: UserCheck,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
    },
    {
      label: 'Open Slots',
      value: openSlots,
      subtext: `${totalAssigned}/${totalRequired} filled`,
      icon: openSlots > 5 ? AlertCircle : CalendarClock,
      color: openSlots > 5 ? 'text-amber-600' : 'text-cyan-600',
      bgColor: openSlots > 5 ? 'bg-amber-50' : 'bg-cyan-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.subtext}</p>
              </div>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
