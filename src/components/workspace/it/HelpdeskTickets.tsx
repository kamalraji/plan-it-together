import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TicketCheck, Clock, User, ArrowRight } from 'lucide-react';

interface Ticket {
  id: string;
  title: string;
  requester: string;
  category: 'software' | 'hardware' | 'access' | 'network' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'assigned' | 'in_progress' | 'resolved';
  assignedTo?: string;
  createdAt: string;
}

export function HelpdeskTickets() {
  const tickets: Ticket[] = [
    { id: 'HD-101', title: 'Cannot access registration portal', requester: 'Jane Wilson', category: 'access', priority: 'urgent', status: 'in_progress', assignedTo: 'Mike T.', createdAt: '15 min ago' },
    { id: 'HD-102', title: 'Need software license for badge printer', requester: 'Tom Chen', category: 'software', priority: 'high', status: 'assigned', assignedTo: 'Sarah K.', createdAt: '1 hour ago' },
    { id: 'HD-103', title: 'VPN connection issues', requester: 'Emily Davis', category: 'network', priority: 'medium', status: 'new', createdAt: '2 hours ago' },
    { id: 'HD-104', title: 'Laptop keyboard not working', requester: 'John Smith', category: 'hardware', priority: 'low', status: 'resolved', createdAt: '3 hours ago' },
  ];

  const getPriorityBadge = (priority: Ticket['priority']) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-destructive text-destructive-foreground">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-warning/10 text-warning border-warning/20">High</Badge>;
      case 'medium':
        return <Badge className="bg-primary/10 text-primary border-primary/20">Medium</Badge>;
      case 'low':
        return <Badge variant="secondary">Low</Badge>;
    }
  };

  const getCategoryBadge = (category: Ticket['category']) => {
    const colors: Record<Ticket['category'], string> = {
      software: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      hardware: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      access: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
      network: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
      other: 'bg-muted text-muted-foreground',
    };
    return <Badge className={colors[category]}>{category}</Badge>;
  };

  const openTickets = tickets.filter(t => t.status !== 'resolved');

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <TicketCheck className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">Helpdesk</CardTitle>
            <p className="text-sm text-muted-foreground">{openTickets.length} open tickets</p>
          </div>
        </div>
        <Button size="sm" variant="ghost">
          View All <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className={`p-3 rounded-lg transition-colors cursor-pointer ${
                ticket.status === 'resolved' ? 'bg-muted/30 opacity-60' : 'bg-muted/50 hover:bg-muted'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">{ticket.id}</span>
                  {getPriorityBadge(ticket.priority)}
                  {getCategoryBadge(ticket.category)}
                </div>
              </div>
              <p className="text-sm font-medium text-foreground">{ticket.title}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {ticket.requester}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {ticket.createdAt}
                </div>
                {ticket.assignedTo && (
                  <span>Assigned to: {ticket.assignedTo}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
