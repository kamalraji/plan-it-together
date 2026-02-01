import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, Plus, Clock, CheckCircle, AlertTriangle, XCircle, Search } from 'lucide-react';

interface IssueReportTabProps {
  workspaceId: string;
}

interface Issue {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  reporter: string;
  assignee: string;
  location: string;
  createdAt: string;
  resolvedAt: string | null;
}

const mockIssues: Issue[] = [
  { id: '1', title: 'Projector overheating', description: 'Main hall projector showing temperature warning', priority: 'high', status: 'in-progress', reporter: 'Ahmad', assignee: 'Wei', location: 'Main Hall', createdAt: '2026-01-10 09:45', resolvedAt: null },
  { id: '2', title: 'Wireless mic interference', description: 'Channel 3 experiencing static', priority: 'medium', status: 'open', reporter: 'Sarah', assignee: '', location: 'Main Hall', createdAt: '2026-01-10 10:15', resolvedAt: null },
  { id: '3', title: 'HDMI cable faulty', description: 'Breakout room 101 display not connecting', priority: 'high', status: 'resolved', reporter: 'Wei', assignee: 'Ahmad', location: 'Room 101', createdAt: '2026-01-10 08:30', resolvedAt: '2026-01-10 09:00' },
  { id: '4', title: 'Internet slowdown', description: 'WiFi speed dropped to 50Mbps', priority: 'critical', status: 'open', reporter: 'Ahmad', assignee: '', location: 'Entire Venue', createdAt: '2026-01-10 10:30', resolvedAt: null },
];

export function IssueReportTab({ workspaceId: _workspaceId }: IssueReportTabProps) {
  const [issues] = useState<Issue[]>(mockIssues);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewIssueForm, setShowNewIssueForm] = useState(false);

  const filteredIssues = issues.filter(issue =>
    issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    issue.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    open: issues.filter(i => i.status === 'open').length,
    inProgress: issues.filter(i => i.status === 'in-progress').length,
    resolved: issues.filter(i => i.status === 'resolved').length,
    critical: issues.filter(i => i.priority === 'critical' && i.status !== 'resolved' && i.status !== 'closed').length,
  };

  const getPriorityBadge = (priority: Issue['priority']) => {
    switch (priority) {
      case 'critical':
        return <Badge className="bg-red-500 text-white">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">High</Badge>;
      case 'medium':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Medium</Badge>;
      case 'low':
        return <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/20">Low</Badge>;
    }
  };

  const getStatusBadge = (status: Issue['status']) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20"><AlertCircle className="h-3 w-3 mr-1" />Open</Badge>;
      case 'in-progress':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>;
      case 'resolved':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><CheckCircle className="h-3 w-3 mr-1" />Resolved</Badge>;
      case 'closed':
        return <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/20"><XCircle className="h-3 w-3 mr-1" />Closed</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Issue Report</h2>
          <p className="text-sm text-muted-foreground">Track and resolve technical issues</p>
        </div>
        <Button onClick={() => setShowNewIssueForm(!showNewIssueForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Report Issue
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-500">{stats.open}</div>
            <div className="text-xs text-muted-foreground">Open</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-amber-500">{stats.inProgress}</div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/10 border-emerald-500/20">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-emerald-500">{stats.resolved}</div>
            <div className="text-xs text-muted-foreground">Resolved</div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-500">{stats.critical}</div>
            <div className="text-xs text-muted-foreground">Critical</div>
          </CardContent>
        </Card>
      </div>

      {/* New Issue Form */}
      {showNewIssueForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Report New Issue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Issue Title</Label>
                <Input placeholder="Brief description of the issue" />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input placeholder="Where is this happening?" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Details</Label>
              <Textarea placeholder="Describe the issue in detail..." rows={3} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewIssueForm(false)}>Cancel</Button>
              <Button>Submit Issue</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search issues..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Issues List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Active Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredIssues.map((issue) => (
              <div
                key={issue.id}
                className={`p-4 rounded-lg border transition-colors ${
                  issue.priority === 'critical' && issue.status !== 'resolved'
                    ? 'bg-red-500/5 border-red-500/30'
                    : 'bg-card hover:bg-muted/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{issue.title}</span>
                      {getPriorityBadge(issue.priority)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
                    <div className="text-xs text-muted-foreground mt-2">
                      📍 {issue.location} • Reported by {issue.reporter} at {issue.createdAt}
                      {issue.assignee && ` • Assigned to ${issue.assignee}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(issue.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
