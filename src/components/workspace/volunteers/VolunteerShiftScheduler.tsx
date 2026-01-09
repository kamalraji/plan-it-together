import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, Plus, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVolunteerShifts, Shift } from '@/hooks/useVolunteerShifts';
import { AddShiftModal } from './AddShiftModal';
import { EditShiftModal } from './EditShiftModal';

interface VolunteerShiftSchedulerProps {
  workspaceId: string;
}

export function VolunteerShiftScheduler({ workspaceId }: VolunteerShiftSchedulerProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  
  const { shifts, isLoading } = useVolunteerShifts(workspaceId);
    queryKey: ['volunteer-shifts', workspaceId],
    queryFn: async (): Promise<Shift[]> => {
      // Fetch shifts with assignment counts
      const { data: shiftsData, error: shiftsError } = await supabase
        .from('volunteer_shifts')
        .select('id, name, date, start_time, end_time, location, required_volunteers')
        .eq('workspace_id', workspaceId)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (shiftsError) throw shiftsError;
      if (!shiftsData?.length) return [];

      // Get assignment counts for each shift
      const shiftIds = shiftsData.map(s => s.id);
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('volunteer_assignments')
        .select('shift_id')
        .in('shift_id', shiftIds)
        .neq('status', 'cancelled');

      if (assignmentsError) throw assignmentsError;

      // Count assignments per shift
      const assignmentCounts = (assignmentsData || []).reduce((acc, a) => {
        acc[a.shift_id] = (acc[a.shift_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return shiftsData.map(shift => ({
        id: shift.id,
        name: shift.name,
        date: shift.date,
        startTime: shift.start_time,
        endTime: shift.end_time,
        location: shift.location || '',
        requiredVolunteers: shift.required_volunteers,
        assignedVolunteers: assignmentCounts[shift.id] || 0,
      }));
    },
    enabled: !!workspaceId,
  });

  const getShiftStatus = (shift: Shift) => {
    const fillRate = shift.assignedVolunteers / shift.requiredVolunteers;
    if (fillRate >= 1) return 'filled';
    if (fillRate >= 0.5) return 'partial';
    return 'critical';
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      filled: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      partial: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      critical: 'bg-red-500/10 text-red-600 border-red-500/20',
    };
    const labels = {
      filled: 'Filled',
      partial: 'Needs More',
      critical: 'Critical',
    };
    return (
      <Badge variant="outline" className={styles[status as keyof typeof styles]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const totalRequired = shifts.reduce((sum, s) => sum + s.requiredVolunteers, 0);
  const totalAssigned = shifts.reduce((sum, s) => sum + s.assignedVolunteers, 0);
  const fillPercentage = Math.round((totalAssigned / totalRequired) * 100);

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Calendar className="h-4 w-4 text-pink-500" />
          Shift Schedule
        </CardTitle>
        <Button size="sm" variant="outline" className="gap-1" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-3 w-3" />
          Add Shift
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : shifts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No shifts scheduled yet</p>
            <p className="text-xs text-muted-foreground/70">Click "Add Shift" to create your first shift</p>
          </div>
        ) : (
          <>
            {/* Summary Bar */}
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Overall Fill Rate:</span>
            <span className="font-medium">{totalAssigned}/{totalRequired}</span>
          </div>
          <Badge 
            variant="outline"
            className={cn(
              fillPercentage >= 90 
                ? 'bg-emerald-500/10 text-emerald-600' 
                : fillPercentage >= 70 
                  ? 'bg-amber-500/10 text-amber-600'
                  : 'bg-red-500/10 text-red-600'
            )}
          >
            {fillPercentage}%
          </Badge>
        </div>

        {/* Shifts List */}
        <div className="space-y-3">
          {shifts.map((shift) => {
            const status = getShiftStatus(shift);
            return (
              <div
                key={shift.id}
                onClick={() => setEditingShift(shift)}
                className={cn(
                  'flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/30 cursor-pointer',
                  status === 'filled' && 'border-emerald-500/20 bg-emerald-500/5',
                  status === 'partial' && 'border-amber-500/20 bg-amber-500/5',
                  status === 'critical' && 'border-red-500/20 bg-red-500/5'
                )}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{shift.name}</span>
                    {status === 'filled' && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {shift.startTime} - {shift.endTime}
                    </span>
                    <span>{shift.location}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {shift.assignedVolunteers}/{shift.requiredVolunteers}
                    </div>
                    <div className="text-xs text-muted-foreground">volunteers</div>
                  </div>
                  {getStatusBadge(status)}
                </div>
              </div>
            );
            })}
          </div>
          </>
        )}
      </CardContent>
    </Card>
    
    <AddShiftModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} workspaceId={workspaceId} />
    <EditShiftModal open={!!editingShift} onOpenChange={(open) => !open && setEditingShift(null)} workspaceId={workspaceId} shift={editingShift} />
    </>
  );
}
