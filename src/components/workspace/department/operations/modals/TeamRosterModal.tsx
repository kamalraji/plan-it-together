import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Search, Phone, MapPin, Clock } from 'lucide-react';

interface TeamRosterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  team: string;
  location: string;
  shift: string;
  phone: string;
  status: 'on-duty' | 'break' | 'off-duty';
}

export function TeamRosterModal({ open, onOpenChange }: TeamRosterModalProps) {
  const [search, setSearch] = useState('');
  const [staff] = useState<StaffMember[]>([
    { id: '1', name: 'John Doe', role: 'Operations Lead', team: 'Core Ops', location: 'Main Hall', shift: '07:00 - 15:00', phone: '555-0101', status: 'on-duty' },
    { id: '2', name: 'Sarah Miller', role: 'AV Technician', team: 'Technical', location: 'Stage', shift: '06:00 - 14:00', phone: '555-0102', status: 'on-duty' },
    { id: '3', name: 'Mike Roberts', role: 'Catering Coordinator', team: 'F&B', location: 'Kitchen', shift: '06:00 - 14:00', phone: '555-0103', status: 'break' },
    { id: '4', name: 'Lisa Kim', role: 'Registration Manager', team: 'Guest Services', location: 'Lobby', shift: '08:00 - 16:00', phone: '555-0104', status: 'on-duty' },
    { id: '5', name: 'David Park', role: 'Stage Manager', team: 'Production', location: 'Backstage', shift: '07:00 - 15:00', phone: '555-0105', status: 'on-duty' },
    { id: '6', name: 'Emma Wilson', role: 'Security Lead', team: 'Security', location: 'All Areas', shift: '06:00 - 18:00', phone: '555-0106', status: 'on-duty' },
    { id: '7', name: 'James Chen', role: 'Logistics Coordinator', team: 'Core Ops', location: 'Loading Dock', shift: '05:00 - 13:00', phone: '555-0107', status: 'off-duty' },
    { id: '8', name: 'Anna Martinez', role: 'VIP Liaison', team: 'Guest Services', location: 'VIP Lounge', shift: '09:00 - 17:00', phone: '555-0108', status: 'on-duty' },
  ]);

  const filteredStaff = staff.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.role.toLowerCase().includes(search.toLowerCase()) ||
    s.team.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: StaffMember['status']) => {
    switch (status) {
      case 'on-duty':
        return <Badge className="bg-green-500/10 text-green-600">On Duty</Badge>;
      case 'break':
        return <Badge className="bg-amber-500/10 text-amber-600">On Break</Badge>;
      case 'off-duty':
        return <Badge className="bg-muted-foreground/30/10 text-muted-foreground">Off Duty</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const onDutyCount = staff.filter(s => s.status === 'on-duty').length;
  const onBreakCount = staff.filter(s => s.status === 'break').length;

  const groupedStaff = filteredStaff.reduce((acc, member) => {
    if (!acc[member.team]) {
      acc[member.team] = [];
    }
    acc[member.team].push(member);
    return acc;
  }, {} as Record<string, StaffMember[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-500" />
            Team Roster - Staff Assignments
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 py-4">
          <div className="p-3 rounded-lg bg-green-500/10 text-center">
            <p className="text-2xl font-bold text-green-600">{onDutyCount}</p>
            <p className="text-xs text-muted-foreground">On Duty</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 text-center">
            <p className="text-2xl font-bold text-amber-600">{onBreakCount}</p>
            <p className="text-xs text-muted-foreground">On Break</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 text-center">
            <p className="text-2xl font-bold text-blue-600">{staff.length}</p>
            <p className="text-xs text-muted-foreground">Total Staff</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, role, or team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-[320px] pr-4">
          <div className="space-y-4">
            {Object.entries(groupedStaff).map(([team, members]) => (
              <div key={team}>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">{team}</h4>
                <div className="space-y-2">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-xs text-muted-foreground hidden sm:block">
                          <div className="flex items-center gap-1 justify-end">
                            <MapPin className="h-3 w-3" />
                            {member.location}
                          </div>
                          <div className="flex items-center gap-1 justify-end">
                            <Clock className="h-3 w-3" />
                            {member.shift}
                          </div>
                        </div>
                        {getStatusBadge(member.status)}
                        <a href={`tel:${member.phone}`} className="p-2 rounded-full hover:bg-muted">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
