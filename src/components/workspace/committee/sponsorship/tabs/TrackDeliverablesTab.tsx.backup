import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Workspace } from '@/types';
import { 
  useDeliverables, 
  useSponsors,
  useCreateDeliverable, 
  useUpdateDeliverable,
  useMarkDeliverableComplete,
  SponsorDeliverable,
} from '@/hooks/useSponsorshipCommitteeData';
import { 
  Plus, 
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  MoreVertical,
  Edit,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SimpleDropdown, SimpleDropdownTrigger, SimpleDropdownContent, SimpleDropdownItem } from '@/components/ui/simple-dropdown';
import { format, isPast, isToday, isTomorrow, differenceInDays } from 'date-fns';

interface TrackDeliverablesTabProps {
  workspace: Workspace;
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  pending: { icon: Clock, color: 'text-amber-500', bgColor: 'bg-amber-500/10', label: 'Pending' },
  in_progress: { icon: Clock, color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'In Progress' },
  completed: { icon: CheckCircle2, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', label: 'Completed' },
  overdue: { icon: AlertTriangle, color: 'text-red-500', bgColor: 'bg-red-500/10', label: 'Overdue' },
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

const categoryLabels: Record<string, string> = {
  branding: 'Branding',
  marketing: 'Marketing',
  activation: 'Activation',
  digital: 'Digital',
  physical: 'Physical',
  general: 'General',
};

export function TrackDeliverablesTab({ workspace }: TrackDeliverablesTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sponsorFilter, setSponsorFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingDeliverable, setEditingDeliverable] = useState<SponsorDeliverable | null>(null);

  const { data: deliverables = [], isLoading } = useDeliverables(workspace.id);
  const { data: sponsors = [] } = useSponsors(workspace.id);
  const createDeliverable = useCreateDeliverable();
  const updateDeliverable = useUpdateDeliverable();
  const markComplete = useMarkDeliverableComplete();

  const [formData, setFormData] = useState({
    sponsor_id: '',
    title: '',
    description: '',
    category: 'general',
    due_date: '',
    priority: 'medium',
    notes: '',
  });

  // Enrich deliverables with overdue status
  const enrichedDeliverables = deliverables.map(d => ({
    ...d,
    isOverdue: d.status !== 'completed' && isPast(new Date(d.due_date)) && !isToday(new Date(d.due_date)),
    displayStatus: d.status !== 'completed' && isPast(new Date(d.due_date)) && !isToday(new Date(d.due_date)) ? 'overdue' : d.status,
  }));

  const filteredDeliverables = enrichedDeliverables.filter((d) => {
    const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.sponsor as any)?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.displayStatus === statusFilter;
    const matchesSponsor = sponsorFilter === 'all' || d.sponsor_id === sponsorFilter;
    return matchesSearch && matchesStatus && matchesSponsor;
  });

