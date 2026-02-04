import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  ListOrdered, 
  UserPlus,
  Mail,
  ChevronUp,
  ChevronDown,
  Check,
  X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface WaitlistEntry {
  id: string;
  name: string;
  email: string;
  ticketType: string;
  position: number;
  joinedAt: Date;
  priority: 'normal' | 'high';
}

interface WaitlistManagerProps {
  workspaceId: string;
}

const mockWaitlist: WaitlistEntry[] = [
  {
    id: '1',
    name: 'Arun Kumar',
    email: 'arun.k@email.com',
    ticketType: 'General',
    position: 1,
    joinedAt: new Date('2025-01-03T14:30:00'),
    priority: 'high',
  },
  {
    id: '2',
    name: 'Sneha Reddy',
    email: 'sneha.r@email.com',
    ticketType: 'VIP Pass',
    position: 2,
    joinedAt: new Date('2025-01-03T16:00:00'),
    priority: 'normal',
  },
  {
    id: '3',
    name: 'Kiran Joshi',
    email: 'kiran.j@email.com',
    ticketType: 'General',
    position: 3,
    joinedAt: new Date('2025-01-04T09:15:00'),
    priority: 'normal',
  },
  {
    id: '4',
    name: 'Deepa Menon',
    email: 'deepa.m@email.com',
    ticketType: 'Student',
    position: 4,
    joinedAt: new Date('2025-01-04T11:45:00'),
    priority: 'normal',
  },
];

export function WaitlistManager({ workspaceId: _workspaceId }: WaitlistManagerProps) {
  const [waitlist] = useState<WaitlistEntry[]>(mockWaitlist);

  const availableSpots = 12; // Mock - spots that became available

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-violet-500/10">
              <ListOrdered className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Waitlist Manager</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {waitlist.length} in queue · {availableSpots} spots available
              </p>
            </div>
          </div>
          <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
            <UserPlus className="w-4 h-4" />
            Promote Next
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {waitlist.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ListOrdered className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>Waitlist is empty</p>
          </div>
        ) : (
          waitlist.map((entry, index) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  #{entry.position}
                </div>
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs bg-muted">
                    {entry.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{entry.name}</p>
                    {entry.priority === 'high' && (
                      <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-[10px]">
                        Priority
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{entry.ticketType}</span>
                    <span>·</span>
                    <span>Joined {formatDistanceToNow(entry.joinedAt, { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" disabled={index === 0}>
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" disabled={index === waitlist.length - 1}>
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600 hover:bg-emerald-500/10">
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}

        {availableSpots > 0 && waitlist.length > 0 && (
          <div className="pt-3 border-t border-border/50">
            <Button variant="outline" className="w-full gap-2">
              <Mail className="w-4 h-4" />
              Send Invites to Top {Math.min(availableSpots, waitlist.length)}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
