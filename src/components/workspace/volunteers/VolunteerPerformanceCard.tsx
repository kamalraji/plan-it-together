import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

import { Trophy, Clock, UserCheck, TrendingUp, Medal } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VolunteerPerformanceCardProps {
  workspaceId: string;
}

interface VolunteerStats {
  userId: string;
  name: string;
  hoursLogged: number;
  shiftsCompleted: number;
  shiftsAssigned: number;
  onTimeRate: number;
  noShowCount: number;
}

export function VolunteerPerformanceCard({ workspaceId }: VolunteerPerformanceCardProps) {
  const { data: performanceData, isLoading } = useQuery({
    queryKey: ['volunteer-performance', workspaceId],
    queryFn: async () => {
      // Fetch all shifts for this workspace
      const { data: shifts, error: shiftsError } = await supabase
        .from('volunteer_shifts')
        .select('id')
        .eq('workspace_id', workspaceId);

      if (shiftsError) throw shiftsError;

      const shiftIds = shifts?.map(s => s.id) || [];

      if (shiftIds.length === 0) {
        return { volunteers: [], totals: { hours: 0, attendance: 0, reliability: 0 } };
      }

      // Fetch all assignments with user info
      const { data: assignments, error: assignError } = await supabase
        .from('volunteer_assignments')
        .select(`
          id,
          user_id,
          hours_logged,
          status,
          check_in_time,
          check_out_time,
          shift_id
        `)
        .in('shift_id', shiftIds);

      if (assignError) throw assignError;

      // Get unique user IDs
      const userIds = [...new Set(assignments?.map(a => a.user_id) || [])];

      // Fetch user profiles
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      // Calculate stats per volunteer
      const volunteerStatsMap = new Map<string, VolunteerStats>();

      assignments?.forEach(a => {
        const existing = volunteerStatsMap.get(a.user_id) || {
          userId: a.user_id,
          name: profileMap.get(a.user_id) || 'Unknown',
          hoursLogged: 0,
          shiftsCompleted: 0,
          shiftsAssigned: 0,
          onTimeRate: 0,
          noShowCount: 0,
        };

        existing.shiftsAssigned++;
        existing.hoursLogged += a.hours_logged || 0;

        if (a.check_in_time && a.check_out_time) {
          existing.shiftsCompleted++;
        }

        if (a.status === 'NO_SHOW') {
          existing.noShowCount++;
        }

        volunteerStatsMap.set(a.user_id, existing);
      });

      // Calculate on-time rate and sort by hours
      const volunteers = Array.from(volunteerStatsMap.values())
        .map(v => ({
          ...v,
          onTimeRate: v.shiftsAssigned > 0 
            ? Math.round(((v.shiftsAssigned - v.noShowCount) / v.shiftsAssigned) * 100)
            : 100,
        }))
        .sort((a, b) => b.hoursLogged - a.hoursLogged);

      // Calculate totals
      const totalHours = volunteers.reduce((sum, v) => sum + v.hoursLogged, 0);
      const totalShifts = volunteers.reduce((sum, v) => sum + v.shiftsAssigned, 0);
      const totalCompleted = volunteers.reduce((sum, v) => sum + v.shiftsCompleted, 0);
      const totalNoShows = volunteers.reduce((sum, v) => sum + v.noShowCount, 0);

      return {
        volunteers: volunteers.slice(0, 5), // Top 5
        totals: {
          hours: totalHours,
          attendance: totalShifts > 0 ? Math.round((totalCompleted / totalShifts) * 100) : 0,
          reliability: totalShifts > 0 ? Math.round(((totalShifts - totalNoShows) / totalShifts) * 100) : 100,
        },
      };
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const { volunteers = [], totals = { hours: 0, attendance: 0, reliability: 0 } } = performanceData || {};

  return (
    <Card id="performance-overview">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          <CardTitle className="text-lg">Volunteer Performance</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <Clock className="h-4 w-4 text-blue-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-blue-900">{totals.hours}</p>
            <p className="text-xs text-blue-600">Hours Logged</p>
          </div>
          <div className="text-center p-3 bg-emerald-50 rounded-lg">
            <UserCheck className="h-4 w-4 text-emerald-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-emerald-900">{totals.attendance}%</p>
            <p className="text-xs text-emerald-600">Attendance</p>
          </div>
          <div className="text-center p-3 bg-violet-50 rounded-lg">
            <TrendingUp className="h-4 w-4 text-violet-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-violet-900">{totals.reliability}%</p>
            <p className="text-xs text-violet-600">Reliability</p>
          </div>
        </div>

        {/* Top Volunteers Leaderboard */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Medal className="h-4 w-4" />
            Top Volunteers
          </h4>
          
          {volunteers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No volunteer activity yet
            </p>
          ) : (
            <div className="space-y-2">
              {volunteers.map((volunteer, index) => (
                <div
                  key={volunteer.userId}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-amber-100 text-amber-700' :
                    index === 1 ? 'bg-muted text-foreground' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {volunteer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{volunteer.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{volunteer.hoursLogged}h logged</span>
                      <span>•</span>
                      <span>{volunteer.shiftsCompleted}/{volunteer.shiftsAssigned} shifts</span>
                    </div>
                  </div>
                  <Badge 
                    variant={volunteer.onTimeRate >= 90 ? 'default' : volunteer.onTimeRate >= 70 ? 'secondary' : 'destructive'}
                    className="text-[10px]"
                  >
                    {volunteer.onTimeRate}%
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
