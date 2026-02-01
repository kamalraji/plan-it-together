import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  useLogisticsMilestones, 
  useCreateMilestone, 
  useUpdateMilestone,
  useDeleteMilestone
} from '@/hooks/useLogisticsCommitteeData';
import { 
  Calendar, 
  Plus, 
  Clock,
  CheckCircle,
  Circle,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { format, isPast, isToday, parseISO } from 'date-fns';

interface ViewTimelineTabProps {
  workspaceId: string;
}

type MilestoneStatus = 'pending' | 'in_progress' | 'completed';

const statusConfig: Record<MilestoneStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Circle }> = {
  pending: { label: 'Pending', variant: 'secondary', icon: Circle },
  in_progress: { label: 'In Progress', variant: 'default', icon: Clock },
  completed: { label: 'Completed', variant: 'outline', icon: CheckCircle },
};

export function ViewTimelineTab({ workspaceId }: ViewTimelineTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [filter, setFilter] = useState<'all' | MilestoneStatus>('all');
  const [formData, setFormData] = useState({
    title: '',
    due_date: '',
    description: '',
  });

  const { data: milestones, isLoading } = useLogisticsMilestones(workspaceId);
  const createMilestone = useCreateMilestone(workspaceId);
  const updateMilestone = useUpdateMilestone(workspaceId);
  const deleteMilestone = useDeleteMilestone(workspaceId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMilestone.mutate(formData, {
      onSuccess: () => {
        setFormData({ title: '', due_date: '', description: '' });
        setIsAdding(false);
      },
    });
  };

  const filteredMilestones = milestones?.filter(m => 
    filter === 'all' || m.status === filter
  ) || [];

  const stats = {
    pending: milestones?.filter(m => m.status === 'pending').length || 0,
    inProgress: milestones?.filter(m => m.status === 'in_progress').length || 0,
    completed: milestones?.filter(m => m.status === 'completed').length || 0,
    overdue: milestones?.filter(m => 
      m.status !== 'completed' && m.due_date && isPast(parseISO(m.due_date)) && !isToday(parseISO(m.due_date))
    ).length || 0,
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading timeline...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Circle className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{stats.overdue}</p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Milestone Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Logistics Timeline
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select
              value={filter}
              onValueChange={(value) => setFilter(value as typeof filter)}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setIsAdding(!isAdding)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Milestone
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isAdding && (
            <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 border rounded-lg bg-muted/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Milestone Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Equipment Delivery Deadline"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="datetime-local"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Additional details about this milestone..."
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createMilestone.isPending}>
                  {createMilestone.isPending ? 'Adding...' : 'Add Milestone'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Timeline View */}
          {!filteredMilestones.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No milestones found</p>
              <p className="text-sm">Add your first milestone to start tracking</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

              <div className="space-y-4">
                {filteredMilestones.map((milestone) => {
                  const status = (milestone.status as MilestoneStatus) || 'pending';
                  const config = statusConfig[status];
                  const dueDate = milestone.due_date ? parseISO(milestone.due_date) : null;
                  const isOverdue = dueDate && status !== 'completed' && isPast(dueDate) && !isToday(dueDate);
                  const isDueToday = dueDate && isToday(dueDate);

                  return (
                    <div key={milestone.id} className="relative pl-10">
                      {/* Timeline dot */}
                      <div className={`absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        status === 'completed' ? 'bg-green-500 border-green-500' :
                        status === 'in_progress' ? 'bg-blue-500 border-blue-500' :
                        isOverdue ? 'bg-destructive border-destructive' :
                        'bg-background border-border'
                      }`}>
                        {status === 'completed' && <CheckCircle className="h-3 w-3 text-white" />}
                      </div>

                      <div className={`p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                        isOverdue ? 'border-destructive/50' : ''
                      }`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{milestone.title}</p>
                              <Badge variant={config.variant}>{config.label}</Badge>
                              {isOverdue && (
                                <Badge variant="destructive">Overdue</Badge>
                              )}
                              {isDueToday && status !== 'completed' && (
                                <Badge variant="default">Due Today</Badge>
                              )}
                            </div>
                            {milestone.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {milestone.description}
                              </p>
                            )}
                            {dueDate && (
                              <p className={`text-xs mt-2 ${
                                isOverdue ? 'text-destructive' : 'text-muted-foreground'
                              }`}>
                                <Clock className="h-3 w-3 inline mr-1" />
                                Due: {format(dueDate, 'MMM d, yyyy h:mm a')}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Select
                              value={status}
                              onValueChange={(value) => updateMilestone.mutate({ 
                                id: milestone.id, 
                                status: value 
                              })}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteMilestone.mutate(milestone.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
