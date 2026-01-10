import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Ticket, Clock, User, AlertCircle, CheckCircle, Circle, Plus, Filter } from "lucide-react";

interface TicketQueueTabProps {
  workspaceId: string;
}

export function TicketQueueTab({ workspaceId: _workspaceId }: TicketQueueTabProps) {
  const tickets = [
    { id: "TKT-001", title: "Login page not loading", priority: "high", status: "open", assignee: "JD", created: "10 min ago", category: "Bug" },
    { id: "TKT-002", title: "Request for new user account", priority: "medium", status: "in-progress", assignee: "SM", created: "1 hour ago", category: "Request" },
    { id: "TKT-003", title: "Email notifications delayed", priority: "high", status: "open", assignee: null, created: "2 hours ago", category: "Bug" },
    { id: "TKT-004", title: "Password reset not working", priority: "critical", status: "open", assignee: "JD", created: "30 min ago", category: "Bug" },
    { id: "TKT-005", title: "Dashboard loading slow", priority: "low", status: "in-progress", assignee: "AK", created: "3 hours ago", category: "Performance" },
    { id: "TKT-006", title: "Feature request: Dark mode", priority: "low", status: "pending", assignee: null, created: "1 day ago", category: "Feature" },
  ];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical": return <Badge className="bg-red-500/10 text-red-600 text-xs">Critical</Badge>;
      case "high": return <Badge className="bg-orange-500/10 text-orange-600 text-xs">High</Badge>;
      case "medium": return <Badge className="bg-yellow-500/10 text-yellow-600 text-xs">Medium</Badge>;
      case "low": return <Badge className="bg-blue-500/10 text-blue-600 text-xs">Low</Badge>;
      default: return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open": return <Circle className="h-3 w-3 text-blue-500 fill-blue-500" />;
      case "in-progress": return <AlertCircle className="h-3 w-3 text-yellow-500" />;
      case "pending": return <Clock className="h-3 w-3 text-muted-foreground" />;
      case "resolved": return <CheckCircle className="h-3 w-3 text-green-500" />;
      default: return null;
    }
  };

  const openCount = tickets.filter(t => t.status === "open").length;
  const inProgressCount = tickets.filter(t => t.status === "in-progress").length;
  const criticalCount = tickets.filter(t => t.priority === "critical").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Ticket Queue</h2>
          <p className="text-sm text-muted-foreground">Manage support tickets</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-blue-600">{openCount}</div>
            <p className="text-xs text-muted-foreground">Open</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-yellow-600">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-red-600">{criticalCount}</div>
            <p className="text-xs text-muted-foreground">Critical</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            Active Tickets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(ticket.status)}
                  <span className="text-xs text-muted-foreground font-mono">{ticket.id}</span>
                </div>
                <div>
                  <p className="text-sm font-medium">{ticket.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{ticket.category}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {ticket.created}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getPriorityBadge(ticket.priority)}
                {ticket.assignee ? (
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">{ticket.assignee}</AvatarFallback>
                  </Avatar>
                ) : (
                  <Button variant="ghost" size="sm" className="text-xs">
                    <User className="h-3 w-3 mr-1" />
                    Assign
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
