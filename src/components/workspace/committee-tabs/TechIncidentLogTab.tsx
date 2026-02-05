import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTechIncidents, TechIncident } from '@/hooks/useTechIncidents';
import { Plus, Clock, Search, CheckCircle2, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TechIncidentLogTabProps {
  workspaceId: string;
}

const INCIDENT_TYPES = [
  { value: 'technical', label: 'Technical' },
  { value: 'network', label: 'Network' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'power', label: 'Power' },
  { value: 'software', label: 'Software' },
  { value: 'av', label: 'Audio/Visual' },
];

const SEVERITY_CONFIG = {
  critical: { color: 'bg-destructive/20 text-destructive border-destructive/30', icon: '🔴' },
  high: { color: 'bg-orange-500/20 text-orange-600 border-orange-500/30', icon: '🟠' },
  medium: { color: 'bg-warning/20 text-warning border-warning/30', icon: '🟡' },
  low: { color: 'bg-success/20 text-success border-success/30', icon: '🟢' },
};

const STATUS_CONFIG = {
  open: { color: 'bg-destructive/20 text-destructive', label: 'Open' },
  investigating: { color: 'bg-warning/20 text-warning', label: 'Investigating' },
  resolved: { color: 'bg-info/20 text-info', label: 'Resolved' },
  closed: { color: 'bg-success/20 text-success', label: 'Closed' },
};

export function TechIncidentLogTab({ workspaceId }: TechIncidentLogTabProps) {
  const { incidents, stats, isLoading, createIncident, resolveIncident, addRootCause, markReviewed } = useTechIncidents({ workspaceId });
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<TechIncident | null>(null);
  const [isRCAOpen, setIsRCAOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // New incident form state
  const [newIncident, setNewIncident] = useState({
    title: '',
    description: '',
    severity: 'medium' as const,
    incidentType: 'technical',
    affectedSystems: '',
  });

  // RCA form state
  const [rcaForm, setRcaForm] = useState({
    rootCause: '',
    impactAssessment: '',
    preventiveActions: '',
  });

  // Review form state
  const [reviewForm, setReviewForm] = useState({
    postEventNotes: '',
    lessonsLearned: '',
  });

  const filteredIncidents = incidents.filter(incident => {
    if (filter === 'open') return incident.status === 'open' || incident.status === 'investigating';
    if (filter === 'critical') return incident.severity === 'critical' && incident.status !== 'closed';
    if (filter === 'needs_rca') return (incident.status === 'resolved' || incident.status === 'closed') && !incident.rootCause;
    if (filter === 'pending_review') return incident.status === 'resolved' && !incident.reviewedAt;
    return true;
  }).filter(incident => 
    incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    incident.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateIncident = async () => {
    await createIncident({
      title: newIncident.title,
      description: newIncident.description,
      severity: newIncident.severity,
      incidentType: newIncident.incidentType,
      affectedSystems: newIncident.affectedSystems.split(',').map(s => s.trim()).filter(Boolean),
    });
    setNewIncident({ title: '', description: '', severity: 'medium', incidentType: 'technical', affectedSystems: '' });
    setIsCreateOpen(false);
  };

  const handleResolve = async (incident: TechIncident) => {
    const startTime = new Date(incident.createdAt).getTime();
    const endTime = Date.now();
    const timeToResolve = Math.round((endTime - startTime) / 60000);
    
    await resolveIncident({ 
      id: incident.id, 
      resolution: 'Resolved by technician',
      timeToResolve,
    });
  };

  const handleAddRCA = async () => {
    if (!selectedIncident) return;
    await addRootCause({
      id: selectedIncident.id,
      rootCause: rcaForm.rootCause,
      impactAssessment: rcaForm.impactAssessment,
      preventiveActions: rcaForm.preventiveActions,
    });
    setRcaForm({ rootCause: '', impactAssessment: '', preventiveActions: '' });
    setIsRCAOpen(false);
    setSelectedIncident(null);
  };

  const handleMarkReviewed = async () => {
    if (!selectedIncident) return;
    await markReviewed({
      id: selectedIncident.id,
      reviewerId: 'current-user', // Would come from auth context
      postEventNotes: reviewForm.postEventNotes,
      lessonsLearned: reviewForm.lessonsLearned,
    });
    setReviewForm({ postEventNotes: '', lessonsLearned: '' });
    setIsReviewOpen(false);
    setSelectedIncident(null);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Technical Incident Log</h2>
          <p className="text-sm text-muted-foreground">Track, analyze, and review technical incidents</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New Incident</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Report New Incident</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={newIncident.title}
                  onChange={e => setNewIncident(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief incident description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select value={newIncident.severity} onValueChange={v => setNewIncident(prev => ({ ...prev, severity: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={newIncident.incidentType} onValueChange={v => setNewIncident(prev => ({ ...prev, incidentType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {INCIDENT_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Affected Systems</Label>
                <Input
                  value={newIncident.affectedSystems}
                  onChange={e => setNewIncident(prev => ({ ...prev, affectedSystems: e.target.value }))}
                  placeholder="Comma-separated: Main Stage AV, Live Stream"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newIncident.description}
                  onChange={e => setNewIncident(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of the incident..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateIncident} disabled={!newIncident.title}>Report Incident</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{stats.open}</p>
            <p className="text-xs text-muted-foreground">Open</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-500/10 border-orange-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{stats.critical}</p>
            <p className="text-xs text-muted-foreground">Critical</p>
          </CardContent>
        </Card>
        <Card className="bg-warning/10 border-warning/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-warning">{stats.needsRCA}</p>
            <p className="text-xs text-muted-foreground">Needs RCA</p>
          </CardContent>
        </Card>
        <Card className="bg-info/10 border-info/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-info">{stats.pendingReview}</p>
            <p className="text-xs text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/10 border-purple-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{stats.avgResolutionTime}m</p>
            <p className="text-xs text-muted-foreground">Avg Resolution</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Tabs value={filter} onValueChange={setFilter} className="flex-1">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="critical">Critical</TabsTrigger>
            <TabsTrigger value="needs_rca">Needs RCA</TabsTrigger>
            <TabsTrigger value="pending_review">Pending Review</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search incidents..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Incidents List */}
      <div className="space-y-3">
        {filteredIncidents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No incidents found</p>
            </CardContent>
          </Card>
        ) : (
          filteredIncidents.map(incident => (
            <Card key={incident.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{SEVERITY_CONFIG[incident.severity].icon}</span>
                      <Badge variant="outline" className={SEVERITY_CONFIG[incident.severity].color}>
                        {incident.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">{incident.incidentType}</Badge>
                      <Badge className={STATUS_CONFIG[incident.status].color}>
                        {STATUS_CONFIG[incident.status].label}
                      </Badge>
                      {incident.isRecurring && (
                        <Badge variant="outline" className="bg-primary/20 text-primary">
                          <RefreshCw className="h-3 w-3 mr-1" /> Recurring
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-medium">{incident.title}</h3>
                    {incident.affectedSystems.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Affected: {incident.affectedSystems.join(', ')}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true })}
                      </span>
                      {incident.assignedToName && (
                        <span>Assigned: {incident.assignedToName}</span>
                      )}
                      {incident.timeToResolveMinutes && (
                        <span>Resolved in {incident.timeToResolveMinutes} min</span>
                      )}
                    </div>
                    {/* Status indicators */}
                    <div className="flex items-center gap-2 mt-2">
                      {incident.rootCause ? (
                        <Badge variant="outline" className="bg-success/10 text-success text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> RCA Complete
                        </Badge>
                      ) : (incident.status === 'resolved' || incident.status === 'closed') && (
                        <Badge variant="outline" className="bg-warning/10 text-warning text-xs">
                          <FileText className="h-3 w-3 mr-1" /> RCA Needed
                        </Badge>
                      )}
                      {incident.reviewedAt ? (
                        <Badge variant="outline" className="bg-success/10 text-success text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Reviewed
                        </Badge>
                      ) : incident.status === 'resolved' && (
                        <Badge variant="outline" className="bg-info/10 text-info text-xs">
                          Pending Review
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {(incident.status === 'open' || incident.status === 'investigating') && (
                      <Button size="sm" onClick={() => handleResolve(incident)}>
                        Resolve
                      </Button>
                    )}
                    {(incident.status === 'resolved' || incident.status === 'closed') && !incident.rootCause && (
                      <Button size="sm" variant="outline" onClick={() => { setSelectedIncident(incident); setIsRCAOpen(true); }}>
                        Add RCA
                      </Button>
                    )}
                    {incident.status === 'resolved' && !incident.reviewedAt && (
                      <Button size="sm" variant="outline" onClick={() => { setSelectedIncident(incident); setIsReviewOpen(true); }}>
                        Review
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* RCA Dialog */}
      <Dialog open={isRCAOpen} onOpenChange={setIsRCAOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Root Cause Analysis</DialogTitle>
          </DialogHeader>
          {selectedIncident && (
            <div className="space-y-4 pt-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium">{selectedIncident.title}</p>
                <p className="text-sm text-muted-foreground">{selectedIncident.description}</p>
              </div>
              <div className="space-y-2">
                <Label>Root Cause *</Label>
                <Textarea
                  value={rcaForm.rootCause}
                  onChange={e => setRcaForm(prev => ({ ...prev, rootCause: e.target.value }))}
                  placeholder="What caused this incident?"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Impact Assessment</Label>
                <Textarea
                  value={rcaForm.impactAssessment}
                  onChange={e => setRcaForm(prev => ({ ...prev, impactAssessment: e.target.value }))}
                  placeholder="What was the impact on the event?"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Preventive Actions</Label>
                <Textarea
                  value={rcaForm.preventiveActions}
                  onChange={e => setRcaForm(prev => ({ ...prev, preventiveActions: e.target.value }))}
                  placeholder="What can be done to prevent this in the future?"
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsRCAOpen(false)}>Cancel</Button>
                <Button onClick={handleAddRCA} disabled={!rcaForm.rootCause}>Save RCA</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Post-Event Review</DialogTitle>
          </DialogHeader>
          {selectedIncident && (
            <div className="space-y-4 pt-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium">{selectedIncident.title}</p>
                {selectedIncident.rootCause && (
                  <p className="text-sm text-muted-foreground mt-1">
                    <strong>Root Cause:</strong> {selectedIncident.rootCause}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Post-Event Notes</Label>
                <Textarea
                  value={reviewForm.postEventNotes}
                  onChange={e => setReviewForm(prev => ({ ...prev, postEventNotes: e.target.value }))}
                  placeholder="Any notes from reviewing this incident..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Lessons Learned</Label>
                <Textarea
                  value={reviewForm.lessonsLearned}
                  onChange={e => setReviewForm(prev => ({ ...prev, lessonsLearned: e.target.value }))}
                  placeholder="Key takeaways for future events..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsReviewOpen(false)}>Cancel</Button>
                <Button onClick={handleMarkReviewed}>Mark Reviewed & Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
