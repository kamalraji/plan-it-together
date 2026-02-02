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
import { AlertCircle, Plus, Clock, User, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface IncidentReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Incident {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolved';
  location: string;
  reportedBy: string;
  reportedAt: string;
  description: string;
}

export function IncidentReportModal({ open, onOpenChange }: IncidentReportModalProps) {
  const [activeTab, setActiveTab] = useState('list');
  const [incidents, setIncidents] = useState<Incident[]>([
    {
      id: '1',
      title: 'Power outage in Hall B',
      severity: 'critical',
      status: 'investigating',
      location: 'Hall B',
      reportedBy: 'John D.',
      reportedAt: '09:45 AM',
      description: 'Partial power outage affecting AV equipment'
    },
    {
      id: '2',
      title: 'Water leak near entrance',
      severity: 'medium',
      status: 'resolved',
      location: 'Main Lobby',
      reportedBy: 'Sarah M.',
      reportedAt: '08:30 AM',
      description: 'Small water leak from ceiling, maintenance notified'
    },
    {
      id: '3',
      title: 'Missing registration tablets',
      severity: 'high',
      status: 'open',
      location: 'Registration Desk',
      reportedBy: 'Lisa K.',
      reportedAt: '07:15 AM',
      description: '2 tablets not found in storage'
    },
  ]);

  const [newIncident, setNewIncident] = useState({
    title: '',
    severity: 'medium' as Incident['severity'],
    location: '',
    description: '',
  });

  const getSeverityBadge = (severity: Incident['severity']) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-500 text-white">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-500/10 text-orange-600">High</Badge>;
      case 'medium':
        return <Badge className="bg-amber-500/10 text-amber-600">Medium</Badge>;
      case 'low':
        return <Badge className="bg-muted-foreground/30/10 text-muted-foreground">Low</Badge>;
    }
  };

  const getStatusBadge = (status: Incident['status']) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline" className="text-red-600 border-red-600">Open</Badge>;
      case 'investigating':
        return <Badge variant="outline" className="text-amber-600 border-amber-600">Investigating</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="text-green-600 border-green-600">Resolved</Badge>;
    }
  };

  const handleSubmit = () => {
    if (!newIncident.title || !newIncident.location) {
      toast.error('Please fill in required fields');
      return;
    }

    const incident: Incident = {
      id: Date.now().toString(),
      ...newIncident,
      status: 'open',
      reportedBy: 'Current User',
      reportedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setIncidents(prev => [incident, ...prev]);
    setNewIncident({ title: '', severity: 'medium', location: '', description: '' });
    setActiveTab('list');
    toast.success('Incident reported successfully');
  };

  const openCount = incidents.filter(i => i.status === 'open').length;
  const investigatingCount = incidents.filter(i => i.status === 'investigating').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
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
              <div className="space-y-3 pt-4">
                {incidents.map((incident) => (
                  <div key={incident.id} className="p-4 rounded-lg border border-border">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{incident.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{incident.description}</p>
                      </div>
                      <div className="flex gap-2">
                        {getSeverityBadge(incident.severity)}
                        {getStatusBadge(incident.status)}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {incident.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {incident.reportedBy}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {incident.reportedAt}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
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
                    onValueChange={(value: Incident['severity']) => 
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
                <Button onClick={handleSubmit} className="bg-red-500 hover:bg-red-600">
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
