import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  QrCode
} from 'lucide-react';

interface Attendee {
  id: string;
  name: string;
  email: string;
  ticketType: string;
  registeredAt: Date;
  status: 'confirmed' | 'pending' | 'checked_in' | 'cancelled' | 'waitlisted';
  checkInTime?: Date;
}

interface AttendeeListProps {
  workspaceId: string;
}

const mockAttendees: Attendee[] = [
  {
    id: '1',
    name: 'Priya Sharma',
    email: 'priya.sharma@email.com',
    ticketType: 'VIP Pass',
    registeredAt: new Date('2025-01-02'),
    status: 'checked_in',
    checkInTime: new Date('2025-01-05T09:15:00'),
  },
  {
    id: '2',
    name: 'Rahul Patel',
    email: 'rahul.p@email.com',
    ticketType: 'General',
    registeredAt: new Date('2025-01-03'),
    status: 'confirmed',
  },
  {
    id: '3',
    name: 'Anjali Gupta',
    email: 'anjali.g@email.com',
    ticketType: 'Student',
    registeredAt: new Date('2025-01-04'),
    status: 'pending',
  },
  {
    id: '4',
    name: 'Vikram Singh',
    email: 'vikram.s@email.com',
    ticketType: 'General',
    registeredAt: new Date('2025-01-04'),
    status: 'waitlisted',
  },
  {
    id: '5',
    name: 'Meera Nair',
    email: 'meera.n@email.com',
    ticketType: 'VIP Pass',
    registeredAt: new Date('2025-01-01'),
    status: 'checked_in',
    checkInTime: new Date('2025-01-05T10:30:00'),
  },
];

const ticketTypes = ['All', 'VIP Pass', 'General', 'Student', 'Speaker'];

export function AttendeeList({ workspaceId: _workspaceId }: AttendeeListProps) {
  const [attendees] = useState<Attendee[]>(mockAttendees);
  const [searchTerm, setSearchTerm] = useState('');
  const [ticketFilter, setTicketFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const filteredAttendees = attendees.filter(attendee => {
    const matchesSearch = attendee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attendee.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTicket = ticketFilter === 'All' || attendee.ticketType === ticketFilter;
    const matchesStatus = statusFilter === 'All' || attendee.status === statusFilter;
    return matchesSearch && matchesTicket && matchesStatus;
  });

  const getStatusBadge = (status: Attendee['status']) => {
    switch (status) {
      case 'checked_in':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
            <UserCheck className="w-3 h-3 mr-1" />
            Checked In
          </Badge>
        );
      case 'confirmed':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Confirmed
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'waitlisted':
        return (
          <Badge className="bg-violet-500/10 text-violet-600 border-violet-500/20">
            <Clock className="w-3 h-3 mr-1" />
            Waitlisted
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Attendee List</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {filteredAttendees.length} attendees
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5">
            <QrCode className="w-4 h-4" />
            Scan Check-in
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={ticketFilter} onValueChange={setTicketFilter}>
            <SelectTrigger className="w-full sm:w-36">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Ticket" />
            </SelectTrigger>
            <SelectContent>
              {ticketTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-36">
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
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredAttendees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No attendees found</p>
            </div>
          ) : (
            filteredAttendees.map(attendee => (
              <div
                key={attendee.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {attendee.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{attendee.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{attendee.email}</span>
                      <span>·</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {attendee.ticketType}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(attendee.status)}
                  <Button size="icon" variant="ghost" className="h-8 w-8">
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
