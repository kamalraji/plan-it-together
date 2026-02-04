import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertTriangle, 
  Plus, 
  CheckCircle2, 
  Clock,
  AlertCircle,
  Loader2,
  MapPin,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  useFacilityIncidents,
  useCreateFacilityIncident,
  useUpdateFacilityIncident,
  useRooms,
} from '@/hooks/useFacilityCommitteeData';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ReportIssueTabProps {
  workspaceId: string;
}

const ISSUE_CATEGORIES = [
  'Electrical',
  'Plumbing', 
  'HVAC',
  'Structural',
  'Safety',
  'Cleaning',
  'Equipment',
  'Other',
];

export function ReportIssueTab({ workspaceId }: ReportIssueTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    location: '',
    category: '',
  });

  const { data: incidents, isLoading } = useFacilityIncidents(workspaceId);
  const { data: rooms } = useRooms(workspaceId);
  const createIncident = useCreateFacilityIncident(workspaceId);
  const updateIncident = useUpdateFacilityIncident(workspaceId);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'open':
        return { label: 'Open', variant: 'destructive' as const, icon: AlertCircle };
      case 'investigating':
        return { label: 'Investigating', variant: 'secondary' as const, icon: Clock };
      case 'resolved':
        return { label: 'Resolved', variant: 'default' as const, icon: CheckCircle2 };
      case 'closed':
        return { label: 'Closed', variant: 'outline' as const, icon: CheckCircle2 };
      default:
        return { label: status, variant: 'outline' as const, icon: Clock };
    }
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { label: 'Critical', className: 'bg-red-500 text-white' };
      case 'high':
        return { label: 'High', className: 'bg-orange-500 text-white' };
      case 'medium':
        return { label: 'Medium', className: 'bg-amber-500 text-white' };
      case 'low':
        return { label: 'Low', className: 'bg-blue-500 text-white' };
      default:
        return { label: severity, className: 'bg-muted' };
    }
  };

  const handleCreate = () => {
    if (!formData.title.trim()) return;
    createIncident.mutate({
      title: formData.title,
      description: formData.description || undefined,
      severity: formData.severity,
      location: formData.location || undefined,
      category: formData.category || undefined,
    }, {
      onSuccess: () => {
        setFormData({ title: '', description: '', severity: 'medium', location: '', category: '' });
        setIsAdding(false);
      },
    });
  };

  const filteredIncidents = incidents?.filter(incident => {
    if (filter === 'open') return incident.status === 'open' || incident.status === 'investigating';
    if (filter === 'resolved') return incident.status === 'resolved' || incident.status === 'closed';
    return true;
  });

  const openCount = incidents?.filter(i => i.status === 'open' || i.status === 'investigating').length || 0;
  const resolvedCount = incidents?.filter(i => i.status === 'resolved' || i.status === 'closed').length || 0;
  const criticalCount = incidents?.filter(i => i.severity === 'critical' && i.status !== 'closed').length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:border-destructive/50" onClick={() => setFilter('open')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Issues</p>
                <p className="text-2xl font-bold">{openCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:border-emerald-500/50" onClick={() => setFilter('resolved')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold">{resolvedCount}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        {criticalCount > 0 && (
          <Card className="border-red-500/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critical</p>
                  <p className="text-2xl font-bold text-red-500">{criticalCount}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Facility Issues
        </h2>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Issues</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsAdding(!isAdding)}>
            <Plus className="h-4 w-4 mr-2" />
            Report Issue
          </Button>
        </div>
      </div>

      {/* Add Form */}
      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Report New Issue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Issue Title *</Label>
              <Input 
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Brief description of the issue"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Location</Label>
                <Select value={formData.location} onValueChange={(v) => setFormData(prev => ({ ...prev, location: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms?.map((room) => (
                      <SelectItem key={room.id} value={room.name}>{room.name}</SelectItem>
                    ))}
                    <SelectItem value="Lobby">Lobby</SelectItem>
                    <SelectItem value="Hallway">Hallway</SelectItem>
                    <SelectItem value="Exterior">Exterior</SelectItem>
                    <SelectItem value="Restroom">Restroom</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Severity *</Label>
              <Select 
                value={formData.severity} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, severity: v as typeof formData.severity }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Minor issue</SelectItem>
                  <SelectItem value="medium">Medium - Needs attention</SelectItem>
                  <SelectItem value="high">High - Urgent</SelectItem>
                  <SelectItem value="critical">Critical - Safety hazard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea 
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Provide more details about the issue..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={createIncident.isPending || !formData.title.trim()}>
                {createIncident.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Report Issue
              </Button>
              <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Issues List */}
      <Card>
        <CardContent className="pt-6">
          {filteredIncidents?.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">No issues found</h3>
              <p className="text-sm text-muted-foreground">
                {filter === 'all' ? 'No facility issues have been reported.' : `No ${filter} issues.`}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {filteredIncidents?.map((incident) => {
                  const statusConfig = getStatusConfig(incident.status);
                  const severityConfig = getSeverityConfig(incident.severity);
                  const StatusIcon = statusConfig.icon;
                  return (
                    <div
                      key={incident.id}
                      className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{incident.title}</h4>
                            <Badge className={severityConfig.className}>{severityConfig.label}</Badge>
                          </div>
                          {incident.description && (
                            <p className="text-sm text-muted-foreground mb-2">{incident.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {incident.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {incident.location}
                              </span>
                            )}
                            <span>{format(new Date(incident.created_at), 'MMM d, h:mm a')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusConfig.variant}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                          {(incident.status === 'open' || incident.status === 'investigating') && (
                            <Select 
                              value={incident.status}
                              onValueChange={(v) => updateIncident.mutate({ id: incident.id, status: v as any })}
                            >
                              <SelectTrigger className="w-[130px] h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="investigating">Investigating</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
