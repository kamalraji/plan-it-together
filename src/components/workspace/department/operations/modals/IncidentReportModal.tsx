import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Plus, Clock, User, MapPin, Loader2 } from 'lucide-react';
import { useIncidents, useCreateIncident } from '@/hooks/useOperationsDepartmentData';

interface IncidentReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId?: string;
}

type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';

export function IncidentReportModal({ open, onOpenChange, workspaceId }: IncidentReportModalProps) {
  const [activeTab, setActiveTab] = useState('list');
  const [newIncident, setNewIncident] = useState({
    title: '',
    severity: 'medium' as IncidentSeverity,
    location: '',
    description: '',
  });

  const { data: incidents = [], isLoading } = useIncidents(workspaceId);
  const createIncident = useCreateIncident(workspaceId);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-destructive text-primary-foreground">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-500/10 text-orange-600">High</Badge>;
      case 'medium':
        return <Badge className="bg-warning/10 text-warning">Medium</Badge>;
      case 'low':
        return <Badge className="bg-muted-foreground/30/10 text-muted-foreground">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline" className="text-destructive border-destructive">Open</Badge>;
      case 'investigating':
        return <Badge variant="outline" className="text-warning border-amber-600">Investigating</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="text-success border-success">Resolved</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleSubmit = () => {
    if (!newIncident.title || !newIncident.location) {
      return;
    }

    createIncident.mutate({
      title: newIncident.title,
      severity: newIncident.severity,
      location: newIncident.location,
      description: newIncident.description,
      status: 'open',
    }, {
      onSuccess: () => {
        setNewIncident({ title: '', severity: 'medium', location: '', description: '' });
        setActiveTab('list');
      },
    });
  };

  const openCount = incidents.filter(i => i.status === 'open').length;
  const investigatingCount = incidents.filter(i => i.status === 'investigating').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Incident Report - Log Issues & Alerts
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">
              Active Incidents ({openCount + investigatingCount})
            </TabsTrigger>
            <TabsTrigger value="new">
              <Plus className="h-4 w-4 mr-1" />
              New Report
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <ScrollArea className="h-[380px] pr-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : incidents.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No incidents reported</p>
                </div>
              ) : (
                <div className="space-y-3 pt-4">
                  {incidents.map((incident) => (
                    <div key={incident.id} className="p-4 rounded-lg border border-border">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{incident.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{incident.description}</p>
                        </div>
                        <div className="flex gap-2">
                          {getSeverityBadge(incident.severity || 'medium')}
                          {getStatusBadge(incident.status || 'open')}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {incident.location || 'Unknown Location'}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {incident.reported_by_name || 'Unknown'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {incident.created_at 
                            ? new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'Unknown'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="new">
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Incident Title *</Label>
                <Input
                  id="title"
                  placeholder="Brief description of the issue"
                  value={newIncident.title}
                  onChange={(e) => setNewIncident(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="severity">Severity Level</Label>
                  <Select
                    value={newIncident.severity}
                    onValueChange={(value: IncidentSeverity) => 
                      setNewIncident(prev => ({ ...prev, severity: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    placeholder="Where did this occur?"
                    value={newIncident.location}
                    onChange={(e) => setNewIncident(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide additional details about the incident..."
                  rows={4}
                  value={newIncident.description}
                  onChange={(e) => setNewIncident(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setActiveTab('list')}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  className="bg-red-500 hover:bg-red-600"
                  disabled={createIncident.isPending}
                >
                  {createIncident.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Submit Report
                </Button>
              </DialogFooter>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
