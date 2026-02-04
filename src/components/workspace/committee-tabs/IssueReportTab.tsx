import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertCircle,
  Plus,
  Search,
  Clock,
  User,
  MapPin,
  MoreHorizontal,
  Play,
  CheckCircle,
  XCircle,
  RotateCcw,
  AlertTriangle,
  Loader2,
  Wifi,
  Zap,
  Monitor,
  Settings,
  HelpCircle,
  ArrowUpRight,
} from 'lucide-react';
import { useIssues, Issue, IssuePriority, IssueCategory, IssueStatus, CreateIssueInput } from '@/hooks/useIssues';
import { formatDistanceToNow } from 'date-fns';

interface IssueReportTabProps {
  workspaceId: string;
  eventId?: string;
}

const priorityConfig: Record<IssuePriority, { label: string; color: string; icon: React.ReactNode }> = {
  critical: { label: 'Critical', color: 'bg-red-500 text-white', icon: <AlertCircle className="h-3 w-3" /> },
  high: { label: 'High', color: 'bg-orange-500 text-white', icon: <AlertTriangle className="h-3 w-3" /> },
  medium: { label: 'Medium', color: 'bg-yellow-500 text-white', icon: <Clock className="h-3 w-3" /> },
  low: { label: 'Low', color: 'bg-blue-500 text-white', icon: <HelpCircle className="h-3 w-3" /> },
};

const categoryConfig: Record<IssueCategory, { label: string; icon: React.ReactNode }> = {
  equipment: { label: 'Equipment', icon: <Settings className="h-4 w-4" /> },
  network: { label: 'Network', icon: <Wifi className="h-4 w-4" /> },
  power: { label: 'Power', icon: <Zap className="h-4 w-4" /> },
  av: { label: 'AV', icon: <Monitor className="h-4 w-4" /> },
  software: { label: 'Software', icon: <Settings className="h-4 w-4" /> },
  general: { label: 'General', icon: <HelpCircle className="h-4 w-4" /> },
};

