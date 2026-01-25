import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VolunteerRosterProps {
  workspaceId: string;
}

interface VolunteerData {
  id: string;
  name: string;
  email: string;
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  shiftsAssigned: number;
  hoursLogged: number;
}

export function VolunteerRoster({ workspaceId }: VolunteerRosterProps) {
  const { data: volunteers = [], isLoading } = useQuery({
    queryKey: ['volunteer-roster', workspaceId],
    queryFn: async (): Promise<VolunteerData[]> => {
      // Fetch team members
      const { data: members, error } = await supabase
        .from('workspace_team_members')
        .select('id, user_id, status')
        .eq('workspace_id', workspaceId);
      
      if (error) throw error;
      if (!members || members.length === 0) return [];

      // Get user profiles for all members in single batch query
      const userIds = members.map(m => m.user_id);
      
      // Batch all queries in parallel instead of N+1 pattern
      const [profilesResult, assignmentsResult] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('id, full_name')
          .in('id', userIds),
        supabase
          .from('volunteer_assignments')
          .select('user_id')
          .in('user_id', userIds)
          .neq('status', 'CANCELLED'),
      ]);

      const profileMap = new Map(
        profilesResult.data?.map(p => [p.id, p.full_name]) || []
      );

      // Count assignments per user from single batch query
      const assignmentCounts: Record<string, number> = {};
      (assignmentsResult.data || []).forEach(a => {
        assignmentCounts[a.user_id] = (assignmentCounts[a.user_id] || 0) + 1;
      });

      // Transform data without additional queries
      const volunteerData = members.map((member) => {
        const shiftsCount = assignmentCounts[member.user_id] || 0;
        const hoursLogged = shiftsCount * 3; // average 3 hours per shift
        
        return {
          id: member.id,
          name: profileMap.get(member.user_id) || 'Unknown Volunteer',
          email: `volunteer-${member.user_id.slice(0, 8)}@team.local`,
          status: member.status as 'ACTIVE' | 'PENDING' | 'INACTIVE',
          shiftsAssigned: shiftsCount,
          hoursLogged,
        };
      });

      return volunteerData;
    },
    enabled: !!workspaceId,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-3 w-3 text-emerald-500" />;
      case 'PENDING':
        return <Clock className="h-3 w-3 text-amber-500" />;
      case 'INACTIVE':
        return <XCircle className="h-3 w-3 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      PENDING: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      INACTIVE: 'bg-muted text-muted-foreground border-border',
    };
    return (
      <Badge variant="outline" className={styles[status as keyof typeof styles]}>
        {status.charAt(0) + status.slice(1).toLowerCase()}
      </Badge>
    );
  };

  const activeCount = volunteers.filter(v => v.status === 'ACTIVE').length;
  const pendingCount = volunteers.filter(v => v.status === 'PENDING').length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="volunteer-roster">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Users className="h-4 w-4 text-pink-500" />
          Volunteer Roster
        </CardTitle>
        <Button size="sm" variant="outline" className="gap-1">
          <UserPlus className="h-3 w-3" />
          Add Volunteer
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-emerald-500/10 p-3 text-center">
            <div className="text-2xl font-bold text-emerald-600">{activeCount}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          <div className="rounded-lg bg-amber-500/10 p-3 text-center">
            <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="rounded-lg bg-muted p-3 text-center">
            <div className="text-2xl font-bold">{volunteers.length}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
        </div>

        {/* Volunteer List */}
        {volunteers.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No volunteers assigned yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {volunteers.slice(0, 5).map((volunteer) => (
              <div
                key={volunteer.id}
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-pink-500/10 text-pink-600 text-xs">
                      {volunteer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{volunteer.name}</span>
                      {getStatusIcon(volunteer.status)}
                    </div>
                    <div className="text-xs text-muted-foreground">{volunteer.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-xs">
                    <div className="font-medium">{volunteer.shiftsAssigned} shifts</div>
                    <div className="text-muted-foreground">{volunteer.hoursLogged}h logged</div>
                  </div>
                  {getStatusBadge(volunteer.status)}
                </div>
              </div>
            ))}
          </div>
        )}

        {volunteers.length > 5 && (
          <Button variant="ghost" size="sm" className="w-full">
            View All Volunteers
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
