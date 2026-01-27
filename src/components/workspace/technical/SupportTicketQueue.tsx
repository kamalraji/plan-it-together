import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, AlertCircle, CheckCircle2, ArrowRight, Loader2, AlertTriangle, Timer } from 'lucide-react';
import { useSupportTickets, SupportTicket } from '@/hooks/useSupportTickets';
import { formatDistanceToNow, isPast } from 'date-fns';

interface SupportTicketQueueProps {
  workspaceId: string;
  eventId?: string;
  onViewAll?: () => void;
}

export function SupportTicketQueue({ workspaceId, eventId, onViewAll }: SupportTicketQueueProps) {
  const { tickets, stats, isLoading } = useSupportTickets(workspaceId, eventId);

  const getPriorityBadge = (priority: SupportTicket['priority']) => {
    switch (priority) {
      case 'critical':
        return <Badge className="bg-destructive text-destructive-foreground">Critical</Badge>;
      case 'high':
        return <Badge className="bg-warning/10 text-warning border-warning/20">High</Badge>;
      case 'medium':
        return <Badge className="bg-primary/10 text-primary border-primary/20">Medium</Badge>;
      case 'low':
        return <Badge variant="secondary">Low</Badge>;
    }
  };

  const getStatusIcon = (ticket: SupportTicket) => {
    // Check SLA breach
    const isBreached = ticket.slaResolutionDeadline && isPast(ticket.slaResolutionDeadline) && 
      ticket.status !== 'resolved' && ticket.status !== 'closed';
    
    if (isBreached) {
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    }

    switch (ticket.status) {
      case 'open':
        return <AlertCircle className="h-4 w-4 text-warning" />;
      case 'assigned':
      case 'in_progress':
        return <Clock className="h-4 w-4 text-primary" />;
      case 'pending':
      case 'on_hold':
        return <Timer className="h-4 w-4 text-muted-foreground" />;
      case 'resolved':
      case 'closed':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
    }
  };

  // Show only open/in-progress tickets, sorted by priority
  const activeTickets = tickets
    .filter(t => t.status !== 'resolved' && t.status !== 'closed')
    .sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 5);

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold text-foreground">Support Tickets</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {stats.open + stats.assigned + stats.inProgress} open 
            {stats.critical > 0 && <span className="text-destructive"> • {stats.critical} critical</span>}
            {stats.breachedSla > 0 && <span className="text-destructive"> • {stats.breachedSla} SLA breached</span>}
          </p>
        </div>
        {onViewAll && (
          <Button size="sm" variant="ghost" onClick={onViewAll}>
            View All
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {activeTickets.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
            <p className="text-muted-foreground">No open tickets</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-start justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  {getStatusIcon(ticket)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{ticket.ticketNumber}</span>
                      {getPriorityBadge(ticket.priority)}
                      {ticket.isEscalated && (
                        <Badge variant="destructive" className="text-xs">Escalated</Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground mt-1">{ticket.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ticket.reporterName || 'Unknown'} 
                      {ticket.location && ` • ${ticket.location}`} 
                      {' • '}{formatDistanceToNow(ticket.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                </div>
                {ticket.assigneeName && (
                  <span className="text-xs text-primary">{ticket.assigneeName}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
