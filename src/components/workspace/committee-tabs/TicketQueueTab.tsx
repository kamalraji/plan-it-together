import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Ticket, Clock, User, AlertCircle, CheckCircle, Circle, Plus, MoreVertical, AlertTriangle, Timer, Loader2, Trash2, ArrowUp } from "lucide-react";
import { useState } from "react";
import { useSupportTickets, SupportTicket } from "@/hooks/useSupportTickets";
import { formatDistanceToNow, isPast } from "date-fns";
import { Database } from "@/integrations/supabase/types";

type TicketPriority = Database['public']['Enums']['support_ticket_priority'];
type TicketCategory = Database['public']['Enums']['support_ticket_category'];

interface TicketQueueTabProps {
  workspaceId: string;
  eventId?: string;
}

export function TicketQueueTab({ workspaceId, eventId }: TicketQueueTabProps) {
  const {
    tickets,
    stats,
    isLoading,
    createTicket,
    changeStatus,
    changePriority,
    assignTicket,
    escalateTicket,
    deleteTicket,
  } = useSupportTickets(workspaceId, eventId);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEscalateOpen, setIsEscalateOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [escalationReason, setEscalationReason] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // New ticket form
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    category: 'other' as TicketCategory,
    priority: 'medium' as TicketPriority,
    location: '',
    affectedSystem: '',
    reporterName: '',
  });

  const handleCreateTicket = () => {
    if (!newTicket.title.trim()) return;
    createTicket.mutate({
      title: newTicket.title,
      description: newTicket.description || undefined,
      category: newTicket.category,
      priority: newTicket.priority,
      location: newTicket.location || undefined,
      affectedSystem: newTicket.affectedSystem || undefined,
      reporterName: newTicket.reporterName || undefined,
    });
    setNewTicket({ title: '', description: '', category: 'other', priority: 'medium', location: '', affectedSystem: '', reporterName: '' });
    setIsCreateOpen(false);
  };

  const handleEscalate = () => {
    if (selectedTicket && escalationReason.trim()) {
      escalateTicket(selectedTicket.id, escalationReason);
      setIsEscalateOpen(false);
      setSelectedTicket(null);
      setEscalationReason('');
    }
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case "critical": return <Badge className="bg-destructive/10 text-destructive text-xs">Critical</Badge>;
      case "high": return <Badge className="bg-warning/10 text-warning text-xs">High</Badge>;
      case "medium": return <Badge className="bg-primary/10 text-primary text-xs">Medium</Badge>;
      case "low": return <Badge className="bg-muted text-muted-foreground text-xs">Low</Badge>;
    }
  };

  const getStatusIcon = (ticket: SupportTicket) => {
    const isBreached = ticket.slaResolutionDeadline && isPast(ticket.slaResolutionDeadline) && 
      ticket.status !== 'resolved' && ticket.status !== 'closed';
    
    if (isBreached) return <AlertTriangle className="h-3 w-3 text-destructive" />;

    switch (ticket.status) {
      case "open": return <Circle className="h-3 w-3 text-primary fill-primary" />;
      case "assigned": return <User className="h-3 w-3 text-info" />;
      case "in_progress": return <AlertCircle className="h-3 w-3 text-warning" />;
      case "pending": 
      case "on_hold": return <Timer className="h-3 w-3 text-muted-foreground" />;
      case "resolved":
      case "closed": return <CheckCircle className="h-3 w-3 text-success" />;
      default: return null;
    }
  };

  const getSlaStatus = (ticket: SupportTicket) => {
    if (ticket.status === 'resolved' || ticket.status === 'closed') return null;
    if (!ticket.slaResolutionDeadline) return null;
    
    const isBreached = isPast(ticket.slaResolutionDeadline);
    if (isBreached) {
      return <Badge variant="destructive" className="text-xs">SLA Breached</Badge>;
    }
    
    const timeLeft = formatDistanceToNow(ticket.slaResolutionDeadline);
    return <span className="text-xs text-muted-foreground">Due in {timeLeft}</span>;
  };

  // Filter tickets
  const filteredTickets = tickets.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Ticket Queue</h2>
          <p className="text-sm text-muted-foreground">Manage support tickets with SLA tracking</p>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-primary">{stats.open}</div>
            <p className="text-xs text-muted-foreground">Open</p>
          </CardContent>
        </Card>
        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-warning">{stats.inProgress + stats.assigned}</div>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-destructive">{stats.critical}</div>
            <p className="text-xs text-muted-foreground">Critical</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-destructive">{stats.breachedSla}</div>
            <p className="text-xs text-muted-foreground">SLA Breached</p>
          </CardContent>
        </Card>
      </div>

      {/* Tickets List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            Active Tickets ({filteredTickets.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
              <p className="text-muted-foreground">No tickets match your filters</p>
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(ticket)}
                    <span className="text-xs text-muted-foreground font-mono">{ticket.ticketNumber}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{ticket.title}</p>
                      {ticket.isEscalated && (
                        <Badge variant="destructive" className="text-xs">Escalated</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs capitalize">{ticket.category}</Badge>
                      {ticket.location && (
                        <span className="text-xs text-muted-foreground">{ticket.location}</span>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(ticket.createdAt, { addSuffix: true })}
                      </span>
                      {getSlaStatus(ticket)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getPriorityBadge(ticket.priority)}
                  {ticket.assigneeName ? (
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {ticket.assigneeName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => {
                        // Self-assign for now (would need user picker)
                        assignTicket(ticket.id, null);
                      }}
                    >
                      <User className="h-3 w-3 mr-1" />
                      Assign
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => changeStatus(ticket.id, 'in_progress')}>
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Mark In Progress
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => changeStatus(ticket.id, 'pending')}>
                        <Timer className="h-4 w-4 mr-2" />
                        Mark Pending
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => changeStatus(ticket.id, 'resolved')}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Resolved
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => changePriority(ticket.id, 'critical')}>
                        <ArrowUp className="h-4 w-4 mr-2 text-destructive" />
                        Set Critical
                      </DropdownMenuItem>
                      {!ticket.isEscalated && (
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setIsEscalateOpen(true);
                          }}
                        >
                          <AlertTriangle className="h-4 w-4 mr-2 text-warning" />
                          Escalate
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => deleteTicket.mutate(ticket.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Create Ticket Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title *</label>
              <Input
                placeholder="Brief description of the issue"
                value={newTicket.title}
                onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Detailed description..."
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={newTicket.category} onValueChange={(v) => setNewTicket({ ...newTicket, category: v as TicketCategory })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">Bug</SelectItem>
                    <SelectItem value="request">Request</SelectItem>
                    <SelectItem value="question">Question</SelectItem>
                    <SelectItem value="incident">Incident</SelectItem>
                    <SelectItem value="feature">Feature</SelectItem>
                    <SelectItem value="hardware">Hardware</SelectItem>
                    <SelectItem value="network">Network</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={newTicket.priority} onValueChange={(v) => setNewTicket({ ...newTicket, priority: v as TicketPriority })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Input
                  placeholder="e.g., Room A, Main Hall"
                  value={newTicket.location}
                  onChange={(e) => setNewTicket({ ...newTicket, location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Affected System</label>
                <Input
                  placeholder="e.g., Projector, WiFi"
                  value={newTicket.affectedSystem}
                  onChange={(e) => setNewTicket({ ...newTicket, affectedSystem: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reporter Name</label>
              <Input
                placeholder="Who reported this issue?"
                value={newTicket.reporterName}
                onChange={(e) => setNewTicket({ ...newTicket, reporterName: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTicket} disabled={!newTicket.title.trim() || createTicket.isPending}>
              {createTicket.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Escalate Dialog */}
      <Dialog open={isEscalateOpen} onOpenChange={setIsEscalateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escalate Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Escalating will set this ticket to Critical priority and flag it for management attention.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Escalation Reason *</label>
              <Textarea
                placeholder="Why is this ticket being escalated?"
                value={escalationReason}
                onChange={(e) => setEscalationReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEscalateOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleEscalate} disabled={!escalationReason.trim()}>
              Escalate Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
