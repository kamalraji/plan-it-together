import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  useLogisticsIssues, 
  useCreateIssue, 
  useUpdateIssue 
} from '@/hooks/useLogisticsCommitteeData';
import { 
  AlertTriangle, 
  Plus, 
  Clock,
  CheckCircle,
  Search,
  MapPin,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface ReportIssueTabProps {
  workspaceId: string;
}

type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';
type IssueStatus = 'open' | 'investigating' | 'resolved' | 'closed';

const severityConfig: Record<IssueSeverity, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof AlertTriangle }> = {
  low: { label: 'Low', variant: 'outline', icon: AlertCircle },
  medium: { label: 'Medium', variant: 'secondary', icon: AlertTriangle },
  high: { label: 'High', variant: 'default', icon: AlertTriangle },
  critical: { label: 'Critical', variant: 'destructive', icon: XCircle },
};

const statusConfig: Record<IssueStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  open: { label: 'Open', variant: 'destructive' },
  investigating: { label: 'Investigating', variant: 'default' },
  resolved: { label: 'Resolved', variant: 'outline' },
  closed: { label: 'Closed', variant: 'secondary' },
};

const categories = [
  { value: 'equipment', label: 'Equipment Issue' },
  { value: 'transport', label: 'Transport Issue' },
  { value: 'venue', label: 'Venue Issue' },
  { value: 'shipment', label: 'Shipment Issue' },
  { value: 'safety', label: 'Safety Concern' },
  { value: 'logistics', label: 'General Logistics' },
  { value: 'other', label: 'Other' },
];

export function ReportIssueTab({ workspaceId }: ReportIssueTabProps) {
  const [view, setView] = useState<'list' | 'report'>('list');
  const [filter, setFilter] = useState<'all' | IssueStatus>('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'medium' as IssueSeverity,
    location: '',
    category: 'logistics',
  });

  const { data: issues, isLoading } = useLogisticsIssues(workspaceId);
  const createIssue = useCreateIssue(workspaceId);
  const updateIssue = useUpdateIssue(workspaceId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createIssue.mutate(formData, {
      onSuccess: () => {
        setFormData({ title: '', description: '', severity: 'medium', location: '', category: 'logistics' });
        setView('list');
      },
    });
  };

  const filteredIssues = issues?.filter(issue => 
    filter === 'all' || issue.status === filter
  ) || [];

  const stats = {
    open: issues?.filter(i => i.status === 'open').length || 0,
    investigating: issues?.filter(i => i.status === 'investigating').length || 0,
    resolved: issues?.filter(i => i.status === 'resolved').length || 0,
    total: issues?.length || 0,
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading issues...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{stats.open}</p>
                <p className="text-sm text-muted-foreground">Open</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Search className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.investigating}</p>
                <p className="text-sm text-muted-foreground">Investigating</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.resolved}</p>
                <p className="text-sm text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant={view === 'list' ? 'default' : 'outline'}
          onClick={() => setView('list')}
        >
          Active Issues
        </Button>
        <Button
          variant={view === 'report' ? 'default' : 'outline'}
          onClick={() => setView('report')}
        >
          <Plus className="h-4 w-4 mr-1" />
          Report Issue
        </Button>
      </div>

      {view === 'report' ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Report New Issue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Issue Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Brief description of the issue"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="severity">Severity</Label>
                  <Select
                    value={formData.severity}
                    onValueChange={(value: IssueSeverity) => setFormData({ ...formData, severity: value })}
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
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Where is the issue located?"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Provide details about the issue..."
                    rows={4}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createIssue.isPending}>
                  {createIssue.isPending ? 'Reporting...' : 'Report Issue'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setView('list')}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Issue Tracker
            </CardTitle>
            <Select
              value={filter}
              onValueChange={(value) => setFilter(value as typeof filter)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Issues</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {!filteredIssues.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No issues found</p>
                <p className="text-sm">
                  {filter === 'all' ? 'Report an issue to get started' : 'No issues with this status'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredIssues.map((issue) => {
                  const severity = (issue.severity as IssueSeverity) || 'medium';
                  const status = (issue.status as IssueStatus) || 'open';
                  const severityInfo = severityConfig[severity];
                  const statusInfo = statusConfig[status];
                  const SeverityIcon = severityInfo.icon;

                  return (
                    <div
                      key={issue.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <SeverityIcon className={`h-5 w-5 mt-0.5 ${
                            severity === 'critical' ? 'text-destructive' :
                            severity === 'high' ? 'text-orange-500' :
                            severity === 'medium' ? 'text-amber-500' :
                            'text-muted-foreground'
                          }`} />
                          <div>
                            <p className="font-medium">{issue.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                            <Badge variant={severityInfo.variant}>{severityInfo.label}</Badge>
                              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                            </div>
                            {issue.description && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                {issue.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              {issue.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {issue.location}
                                </span>
                              )}
                              <span>
                                Reported {format(new Date(issue.created_at), 'MMM d, h:mm a')}
                              </span>
                              {issue.reported_by_name && (
                                <span>by {issue.reported_by_name}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Select
                          value={status}
                          onValueChange={(value) => updateIssue.mutate({ id: issue.id, status: value })}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="investigating">Investigating</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
