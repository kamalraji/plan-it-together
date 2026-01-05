import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Ticket } from 'lucide-react';

interface TicketTypeBreakdownProps {
  workspaceId: string;
}

interface TicketType {
  name: string;
  registered: number;
  capacity: number;
  checkedIn: number;
  color: string;
}

const ticketTypes: TicketType[] = [
  { name: 'VIP Pass', registered: 150, capacity: 200, checkedIn: 120, color: 'hsl(280, 65%, 60%)' },
  { name: 'General', registered: 850, capacity: 1000, checkedIn: 580, color: 'hsl(var(--primary))' },
  { name: 'Student', registered: 200, capacity: 250, checkedIn: 120, color: 'hsl(142, 76%, 36%)' },
  { name: 'Speaker', registered: 50, capacity: 50, checkedIn: 27, color: 'hsl(38, 92%, 50%)' },
];

export function TicketTypeBreakdown({ workspaceId: _workspaceId }: TicketTypeBreakdownProps) {
  const totalRegistered = ticketTypes.reduce((sum, t) => sum + t.registered, 0);
  const totalCheckedIn = ticketTypes.reduce((sum, t) => sum + t.checkedIn, 0);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Ticket className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Ticket Breakdown</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalRegistered.toLocaleString()} total · {totalCheckedIn.toLocaleString()} checked in
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {ticketTypes.map((ticket, index) => {
          const registeredPercent = Math.round((ticket.registered / ticket.capacity) * 100);
          const checkedInPercent = Math.round((ticket.checkedIn / ticket.registered) * 100);
          
          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: ticket.color }}
                  />
                  <span className="text-sm font-medium">{ticket.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold">{ticket.registered}</span>
                  <span className="text-xs text-muted-foreground">/{ticket.capacity}</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <Progress 
                  value={registeredPercent} 
                  className="h-2"
                  style={{ 
                    '--progress-background': ticket.color 
                  } as React.CSSProperties}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{registeredPercent}% sold</span>
                  <span>{checkedInPercent}% checked in ({ticket.checkedIn})</span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
