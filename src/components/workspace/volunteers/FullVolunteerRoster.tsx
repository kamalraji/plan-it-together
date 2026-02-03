import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Users, 
  Search, 
  UserPlus, 
  CheckCircle, 
  Clock, 
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FullVolunteerRosterProps {
  workspaceId: string;
  onAddVolunteer?: () => void;
}

interface VolunteerData {
  id: string;
  userId: string;
  name: string;
  email: string;
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  shiftsAssigned: number;
  hoursLogged: number;
  joinedAt: string;
}

const PAGE_SIZE = 10;

export function FullVolunteerRoster({ workspaceId, onAddVolunteer }: FullVolunteerRosterProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const { data: volunteers = [], isLoading } = useQuery({
    queryKey: ['full-volunteer-roster', workspaceId],
    queryFn: async (): Promise<VolunteerData[]> => {
      const { data: members, error } = await supabase
        .from('workspace_team_members')
        .select('id, user_id, status, joined_at')
        .eq('workspace_id', workspaceId);

      if (error) throw error;
      if (!members?.length) return [];

      const userIds = members.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      // Get shift assignments and hours for each volunteer
      const { data: assignments } = await supabase
        .from('volunteer_assignments')
        .select('user_id, hours_logged')
        .in('user_id', userIds)
        .neq('status', 'CANCELLED');

      const assignmentStats = (assignments || []).reduce((acc, a) => {
        if (!acc[a.user_id]) {
          acc[a.user_id] = { count: 0, hours: 0 };
        }
        acc[a.user_id].count += 1;
        acc[a.user_id].hours += a.hours_logged || 0;
        return acc;
      }, {} as Record<string, { count: number; hours: number }>);

      return members.map(m => ({
        id: m.id,
        userId: m.user_id,
        name: profileMap.get(m.user_id) || 'Unknown Volunteer',
        email: `volunteer-${m.user_id.slice(0, 8)}@team.local`,
        status: m.status as 'ACTIVE' | 'PENDING' | 'INACTIVE',
        shiftsAssigned: assignmentStats[m.user_id]?.count || 0,
        hoursLogged: assignmentStats[m.user_id]?.hours || 0,
        joinedAt: m.joined_at,
      }));
    },
    enabled: !!workspaceId,
  });

  // Filter volunteers
  const filteredVolunteers = volunteers.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredVolunteers.length / PAGE_SIZE);
  const paginatedVolunteers = filteredVolunteers.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'INACTIVE':
        return <XCircle className="h-4 w-4 text-muted-foreground" />;
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Users className="h-4 w-4 text-pink-500" />
          Volunteer Roster ({filteredVolunteers.length})
        </CardTitle>
        {onAddVolunteer && (
          <Button size="sm" onClick={onAddVolunteer} className="gap-1">
            <UserPlus className="h-3 w-3" />
            Add Volunteer
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search volunteers..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Select 
            value={statusFilter} 
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : paginatedVolunteers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {search || statusFilter !== 'all' 
                ? 'No volunteers match your filters'
                : 'No volunteers yet'}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Volunteer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Shifts</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead className="text-right">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedVolunteers.map(volunteer => (
                  <TableRow key={volunteer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-pink-500/10 text-pink-600 text-xs">
                            {volunteer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{volunteer.name}</span>
                            {getStatusIcon(volunteer.status)}
                          </div>
                          <span className="text-xs text-muted-foreground">{volunteer.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(volunteer.status)}</TableCell>
                    <TableCell className="text-right">{volunteer.shiftsAssigned}</TableCell>
                    <TableCell className="text-right">{volunteer.hoursLogged.toFixed(1)}h</TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {new Date(volunteer.joinedAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filteredVolunteers.length)} of {filteredVolunteers.length}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
