import { Workspace } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar, Clock, Users, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, isToday, isTomorrow, isPast } from 'date-fns';

interface ShiftOverviewTabProps {
  workspace: Workspace;
}

export function ShiftOverviewTab({ workspace }: ShiftOverviewTabProps) {
  // Fetch all shifts from child committees
  const { data: shifts, isLoading } = useQuery({
    queryKey: ['department-shifts-overview', workspace.id],
    queryFn: async () => {
      // First get child committee IDs
      const { data: committees } = await supabase
        .from('workspaces')
        .select('id')
        .eq('parent_workspace_id', workspace.id);
      
      const committeeIds = committees?.map(c => c.id) || [];
      if (committeeIds.length === 0) return [];

      const { data, error } = await supabase
        .from('volunteer_shifts')
        .select('*')
        .in('workspace_id', committeeIds)
        .order('date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const todayShifts = shifts?.filter(s => isToday(new Date(s.date))) || [];
  const tomorrowShifts = shifts?.filter(s => isTomorrow(new Date(s.date))) || [];
  const upcomingShifts = shifts?.filter(s => !isPast(new Date(s.date)) && !isToday(new Date(s.date))) || [];

  const totalSlots = shifts?.reduce((acc, s) => acc + (s.required_volunteers || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Calendar className="h-6 w-6 text-rose-500" />
          Shift Overview
        </h2>
        <p className="text-muted-foreground mt-1">
          Department-wide shift schedule and status
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 border-rose-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-rose-600">{shifts?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Total Shifts</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">{todayShifts.length}</div>
            <div className="text-xs text-muted-foreground">Today's Shifts</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{totalSlots}</div>
            <div className="text-xs text-muted-foreground">Total Slots</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-amber-600">{upcomingShifts.length}</div>
            <div className="text-xs text-muted-foreground">Upcoming</div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Today's Shifts */}
          {todayShifts.length > 0 && (
            <Card className="border-emerald-500/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Today's Shifts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {todayShifts.map(shift => (
                  <ShiftCard key={shift.id} shift={shift} highlight />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Tomorrow's Shifts */}
          {tomorrowShifts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tomorrow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tomorrowShifts.map(shift => (
                  <ShiftCard key={shift.id} shift={shift} />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Upcoming Shifts */}
          {upcomingShifts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upcoming Shifts</CardTitle>
                <CardDescription>All scheduled shifts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingShifts.slice(0, 10).map(shift => (
                  <ShiftCard key={shift.id} shift={shift} />
                ))}
                {upcomingShifts.length > 10 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    +{upcomingShifts.length - 10} more shifts
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {shifts?.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-foreground mb-1">No shifts scheduled</h3>
                <p className="text-sm text-muted-foreground">
                  Shifts will appear here when committees create them
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function ShiftCard({ shift, highlight }: { shift: any; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border ${highlight ? 'bg-emerald-500/5 border-emerald-500/20' : ''}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${highlight ? 'bg-emerald-500/10' : 'bg-muted'}`}>
          <Clock className={`h-4 w-4 ${highlight ? 'text-emerald-500' : 'text-muted-foreground'}`} />
        </div>
        <div>
          <h4 className="font-medium text-foreground">{shift.name}</h4>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(shift.date), 'MMM d')}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {shift.start_time} - {shift.end_time}
            </span>
            {shift.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {shift.location}
              </span>
            )}
          </div>
        </div>
      </div>
      <Badge variant="secondary" className="flex items-center gap-1">
        <Users className="h-3 w-3" />
        {shift.required_volunteers}
      </Badge>
    </div>
  );
}