const statusConfig: Record<IssueStatus, { label: string; color: string }> = {
  open: { label: 'Open', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  closed: { label: 'Closed', color: 'bg-muted text-muted-foreground' },
};

export function IssueReportTab({ workspaceId, eventId }: IssueReportTabProps) {
  const {
    issues,
    stats,
    isLoading,
    createIssue,
    startWorking,
    resolveIssue,
    closeIssue,
    reopenIssue,
    escalateToIncident,
    deleteIssue,
    isSaving,
  } = useIssues(workspaceId, eventId);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<IssueCategory | 'all'>('all');

  // Form state
  const [formData, setFormData] = useState<CreateIssueInput>({
    title: '',
    description: '',
    location: '',
    priority: 'medium',
    category: 'general',
  });

  const handleCreateIssue = async () => {
    if (!formData.title.trim()) return;
    
    await createIssue.mutateAsync(formData);
    setFormData({
      title: '',
      description: '',
      location: '',
      priority: 'medium',
      category: 'general',
    });
    setIsCreateOpen(false);
  };

  const handleResolve = async () => {
    if (!selectedIssue) return;
    await resolveIssue(selectedIssue.id, resolutionNotes);
    setResolutionNotes('');
    setSelectedIssue(null);
    setIsResolveOpen(false);
  };

  const handleEscalate = async (issue: Issue) => {
    await escalateToIncident(issue);
  };

  // Filter issues
  const filteredIssues = issues.filter(issue => {
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || issue.category === categoryFilter;
    const matchesSearch = !searchQuery || 
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesCategory && matchesSearch;
  });

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
          <h2 className="text-2xl font-bold tracking-tight">Issue Report</h2>
          <p className="text-muted-foreground">Track and resolve technical issues in real-time</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Report Issue
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Report New Issue</DialogTitle>
              <DialogDescription>
                Log a technical issue that needs attention from the team.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Issue Title *</Label>
                <Input
                  id="title"
                  placeholder="Brief description of the issue"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed description of what's happening..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Where is this issue occurring?"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: IssuePriority) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            {config.icon}
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: IssueCategory) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            {config.icon}
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateIssue} disabled={!formData.title.trim() || isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Report Issue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
            <p className="text-xs text-muted-foreground">Open</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <p className="text-xs text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-muted-foreground">{stats.closed}</div>
            <p className="text-xs text-muted-foreground">Closed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <p className="text-xs text-muted-foreground">Critical</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as IssueCategory | 'all')}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      {config.icon}
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as IssueStatus | 'all')}>
        <TabsList>
          <TabsTrigger value="all">All ({issues.length})</TabsTrigger>
          <TabsTrigger value="open">Open ({stats.open})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({stats.inProgress})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({stats.resolved})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({stats.closed})</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-4">
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {filteredIssues.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No issues found</p>
                    <p className="text-sm">Try adjusting your filters or report a new issue</p>
                  </CardContent>
                </Card>
              ) : (
                filteredIssues.map((issue) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    onStartWorking={() => startWorking(issue.id)}
                    onResolve={() => {
                      setSelectedIssue(issue);
                      setIsResolveOpen(true);
                    }}
                    onClose={() => closeIssue(issue.id)}
                    onReopen={() => reopenIssue(issue.id)}
                    onEscalate={() => handleEscalate(issue)}
                    onDelete={() => deleteIssue.mutate(issue.id)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Resolve Dialog */}
      <Dialog open={isResolveOpen} onOpenChange={setIsResolveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Issue</DialogTitle>
            <DialogDescription>
              Add resolution notes before marking this issue as resolved.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="resolution">Resolution Notes</Label>
            <Textarea
              id="resolution"
              placeholder="What was done to resolve this issue?"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={4}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResolveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolve} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Mark as Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface IssueCardProps {
  issue: Issue;
  onStartWorking: () => void;
  onResolve: () => void;
  onClose: () => void;
  onReopen: () => void;
  onEscalate: () => void;
  onDelete: () => void;
}

function IssueCard({
  issue,
  onStartWorking,
  onResolve,
  onClose,
  onReopen,
  onEscalate,
  onDelete,
}: IssueCardProps) {
  const priority = priorityConfig[issue.priority];
  const category = categoryConfig[issue.category];
  const status = statusConfig[issue.status];

  return (
    <Card className={issue.priority === 'critical' && issue.status === 'open' ? 'border-red-500 border-2' : ''}>
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Priority & Category badges */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge className={priority.color}>
                {priority.icon}
                <span className="ml-1">{priority.label}</span>
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                {category.icon}
                {category.label}
              </Badge>
              <Badge className={status.color}>{status.label}</Badge>
              {issue.escalated_to_incident && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  Escalated
                </Badge>
              )}
            </div>

            {/* Title */}
            <h4 className="font-semibold text-foreground truncate">{issue.title}</h4>

            {/* Description */}
            {issue.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {issue.description}
              </p>
            )}

            {/* Meta info */}
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
              {issue.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {issue.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {issue.reporter_name || 'Unknown'}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
              </span>
              {issue.assignee_name && (
                <span className="flex items-center gap-1 text-primary">
                  <User className="h-3 w-3" />
                  Assigned: {issue.assignee_name}
                </span>
              )}
            </div>

            {/* Resolution notes */}
            {issue.status === 'resolved' && issue.resolution_notes && (
              <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                <span className="font-medium text-green-700 dark:text-green-400">Resolution: </span>
                <span className="text-green-600 dark:text-green-300">{issue.resolution_notes}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {issue.status === 'open' && (
              <Button size="sm" variant="outline" onClick={onStartWorking}>
                <Play className="h-3 w-3 mr-1" />
                Start
              </Button>
            )}
            {issue.status === 'in_progress' && (
              <Button size="sm" onClick={onResolve}>
                <CheckCircle className="h-3 w-3 mr-1" />
                Resolve
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {issue.status === 'open' && (
                  <DropdownMenuItem onClick={onStartWorking}>
                    <Play className="h-4 w-4 mr-2" />
                    Start Working
                  </DropdownMenuItem>
                )}
                {(issue.status === 'open' || issue.status === 'in_progress') && (
                  <DropdownMenuItem onClick={onResolve}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Resolve
                  </DropdownMenuItem>
                )}
                {issue.status === 'resolved' && (
                  <DropdownMenuItem onClick={onClose}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Close Issue
                  </DropdownMenuItem>
                )}
                {(issue.status === 'resolved' || issue.status === 'closed') && (
                  <DropdownMenuItem onClick={onReopen}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reopen
                  </DropdownMenuItem>
                )}
                {!issue.escalated_to_incident && issue.status !== 'closed' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onEscalate} className="text-orange-600">
                      <ArrowUpRight className="h-4 w-4 mr-2" />
                      Escalate to Incident
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <XCircle className="h-4 w-4 mr-2" />
                  Delete Issue
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
