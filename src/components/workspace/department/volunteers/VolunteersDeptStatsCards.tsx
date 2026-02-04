import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Calendar, Clock, UserCheck, UserPlus, AlertTriangle } from 'lucide-react';

interface VolunteersDeptStatsCardsProps {
  workspaceId: string;
}

export function VolunteersDeptStatsCards({ workspaceId }: VolunteersDeptStatsCardsProps) {
  // Fetch child committees (L3 Volunteers committees)
  const { data: committees = [] } = useQuery({
    queryKey: ['volunteers-dept-committees', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name')
        .eq('parent_workspace_id', workspaceId)
        .eq('workspace_type', 'COMMITTEE');
      if (error) throw error;
      return data;
    },
  });

  const committeeIds = committees.map(c => c.id);

  // Fetch all volunteers from child committees
  const { data: volunteers = [] } = useQuery({
    queryKey: ['volunteers-dept-all-volunteers', committeeIds],
    queryFn: async () => {
      if (committeeIds.length === 0) return [];
      const { data, error } = await supabase
        .from('workspace_team_members')
        .select('id, status')
        .in('workspace_id', committeeIds);
      if (error) throw error;
      return data;
    },
    enabled: committeeIds.length > 0,
  });

  // Fetch all shifts from child committees
  const { data: shifts = [] } = useQuery({
    queryKey: ['volunteers-dept-all-shifts', committeeIds],
    queryFn: async () => {
      if (committeeIds.length === 0) return [];
      const today = new Date().toISOString().split('T')[0];
      const weekEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('volunteer_shifts')
        .select('id, required_volunteers, date')
        .in('workspace_id', committeeIds)
        .gte('date', today)
        .lte('date', weekEnd);
      if (error) throw error;
      return data;
    },
    enabled: committeeIds.length > 0,
  });

  // Fetch all assignments for upcoming shifts
  const shiftIds = shifts.map(s => s.id);
  const { data: assignments = [] } = useQuery({
    queryKey: ['volunteers-dept-all-assignments', shiftIds],
    queryFn: async () => {
      if (shiftIds.length === 0) return [];
      const { data, error } = await supabase
        .from('volunteer_assignments')
        .select('id, status, hours_logged, shift_id')
        .in('shift_id', shiftIds);
      if (error) throw error;
      return data;
    },
    enabled: shiftIds.length > 0,
  });

  // Calculate metrics
  const activeVolunteers = volunteers.filter(v => v.status === 'ACTIVE').length;
  const pendingVolunteers = volunteers.filter(v => v.status === 'PENDING').length;
  const totalShiftsThisWeek = shifts.length;
  
  const totalRequiredVolunteers = shifts.reduce((sum, s) => sum + s.required_volunteers, 0);
  const totalAssigned = assignments.filter(a => a.status !== 'cancelled').length;
  const checkInRate = totalAssigned > 0 
    ? Math.round((assignments.filter(a => a.status === 'CHECKED_IN' || a.status === 'COMPLETED').length / totalAssigned) * 100)
    : 0;
  
  const totalHoursLogged = assignments.reduce((sum, a) => sum + (a.hours_logged || 0), 0);
  
  const understaffedShifts = shifts.filter(shift => {
    const assignedCount = assignments.filter(a => a.shift_id === shift.id && a.status !== 'cancelled').length;
    return assignedCount < shift.required_volunteers;
  }).length;

  const stats = [
    {
      label: 'Active Volunteers',
      value: activeVolunteers,
      subtext: `${pendingVolunteers} pending approval`,
      icon: Users,
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
    },
    {
      label: 'Shifts This Week',
      value: totalShiftsThisWeek,
      subtext: `${totalAssigned}/${totalRequiredVolunteers} slots filled`,
      icon: Calendar,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
    },
    {
      label: 'Check-In Rate',
      value: `${checkInRate}%`,
      subtext: 'Attendance rate',
      icon: UserCheck,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'Hours Logged',
      value: totalHoursLogged.toFixed(1),
      subtext: 'This week total',
      icon: Clock,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Pending Applications',
      value: pendingVolunteers,
      subtext: 'Awaiting review',
      icon: UserPlus,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: 'Understaffed Shifts',
      value: understaffedShifts,
      subtext: 'Need more volunteers',
      icon: AlertTriangle,
      color: understaffedShifts > 0 ? 'text-red-500' : 'text-green-500',
      bgColor: understaffedShifts > 0 ? 'bg-red-500/10' : 'bg-green-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-border">
          <CardContent className="p-4">
            <div className="flex flex-col gap-2">
              <div className={`p-2 rounded-lg ${stat.bgColor} w-fit`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-xs text-muted-foreground/70">{stat.subtext}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
