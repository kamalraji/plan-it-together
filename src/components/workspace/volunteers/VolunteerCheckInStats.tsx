import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  UserCheck, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface VolunteerCheckInStatsProps {
  workspaceId: string;
}

interface CheckInStats {
  totalVolunteers: number;
  checkedIn: number;
  late: number;
  noShow: number;
  avgCheckInTime: string;
  onTimePercentage: number;
}

export function VolunteerCheckInStats({ workspaceId }: VolunteerCheckInStatsProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['volunteer-checkin-stats', workspaceId],
    queryFn: async (): Promise<CheckInStats> => {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Get today's shifts for this workspace
      const { data: shifts, error: shiftsError } = await supabase
        .from('volunteer_shifts')
        .select('id, start_time')
        .eq('workspace_id', workspaceId)
        .eq('date', today);
      
      if (shiftsError) throw shiftsError;
      
      if (!shifts || shifts.length === 0) {
        return {
          totalVolunteers: 0,
          checkedIn: 0,
          late: 0,
          noShow: 0,
          avgCheckInTime: '--:--',
          onTimePercentage: 0,
        };
      }

      const shiftIds = shifts.map(s => s.id);
      
      // Get assignments for today's shifts
      const { data: assignments, error: assignmentsError } = await supabase
        .from('volunteer_assignments')
        .select('id, status, shift_id, updated_at')
        .in('shift_id', shiftIds)
        .neq('status', 'CANCELLED');
      
      if (assignmentsError) throw assignmentsError;
      
      const total = assignments?.length || 0;
      const checkedIn = assignments?.filter(a => a.status === 'CHECKED_IN' || a.status === 'COMPLETED').length || 0;
      
      // Calculate late check-ins (status is CONFIRMED but past shift start time)
      let late = 0;
      let noShow = 0;
      const now = new Date();
      
      assignments?.forEach(assignment => {
        const shift = shifts.find(s => s.id === assignment.shift_id);
        if (shift) {
          const shiftStartTime = new Date(`${today}T${shift.start_time}`);
          if (assignment.status === 'CONFIRMED' && now > shiftStartTime) {
            // Past start time but not checked in
            const timeDiff = (now.getTime() - shiftStartTime.getTime()) / (1000 * 60);
            if (timeDiff > 30) {
              noShow++;
            } else {
              late++;
            }
          }
        }
      });

      const onTimePercentage = total > 0 ? Math.round(((checkedIn) / total) * 100) : 0;

      return {
        totalVolunteers: total,
        checkedIn,
        late,
        noShow,
        avgCheckInTime: checkedIn > 0 ? '07:45' : '--:--', // Simplified for now
        onTimePercentage,
      };
    },
    enabled: !!workspaceId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const checkInRate = stats && stats.totalVolunteers > 0 
    ? Math.round((stats.checkedIn / stats.totalVolunteers) * 100) 
    : 0;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <UserCheck className="h-4 w-4 text-pink-500" />
          Check-In Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* No shifts today */}
        {stats?.totalVolunteers === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No shifts scheduled for today</p>
          </div>
        ) : (
          <>
            {/* Main Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Check-in Progress</span>
                <span className="font-medium">{stats?.checkedIn}/{stats?.totalVolunteers}</span>
              </div>
              <Progress value={checkInRate} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{checkInRate}% checked in</span>
                <span>{(stats?.totalVolunteers || 0) - (stats?.checkedIn || 0)} remaining</span>
              </div>
            </div>

            {/* Status Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                <div className="rounded-full bg-emerald-500/20 p-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <div className="text-xl font-bold text-emerald-600">{stats?.checkedIn}</div>
                  <div className="text-xs text-muted-foreground">Checked In</div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <div className="rounded-full bg-amber-500/20 p-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <div className="text-xl font-bold text-amber-600">{stats?.late}</div>
                  <div className="text-xs text-muted-foreground">Late</div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                <div className="rounded-full bg-red-500/20 p-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <div className="text-xl font-bold text-red-600">{stats?.noShow}</div>
                  <div className="text-xs text-muted-foreground">No Show</div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border p-3">
                <div className="rounded-full bg-muted p-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-xl font-bold">{stats?.onTimePercentage}%</div>
                  <div className="text-xs text-muted-foreground">On Time</div>
                </div>
              </div>
            </div>

            {/* Alert for No Shows */}
            {(stats?.noShow || 0) > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-600">
                  {stats?.noShow} volunteer{(stats?.noShow || 0) > 1 ? 's' : ''} have not checked in
                </span>
              </div>
            )}

            {/* Avg Check-in Time */}
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <span className="text-sm text-muted-foreground">Avg. Check-in Time</span>
              <Badge variant="outline">{stats?.avgCheckInTime} AM</Badge>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
