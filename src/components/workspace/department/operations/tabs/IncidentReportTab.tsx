import { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, AlertTriangle, MapPin, User, Clock, Plus, Loader2, CheckCircle2 } from 'lucide-react';
import {
  useIncidents,
  useCreateIncident,
  useUpdateIncident,
  useResolveIncident,
  useDeleteIncident,
  Incident,
} from '@/hooks/useOperationsDepartmentData';
import { format } from 'date-fns';

interface IncidentReportTabProps {
  workspace: Workspace;
}

export function IncidentReportTab({ workspace }: IncidentReportTabProps) {
  const { data: incidents, isLoading } = useIncidents(workspace.id);
  const createIncident = useCreateIncident(workspace.id);
  const updateIncident = useUpdateIncident(workspace.id);
  const resolveIncident = useResolveIncident(workspace.id);
  const deleteIncident = useDeleteIncident(workspace.id);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [newIncident, setNewIncident] = useState({
    title: '',
    description: '',
    severity: 'medium' as Incident['severity'],
    location: '',
  });

  const getSeverityBadge = (severity: Incident['severity']) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-destructive text-primary-foreground border-red-700">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30">High</Badge>;
      case 'medium':
        return <Badge className="bg-warning/20 text-warning border-warning/30">Medium</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground">Low</Badge>;
    }
  };

  const getStatusBadge = (status: Incident['status']) => {
    switch (status) {
      case 'resolved':
        return <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />Resolved</Badge>;
      case 'closed':
        return <Badge className="bg-muted text-muted-foreground">Closed</Badge>;
      case 'investigating':
        return <Badge className="bg-info/20 text-info border-info/30">Investigating</Badge>;
      default:
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Open</Badge>;
    }
  };

  const handleAddIncident = () => {
    if (!newIncident.title.trim()) return;
    createIncident.mutate({
      title: newIncident.title,
      description: newIncident.description || null,
      severity: newIncident.severity,
      location: newIncident.location || null,
      status: 'open',
    });
    setNewIncident({ title: '', description: '', severity: 'medium', location: '' });
    setIsAddModalOpen(false);
  };

  const handleStatusChange = (id: string, status: Incident['status']) => {
    if (status === 'resolved') {
      setSelectedIncidentId(id);
      setIsResolveModalOpen(true);
    } else {
      updateIncident.mutate({ id, status });
    }
  };

  const handleResolve = () => {
    if (!selectedIncidentId) return;
    resolveIncident.mutate({
      id: selectedIncidentId,
      resolution_notes: resolutionNotes || undefined,
    });
    setResolutionNotes('');
    setSelectedIncidentId(null);
    setIsResolveModalOpen(false);
  };

  const openIncidents = incidents?.filter(i => i.status === 'open' || i.status === 'investigating') || [];
  const resolvedIncidents = incidents?.filter(i => i.status === 'resolved' || i.status === 'closed') || [];
  const criticalCount = incidents?.filter(i => i.severity === 'critical' && i.status !== 'resolved' && i.status !== 'closed').length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Incident Report</h2>
          <p className="text-muted-foreground">Log and track incidents</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Report Incident
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-destructive/20 rounded-full">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <div className="text-3xl font-bold text-destructive">{openIncidents.length}</div>
                <p className="text-sm text-muted-foreground">Open Incidents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-500/10 border-orange-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/20 rounded-full">
                <AlertTriangle className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-500">{criticalCount}</div>
                <p className="text-sm text-muted-foreground">Critical</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/10 border-emerald-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/20 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <div className="text-3xl font-bold text-emerald-500">{resolvedIncidents.length}</div>
                <p className="text-sm text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Incidents ({openIncidents.length})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({resolvedIncidents.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-6">
              <ScrollArea className="h-[400px] pr-4">
                {openIncidents.length > 0 ? (
                  <div className="space-y-4">
                    {openIncidents.map((incident) => (
                      <div
                        key={incident.id}
                        className={`p-4 rounded-lg transition-colors ${
                          incident.severity === 'critical' ? 'bg-destructive/10 border border-destructive/30' : 'bg-muted/30 hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <h4 className="font-semibold text-foreground">{incident.title}</h4>
                            {incident.description && (
                              <p className="text-sm text-muted-foreground mt-1">{incident.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {getSeverityBadge(incident.severity)}
                            {getStatusBadge(incident.status)}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                          {incident.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {incident.location}
                            </span>
                          )}
                          {incident.reported_by_name && (
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              {incident.reported_by_name}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {format(new Date(incident.created_at), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Select
                            value={incident.status}
                            onValueChange={(value) => handleStatusChange(incident.id, value as Incident['status'])}
                          >
                            <SelectTrigger className="w-32 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="investigating">Investigating</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-destructive hover:text-destructive"
                            onClick={() => deleteIncident.mutate(incident.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-emerald-500" />
                    <p>No active incidents</p>
                    <p className="text-sm">All clear! No open incidents at this time.</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolved">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-6">
              <ScrollArea className="h-[400px] pr-4">
                {resolvedIncidents.length > 0 ? (
                  <div className="space-y-4">
                    {resolvedIncidents.map((incident) => (
                      <div
                        key={incident.id}
                        className="p-4 rounded-lg bg-muted/30"
                      >
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h4 className="font-semibold text-foreground">{incident.title}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            {getSeverityBadge(incident.severity)}
                            {getStatusBadge(incident.status)}
                          </div>
                        </div>
                        {incident.resolution_notes && (
                          <p className="text-sm text-emerald-600 mt-2 p-2 bg-emerald-500/10 rounded">
                            Resolution: {incident.resolution_notes}
                          </p>
                        )}
                        {incident.resolved_at && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Resolved: {format(new Date(incident.resolved_at), 'MMM d, h:mm a')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No resolved incidents</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Incident Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report New Incident</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="Brief description of the incident"
                value={newIncident.title}
                onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Detailed description of what happened..."
                value={newIncident.description}
                onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select
                  value={newIncident.severity}
                  onValueChange={(value) => setNewIncident({ ...newIncident, severity: value as Incident['severity'] })}
                >
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
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  placeholder="e.g., Main Hall"
                  value={newIncident.location}
                  onChange={(e) => setNewIncident({ ...newIncident, location: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddIncident} disabled={createIncident.isPending}>
              {createIncident.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Report Incident
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Modal */}
      <Dialog open={isResolveModalOpen} onOpenChange={setIsResolveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Incident</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Resolution Notes</Label>
              <Textarea
                placeholder="Describe how the incident was resolved..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResolveModalOpen(false)}>Cancel</Button>
            <Button onClick={handleResolve} disabled={resolveIncident.isPending}>
              {resolveIncident.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Mark Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
