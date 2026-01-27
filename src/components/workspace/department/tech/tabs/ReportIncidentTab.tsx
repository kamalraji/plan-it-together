import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, AlertTriangle, Info, Clock, Plus, Send } from 'lucide-react';
import { toast } from 'sonner';

interface ReportIncidentTabProps {
  workspaceId: string;
}

const recentIncidents = [
  { id: 1, title: 'Network Outage - Building A', severity: 'critical', status: 'resolved', reporter: 'John Smith', reported: '2 hours ago' },
  { id: 2, title: 'Email Service Degradation', severity: 'high', status: 'investigating', reporter: 'Jane Doe', reported: '4 hours ago' },
  { id: 3, title: 'Printer Malfunction - Floor 3', severity: 'low', status: 'open', reporter: 'Mike Johnson', reported: '1 day ago' },
  { id: 4, title: 'VPN Connection Issues', severity: 'medium', status: 'resolved', reporter: 'Sarah Wilson', reported: '2 days ago' },
];

const getSeverityBadge = (severity: string) => {
  switch (severity) {
    case 'critical': return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Critical</Badge>;
    case 'high': return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">High</Badge>;
    case 'medium': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Medium</Badge>;
    case 'low': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Low</Badge>;
    default: return null;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'open': return <Badge variant="outline">Open</Badge>;
    case 'investigating': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Investigating</Badge>;
    case 'resolved': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Resolved</Badge>;
    default: return null;
  }
};

export function ReportIncidentTab({ workspaceId: _workspaceId }: ReportIncidentTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error('Please enter an incident title');
      return;
    }
    toast.success('Incident reported successfully');
    setShowForm(false);
    setTitle('');
    setDescription('');
    setSeverity('medium');
  };

  const openIncidents = recentIncidents.filter(i => i.status !== 'resolved').length;
  const criticalIncidents = recentIncidents.filter(i => i.severity === 'critical' && i.status !== 'resolved').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Report Incident</h2>
          <p className="text-muted-foreground">Report and track IT incidents</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          New Incident
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold text-amber-500">{openIncidents}</p>
                <p className="text-sm text-muted-foreground">Open Incidents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-500">{criticalIncidents}</p>
                <p className="text-sm text-muted-foreground">Critical</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{recentIncidents.length}</p>
                <p className="text-sm text-muted-foreground">Total This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Incident Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Report New Incident
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Incident Title</Label>
              <Input
                id="title"
                placeholder="Brief description of the issue"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Provide detailed information about the incident..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Severity</Label>
              <div className="flex gap-2">
                {['low', 'medium', 'high', 'critical'].map((sev) => (
                  <Button
                    key={sev}
                    type="button"
                    variant={severity === sev ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSeverity(sev)}
                    className="capitalize"
                  >
                    {sev}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>
                <Send className="h-4 w-4 mr-2" />
                Submit Incident
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Incidents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Recent Incidents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentIncidents.map((incident) => (
              <div key={incident.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-4">
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{incident.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Reported by {incident.reporter} • {incident.reported}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getSeverityBadge(incident.severity)}
                  {getStatusBadge(incident.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
