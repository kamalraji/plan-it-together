import { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock, MapPin, User, Plus, CheckCircle2, PlayCircle, Clock3, AlertTriangle, Loader2 } from 'lucide-react';
import {
  useEventBriefings,
  useCreateEventBriefing,
  useUpdateEventBriefing,
  useDeleteEventBriefing,
  EventBriefing,
} from '@/hooks/useOperationsDepartmentData';

interface EventBriefingTabProps {
  workspace: Workspace;
}

export function EventBriefingTab({ workspace }: EventBriefingTabProps) {
  const { data: briefings, isLoading } = useEventBriefings(workspace.id);
  const createBriefing = useCreateEventBriefing(workspace.id);
  const updateBriefing = useUpdateEventBriefing(workspace.id);
  const deleteBriefing = useDeleteEventBriefing(workspace.id);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    scheduled_time: '09:00',
    activity: '',
    location: '',
    lead_name: '',
  });

  const getStatusBadge = (status: EventBriefing['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30"><PlayCircle className="h-3 w-3 mr-1" />In Progress</Badge>;
      case 'delayed':
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30"><AlertTriangle className="h-3 w-3 mr-1" />Delayed</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground"><Clock3 className="h-3 w-3 mr-1" />Upcoming</Badge>;
    }
  };

  const handleAddItem = () => {
    if (!newItem.activity.trim()) return;
    createBriefing.mutate({
      scheduled_time: newItem.scheduled_time,
      activity: newItem.activity,
      location: newItem.location || null,
      lead_name: newItem.lead_name || null,
      status: 'upcoming',
    });
    setNewItem({ scheduled_time: '09:00', activity: '', location: '', lead_name: '' });
    setIsAddModalOpen(false);
  };

  const handleStatusChange = (id: string, status: EventBriefing['status']) => {
    updateBriefing.mutate({ id, status });
  };

  const completedCount = briefings?.filter(b => b.status === 'completed').length || 0;
  const totalCount = briefings?.length || 0;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

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
          <h2 className="text-2xl font-bold text-foreground">Event Briefing</h2>
          <p className="text-muted-foreground">Day-of schedule and activity timeline</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Activity
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">{progressPercent}%</div>
              <p className="text-sm text-muted-foreground">Schedule Progress</p>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-500">{completedCount}</div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500">{totalCount - completedCount}</div>
              <p className="text-sm text-muted-foreground">Remaining</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Schedule Timeline</CardTitle>
          <CardDescription>Today's event schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            {briefings && briefings.length > 0 ? (
              <div className="space-y-4">
                {briefings.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    {/* Time */}
                    <div className="flex-shrink-0 w-16 text-center">
                      <div className="text-lg font-semibold text-foreground">{item.scheduled_time.slice(0, 5)}</div>
                    </div>

                    {/* Timeline connector */}
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${item.status === 'completed' ? 'bg-emerald-500' : item.status === 'in_progress' ? 'bg-blue-500' : 'bg-muted-foreground'}`} />
                      {index < briefings.length - 1 && <div className="w-0.5 flex-1 bg-border mt-1" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-foreground truncate">{item.activity}</h4>
                        {getStatusBadge(item.status)}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {item.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {item.location}
                          </span>
                        )}
                        {item.lead_name && (
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {item.lead_name}
                          </span>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div className="flex gap-2 mt-3">
                        <Select
                          value={item.status}
                          onValueChange={(value) => handleStatusChange(item.id, value as EventBriefing['status'])}
                        >
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="upcoming">Upcoming</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="delayed">Delayed</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-destructive hover:text-destructive"
                          onClick={() => deleteBriefing.mutate(item.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No schedule items yet</p>
                <p className="text-sm">Add activities to build your event timeline</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Add Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Schedule Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={newItem.scheduled_time}
                onChange={(e) => setNewItem({ ...newItem, scheduled_time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Activity</Label>
              <Input
                placeholder="e.g., Opening Ceremony"
                value={newItem.activity}
                onChange={(e) => setNewItem({ ...newItem, activity: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                placeholder="e.g., Main Hall"
                value={newItem.location}
                onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Lead Person</Label>
              <Input
                placeholder="e.g., John Smith"
                value={newItem.lead_name}
                onChange={(e) => setNewItem({ ...newItem, lead_name: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddItem} disabled={createBriefing.isPending}>
              {createBriefing.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