  const handleCreateDeliverable = () => {
    createDeliverable.mutate({
      workspace_id: workspace.id,
      sponsor_id: formData.sponsor_id,
      title: formData.title,
      description: formData.description || null,
      category: formData.category,
      due_date: formData.due_date,
      priority: formData.priority,
      notes: formData.notes || null,
      status: 'pending',
    }, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        resetForm();
      }
    });
  };

  const handleUpdateDeliverable = () => {
    if (!editingDeliverable) return;
    updateDeliverable.mutate({
      id: editingDeliverable.id,
      workspaceId: workspace.id,
      title: formData.title,
      description: formData.description || null,
      category: formData.category,
      due_date: formData.due_date,
      priority: formData.priority,
      notes: formData.notes || null,
    }, {
      onSuccess: () => {
        setEditingDeliverable(null);
        resetForm();
      }
    });
  };

  const handleMarkComplete = (id: string) => {
    markComplete.mutate({ id, workspaceId: workspace.id });
  };

  const openEditDialog = (deliverable: SponsorDeliverable) => {
    setFormData({
      sponsor_id: deliverable.sponsor_id,
      title: deliverable.title,
      description: deliverable.description || '',
      category: deliverable.category,
      due_date: deliverable.due_date,
      priority: deliverable.priority,
      notes: deliverable.notes || '',
    });
    setEditingDeliverable(deliverable);
  };

  const resetForm = () => {
    setFormData({
      sponsor_id: '',
      title: '',
      description: '',
      category: 'general',
      due_date: '',
      priority: 'medium',
      notes: '',
    });
  };

  // Stats
  const totalDeliverables = deliverables.length;
  const completedCount = deliverables.filter(d => d.status === 'completed').length;
  const overdueCount = enrichedDeliverables.filter(d => d.isOverdue).length;
  const completionRate = totalDeliverables > 0 ? Math.round((completedCount / totalDeliverables) * 100) : 0;

  const getDueDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    const diff = differenceInDays(date, new Date());
    if (diff < 0) return `${Math.abs(diff)} days overdue`;
    if (diff <= 7) return `In ${diff} days`;
    return format(date, 'MMM d, yyyy');
  };

  const DeliverableForm = () => (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label htmlFor="sponsor_id">Sponsor *</Label>
        <Select value={formData.sponsor_id} onValueChange={(v) => setFormData(prev => ({ ...prev, sponsor_id: v }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select sponsor" />
          </SelectTrigger>
          <SelectContent>
            {sponsors.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Deliverable Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Logo placement on event banner"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="branding">Branding</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="activation">Activation</SelectItem>
              <SelectItem value="digital">Digital</SelectItem>
              <SelectItem value="physical">Physical</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(v) => setFormData(prev => ({ ...prev, priority: v }))}>
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="due_date">Due Date *</Label>
        <Input
          id="due_date"
          type="date"
          value={formData.due_date}
          onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Details about this deliverable..."
          rows={3}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Deliverables Progress</h3>
              <p className="text-sm text-muted-foreground">
                {completedCount} of {totalDeliverables} completed
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">{completionRate}%</p>
              {overdueCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {overdueCount} overdue
                </Badge>
              )}
            </div>
          </div>
          <Progress value={completionRate} className="h-2" />
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = enrichedDeliverables.filter(d => d.displayStatus === status).length;
          const Icon = config.icon;
          return (
            <Card key={status} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn('p-2.5 rounded-lg', config.bgColor)}>
                    <Icon className={cn('h-5 w-5', config.color)} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{count}</p>
                    <p className="text-xs text-muted-foreground">{config.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle className="text-lg">All Deliverables</CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={resetForm} disabled={sponsors.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Add Deliverable
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Deliverable</DialogTitle>
              </DialogHeader>
              <DeliverableForm />
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button 
                  onClick={handleCreateDeliverable} 
                  disabled={!formData.title || !formData.sponsor_id || !formData.due_date || createDeliverable.isPending}
                >
                  {createDeliverable.isPending ? 'Adding...' : 'Add Deliverable'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search deliverables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sponsorFilter} onValueChange={setSponsorFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sponsor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sponsors</SelectItem>
                {sponsors.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Deliverables List */}
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filteredDeliverables.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Calendar className="h-8 w-8 mb-2 opacity-50" />
                <p>No deliverables found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredDeliverables.map((deliverable) => {
                  const config = statusConfig[deliverable.displayStatus] || statusConfig.pending;
                  const StatusIcon = config.icon;

                  return (
                    <div
                      key={deliverable.id}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-lg border transition-colors",
                        deliverable.isOverdue 
                          ? "border-red-500/30 bg-red-500/5" 
                          : "border-border/50 hover:bg-muted/30"
                      )}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={cn('p-2 rounded-lg', config.bgColor)}>
                          <StatusIcon className={cn('h-4 w-4', config.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-foreground truncate">{deliverable.title}</h4>
                            <Badge variant="outline" className={cn('text-xs capitalize', priorityColors[deliverable.priority])}>
                              {deliverable.priority}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{(deliverable.sponsor as any)?.name || 'Unknown sponsor'}</span>
                            <span>•</span>
                            <span>{categoryLabels[deliverable.category]}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={cn(
                            "text-sm font-medium",
                            deliverable.isOverdue ? "text-red-600" : "text-muted-foreground"
                          )}>
                            {getDueDateLabel(deliverable.due_date)}
                          </p>
                          <Badge variant="secondary" className={cn('text-xs', config.bgColor, config.color)}>
                            {config.label}
                          </Badge>
                        </div>
                        <SimpleDropdown>
                          <SimpleDropdownTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground">
                            <MoreVertical className="h-4 w-4" />
                          </SimpleDropdownTrigger>
                          <SimpleDropdownContent align="end">
                            <SimpleDropdownItem onClick={() => openEditDialog(deliverable)}>
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </SimpleDropdownItem>
                            {deliverable.status !== 'completed' && (
                              <SimpleDropdownItem onClick={() => handleMarkComplete(deliverable.id)}>
                                <Check className="h-4 w-4 mr-2" /> Mark Complete
                              </SimpleDropdownItem>
                            )}
                          </SimpleDropdownContent>
                        </SimpleDropdown>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingDeliverable} onOpenChange={(open) => !open && setEditingDeliverable(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Deliverable</DialogTitle>
          </DialogHeader>
          <DeliverableForm />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleUpdateDeliverable} disabled={!formData.title || updateDeliverable.isPending}>
              {updateDeliverable.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
