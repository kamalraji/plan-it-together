import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  UserCheck, 
  QrCode, 
  Search, 
  CheckCircle2, 
  Clock,
  Users,
  Camera,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface VolunteerCheckInTabProps {
  workspaceId: string;
}

interface VolunteerForCheckIn {
  id: string;
  assignmentId: string;
  userId: string;
  name: string;
  shiftName: string;
  shiftTime: string;
  status: 'pending' | 'checked-in' | 'late' | 'no-show';
  checkInTime?: string | null;
}

export function VolunteerCheckInTab({ workspaceId }: VolunteerCheckInTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [scanMode, setScanMode] = useState(false);
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  // Fetch today's volunteers who need to check in
  const { data: volunteers = [], isLoading } = useQuery({
    queryKey: ['volunteer-checkin-list', workspaceId, today],
    queryFn: async (): Promise<VolunteerForCheckIn[]> => {
      // Get today's shifts
      const { data: shifts, error: shiftsError } = await supabase
        .from('volunteer_shifts')
        .select('id, name, start_time, end_time')
        .eq('workspace_id', workspaceId)
        .eq('date', today);

      if (shiftsError) throw shiftsError;
      if (!shifts || shifts.length === 0) return [];

      const shiftIds = shifts.map(s => s.id);

      // Get assignments for today's shifts
      const { data: assignments, error: assignError } = await supabase
        .from('volunteer_assignments')
        .select('id, user_id, shift_id, status, check_in_time')
        .in('shift_id', shiftIds);

      if (assignError) throw assignError;
      if (!assignments || assignments.length === 0) return [];

      // Get user profiles
      const userIds = [...new Set(assignments.map(a => a.user_id))];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);
      const shiftMap = new Map(shifts.map(s => [s.id, s]));

      return assignments.map(a => {
        const shift = shiftMap.get(a.shift_id);
        let status: 'pending' | 'checked-in' | 'late' | 'no-show' = 'pending';
        
        if (a.check_in_time) {
          status = 'checked-in';
        } else if (a.status === 'NO_SHOW') {
          status = 'no-show';
        }

        return {
          id: a.id,
          assignmentId: a.id,
          userId: a.user_id,
          name: profileMap.get(a.user_id) || 'Unknown Volunteer',
          shiftName: shift?.name || 'Unknown Shift',
          shiftTime: shift ? `${shift.start_time} - ${shift.end_time}` : '',
          status,
          checkInTime: a.check_in_time,
        };
      });
    },
    refetchInterval: 15000,
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('volunteer_assignments')
        .update({
          check_in_time: new Date().toISOString(),
          status: 'CHECKED_IN',
        })
        .eq('id', assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-checkin-list', workspaceId] });
      toast.success('Volunteer checked in successfully');
    },
    onError: () => {
      toast.error('Failed to check in volunteer');
    },
  });

  const filteredVolunteers = volunteers.filter(v =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.shiftName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = volunteers.filter(v => v.status === 'pending').length;
  const checkedInCount = volunteers.filter(v => v.status === 'checked-in').length;

  const getStatusBadge = (status: string) => {
    const config = {
      'pending': { class: 'bg-amber-500/10 text-amber-600 border-amber-500/20', label: 'Pending' },
      'checked-in': { class: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', label: 'Checked In' },
      'late': { class: 'bg-orange-500/10 text-orange-600 border-orange-500/20', label: 'Late' },
      'no-show': { class: 'bg-red-500/10 text-red-600 border-red-500/20', label: 'No Show' },
    };
    const { class: className, label } = config[status as keyof typeof config] || config.pending;
    return <Badge variant="outline" className={className}>{label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Volunteer Check-In</h2>
          <p className="text-muted-foreground">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <Button
          variant={scanMode ? 'default' : 'outline'}
          onClick={() => setScanMode(!scanMode)}
          className="gap-2"
        >
          <QrCode className="h-4 w-4" />
          {scanMode ? 'Exit Scan Mode' : 'QR Scan Mode'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{volunteers.length}</p>
                <p className="text-xs text-muted-foreground">Total Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{checkedInCount}</p>
                <p className="text-xs text-muted-foreground">Checked In</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <UserCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {volunteers.length > 0 ? Math.round((checkedInCount / volunteers.length) * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Check-in Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QR Scan Mode */}
      {scanMode && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-6 rounded-full bg-primary/10">
                <Camera className="h-12 w-12 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">QR Code Scanner Active</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Point camera at volunteer's QR code badge to check them in
                </p>
              </div>
              <div className="w-64 h-64 border-2 border-dashed border-primary/50 rounded-lg flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Camera preview area</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and List */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-pink-500" />
              Today's Volunteers
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search volunteers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredVolunteers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <h3 className="font-medium">No volunteers scheduled</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery ? 'No matches found for your search' : 'No shifts scheduled for today'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredVolunteers.map((volunteer) => (
                <div
                  key={volunteer.id}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-lg border transition-colors',
                    volunteer.status === 'checked-in' && 'bg-emerald-50/50 border-emerald-200',
                    volunteer.status === 'pending' && 'hover:bg-muted/50',
                    volunteer.status === 'no-show' && 'bg-red-50/50 border-red-200'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {volunteer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{volunteer.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{volunteer.shiftName}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {volunteer.shiftTime}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {volunteer.checkInTime && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(volunteer.checkInTime), 'h:mm a')}
                      </span>
                    )}
                    {getStatusBadge(volunteer.status)}
                    {volunteer.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => checkInMutation.mutate(volunteer.assignmentId)}
                        disabled={checkInMutation.isPending}
                        className="gap-1"
                      >
                        {checkInMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3" />
                        )}
                        Check In
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
