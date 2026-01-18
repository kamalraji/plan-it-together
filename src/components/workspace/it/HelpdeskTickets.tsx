import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TicketCheck, Clock, User, ArrowRight, Plus, AlertTriangle, Timer, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useITTickets, ITTicket, CreateITTicketInput } from '@/hooks/useITTickets';

interface HelpdeskTicketsProps {
  workspaceId: string;
  eventId?: string;
}

export function HelpdeskTickets({ workspaceId, eventId }: HelpdeskTicketsProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTicket, setNewTicket] = useState<Partial<CreateITTicketInput>>({
    title: '',
    description: '',
    category: 'other',
    priority: 'medium',
    requesterName: '',
    requesterEmail: '',
  });

  const {
    tickets,
    stats,
    isLoading,
    createTicket,
    isCreating,
    formatRelativeTime,
    getTimeUntilDeadline,
  } = useITTickets(workspaceId);

  const getPriorityBadge = (priority: ITTicket['priority']) => {
    const styles: Record<ITTicket['priority'], string> = {
      critical: 'bg-destructive text-destructive-foreground',
      urgent: 'bg-destructive/80 text-destructive-foreground',
      high: 'bg-warning/10 text-warning border-warning/20',
      medium: 'bg-primary/10 text-primary border-primary/20',
      low: 'bg-muted text-muted-foreground',
    };
    return <Badge className={styles[priority]}>{priority}</Badge>;
  };

  const getStatusBadge = (status: ITTicket['status']) => {
    const styles: Record<ITTicket['status'], { className: string; label: string }> = {
      new: { className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', label: 'New' },
      assigned: { className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400', label: 'Assigned' },
      in_progress: { className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', label: 'In Progress' },
      pending_info: { className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400', label: 'Pending Info' },
      escalated: { className: 'bg-red-500/10 text-red-600 dark:text-red-400', label: 'Escalated' },
      resolved: { className: 'bg-green-500/10 text-green-600 dark:text-green-400', label: 'Resolved' },
      closed: { className: 'bg-muted text-muted-foreground', label: 'Closed' },
    };
    const style = styles[status];
    return <Badge className={style.className}>{style.label}</Badge>;
  };

  const getCategoryBadge = (category: ITTicket['category']) => {
    const colors: Record<ITTicket['category'], string> = {
      software: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      hardware: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      access: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
      network: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
      security: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
      other: 'bg-muted text-muted-foreground',
    };
    return <Badge className={colors[category]}>{category}</Badge>;
  };

  const handleCreateTicket = () => {
    if (!newTicket.title || !newTicket.requesterName) return;
    
    createTicket({
      workspaceId,
      eventId,
      title: newTicket.title,
      description: newTicket.description,
      category: newTicket.category as ITTicket['category'],
      priority: newTicket.priority as ITTicket['priority'],
      requesterName: newTicket.requesterName,
      requesterEmail: newTicket.requesterEmail,
    });
    
    setNewTicket({
      title: '',
      description: '',
      category: 'other',
      priority: 'medium',
      requesterName: '',
      requesterEmail: '',
    });
    setIsCreateOpen(false);
  };

  const openTickets = tickets.filter(t => !['resolved', 'closed'].includes(t.status));

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <TicketCheck className="h-5 w-5 text-primary" />
            <div>
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-20 mt-1" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/50">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <TicketCheck className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">IT Helpdesk</CardTitle>
            <p className="text-sm text-muted-foreground">{stats.open} open tickets</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" /> New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create IT Ticket</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={newTicket.title || ''}
                    onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                    placeholder="Brief issue description"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTicket.description || ''}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                    placeholder="Detailed description of the issue"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={newTicket.category}
                      onValueChange={(value) => setNewTicket({ ...newTicket, category: value as ITTicket['category'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="software">Software</SelectItem>
                        <SelectItem value="hardware">Hardware</SelectItem>
                        <SelectItem value="network">Network</SelectItem>
                        <SelectItem value="access">Access</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={newTicket.priority}
                      onValueChange={(value) => setNewTicket({ ...newTicket, priority: value as ITTicket['priority'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requesterName">Requester Name *</Label>
                  <Input
                    id="requesterName"
                    value={newTicket.requesterName || ''}
                    onChange={(e) => setNewTicket({ ...newTicket, requesterName: e.target.value })}
                    placeholder="Who is reporting this issue?"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requesterEmail">Requester Email</Label>
                  <Input
                    id="requesterEmail"
                    type="email"
                    value={newTicket.requesterEmail || ''}
                    onChange={(e) => setNewTicket({ ...newTicket, requesterEmail: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <Button
                  onClick={handleCreateTicket}
                  disabled={!newTicket.title || !newTicket.requesterName || isCreating}
                  className="w-full"
                >
                  {isCreating ? 'Creating...' : 'Create Ticket'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button size="sm" variant="ghost">
            View All <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="p-2 rounded-lg bg-blue-500/10 text-center">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{stats.new}</div>
            <div className="text-xs text-muted-foreground">New</div>
          </div>
          <div className="p-2 rounded-lg bg-amber-500/10 text-center">
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{stats.inProgress}</div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </div>
          <div className="p-2 rounded-lg bg-red-500/10 text-center">
            <div className="text-lg font-bold text-red-600 dark:text-red-400">{stats.escalated}</div>
            <div className="text-xs text-muted-foreground">Escalated</div>
          </div>
          <div className="p-2 rounded-lg bg-green-500/10 text-center">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">{stats.resolved}</div>
            <div className="text-xs text-muted-foreground">Resolved</div>
          </div>
        </div>

        {/* SLA Warning */}
        {stats.slaBreached > 0 && (
          <div className="flex items-center gap-2 p-2 mb-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive font-medium">
              {stats.slaBreached} ticket(s) have breached SLA
            </span>
          </div>
        )}

        {/* Tickets List */}
        <div className="space-y-3">
          {tickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TicketCheck className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No tickets yet</p>
              <p className="text-sm">Create a new ticket to get started</p>
            </div>
          ) : (
            openTickets.slice(0, 5).map((ticket) => {
              const slaInfo = getTimeUntilDeadline(ticket.slaResolutionDeadline);
              
              return (
                <div
                  key={ticket.id}
                  className={`p-3 rounded-lg transition-colors cursor-pointer active:scale-[0.98] ${
                    ticket.status === 'resolved' || ticket.status === 'closed'
                      ? 'bg-muted/30 opacity-60'
                      : slaInfo.isOverdue
                      ? 'bg-destructive/5 border border-destructive/20'
                      : 'bg-muted/50 hover:bg-muted'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-muted-foreground">{ticket.ticketNumber}</span>
                      {getPriorityBadge(ticket.priority)}
                      {getCategoryBadge(ticket.category)}
                      {getStatusBadge(ticket.status)}
                    </div>
                    {/* SLA indicator */}
                    {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                      <div className={`flex items-center gap-1 text-xs ${
                        slaInfo.isOverdue 
                          ? 'text-destructive' 
                          : slaInfo.isUrgent 
                          ? 'text-warning' 
                          : 'text-muted-foreground'
                      }`}>
                        <Timer className="h-3 w-3" />
                        {slaInfo.text}
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground">{ticket.title}</p>
                  {ticket.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{ticket.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {ticket.requesterName}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(ticket.createdAt)}
                    </div>
                    {ticket.assignedToName && (
                      <span className="text-primary">→ {ticket.assignedToName}</span>
                    )}
                    {ticket.escalationLevel > 0 && (
                      <Badge variant="outline" className="text-xs text-destructive border-destructive/30">
                        L{ticket.escalationLevel} Escalation
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Avg Resolution Time */}
        {stats.avgResolutionTime !== 'N/A' && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Avg Resolution Time</span>
            </div>
            <span className="text-sm font-medium">{stats.avgResolutionTime}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
