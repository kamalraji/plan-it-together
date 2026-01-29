import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Search, 
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  UserCheck,
  MoreHorizontal,
  QrCode,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { 
  useRegistrationAttendees, 
  useEventIdFromWorkspace,
  useCheckInMutation,
  RegistrationAttendee 
} from '@/hooks/useRegistrationData';
import { useQueryClient } from '@tanstack/react-query';
import { registrationKeys } from '@/hooks/useRegistrationData';

interface AttendeeListProps {
  workspaceId: string;
}

const ticketTypes = ['All', 'VIP Pass', 'General', 'Student', 'Speaker'];

export function AttendeeList({ workspaceId }: AttendeeListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [ticketFilter, setTicketFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  const queryClient = useQueryClient();
  const { data: eventId } = useEventIdFromWorkspace(workspaceId);
  
  const { data, isLoading, isFetching } = useRegistrationAttendees(eventId || null, {
    search: searchTerm,
    status: statusFilter,
    ticketType: ticketFilter,
  });

  const checkInMutation = useCheckInMutation(eventId || '');

  const attendees = data?.attendees || [];
  
  // Client-side ticket type filter (since we're doing server-side search/status)
  const filteredAttendees = useMemo(() => {
    if (ticketFilter === 'All') return attendees;
    return attendees.filter(a => a.ticketTierName === ticketFilter);
  }, [attendees, ticketFilter]);

  const handleRefresh = () => {
    if (eventId) {
      queryClient.invalidateQueries({ queryKey: registrationKeys.attendees(eventId) });
    }
  };

  const handleCheckIn = (registrationId: string) => {
    checkInMutation.mutate(registrationId);
  };

  const getStatusBadge = (attendee: RegistrationAttendee) => {
    if (attendee.isCheckedIn) {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
          <UserCheck className="w-3 h-3 mr-1" aria-hidden="true" />
          Checked In
        </Badge>
      );
    }

    switch (attendee.status) {
      case 'CONFIRMED':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
            <CheckCircle2 className="w-3 h-3 mr-1" aria-hidden="true" />
            Confirmed
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
            <Clock className="w-3 h-3 mr-1" aria-hidden="true" />
            Pending
          </Badge>
        );
      case 'WAITLISTED':
        return (
          <Badge className="bg-violet-500/10 text-violet-600 border-violet-500/20">
            <Clock className="w-3 h-3 mr-1" aria-hidden="true" />
            Waitlisted
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <XCircle className="w-3 h-3 mr-1" aria-hidden="true" />
            Cancelled
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-20 mt-1" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-36" />
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48 mt-1" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="w-5 h-5 text-primary" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-lg">Attendee List</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {data?.total || 0} attendees
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={handleRefresh}
              disabled={isFetching}
              aria-label="Refresh attendee list"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5">
              <QrCode className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Scan Check-in</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              aria-label="Search attendees"
            />
          </div>
          <Select value={ticketFilter} onValueChange={setTicketFilter}>
            <SelectTrigger className="w-full sm:w-36" aria-label="Filter by ticket type">
              <Filter className="w-4 h-4 mr-2" aria-hidden="true" />
              <SelectValue placeholder="Ticket" />
            </SelectTrigger>
            <SelectContent>
              {ticketTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-36" aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="checked_in">Checked In</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="waitlisted">Waitlisted</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Attendee List */}
        <div 
          className="space-y-2 max-h-96 overflow-y-auto"
          role="list"
          aria-label="Attendee list"
        >
          {filteredAttendees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-50" aria-hidden="true" />
              <p>No attendees found</p>
            </div>
          ) : (
            filteredAttendees.map(attendee => (
              <div
                key={attendee.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                role="listitem"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {attendee.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{attendee.fullName}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{attendee.email}</span>
                      {attendee.ticketTierName && (
                        <>
                          <span aria-hidden="true">·</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {attendee.ticketTierName}
                          </Badge>
                        </>
                      )}
                    </div>
                    {attendee.registeredAt && (
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                        Registered {formatDistanceToNow(attendee.registeredAt, { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(attendee)}
                  {!attendee.isCheckedIn && attendee.status === 'CONFIRMED' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleCheckIn(attendee.registrationId)}
                      disabled={checkInMutation.isPending}
                      className="hidden sm:flex"
                    >
                      <UserCheck className="w-4 h-4 mr-1" aria-hidden="true" />
                      Check In
                    </Button>
                  )}
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8"
                    aria-label={`More options for ${attendee.fullName}`}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
