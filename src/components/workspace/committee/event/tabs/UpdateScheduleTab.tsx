import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, MapPin, Plus, Pencil, Trash2, Users, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  useEventSchedule,
  useCreateScheduleItem,
  useUpdateScheduleItem,
  useDeleteScheduleItem,
  EventScheduleItem,
  EventScheduleInsert,
} from '@/hooks/useEventCommitteeData';

// Use 'activity' field from workspace_event_briefings table

interface UpdateScheduleTabProps {
  workspaceId: string;
}

// Session types (available for future use/enhancement)
// const SESSION_TYPES = [
//   { value: 'keynote', label: 'Keynote', color: 'bg-purple-100 text-purple-800' },
//   { value: 'session', label: 'Session', color: 'bg-blue-100 text-blue-800' },
//   { value: 'break', label: 'Break', color: 'bg-amber-100 text-amber-800' },
//   { value: 'networking', label: 'Networking', color: 'bg-emerald-100 text-emerald-800' },
// ];

const STATUSES = [
  { value: 'upcoming', label: 'Upcoming', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { value: 'in-progress', label: 'In Progress', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  { value: 'completed', label: 'Completed', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
];

export const UpdateScheduleTab: React.FC<UpdateScheduleTabProps> = ({ workspaceId }) => {
  const { data: scheduleItems = [], isLoading } = useEventSchedule(workspaceId);
  const createMutation = useCreateScheduleItem();
  const updateMutation = useUpdateScheduleItem();
  const deleteMutation = useDeleteScheduleItem();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EventScheduleItem | null>(null);
  const [formData, setFormData] = useState({
    activity: '',
    scheduled_time: '',
    location: '',
    lead_name: '',
    status: 'upcoming',
    notes: '',
  });

  const handleOpenDialog = (item?: EventScheduleItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        activity: item.activity,
        scheduled_time: item.scheduled_time ? format(new Date(item.scheduled_time), "yyyy-MM-dd'T'HH:mm") : '',
        location: item.location || '',
        lead_name: item.lead_name || '',
        status: item.status,
        notes: item.notes || '',
      });
    } else {
      setEditingItem(null);
      setFormData({
        activity: '',
        scheduled_time: '',
        location: '',
        lead_name: '',
        status: 'upcoming',
        notes: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.activity || !formData.scheduled_time) return;

    const payload: EventScheduleInsert = {
      workspace_id: workspaceId,
      activity: formData.activity,
      scheduled_time: new Date(formData.scheduled_time).toISOString(),
      location: formData.location || null,
      lead_name: formData.lead_name || null,
      status: formData.status || 'upcoming',
      notes: formData.notes || null,
    };

    if (editingItem) {
      await updateMutation.mutateAsync({ id: editingItem.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this schedule item?')) {
      await deleteMutation.mutateAsync({ id, workspaceId });
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    await updateMutation.mutateAsync({ id, status });
  };

  const getStatusConfig = (status: string) =>
    STATUSES.find(s => s.value === status) || STATUSES[0];

  // Stats
  const completed = scheduleItems.filter(i => i.status === 'completed').length;
  const inProgress = scheduleItems.filter(i => i.status === 'in-progress').length;
  const upcoming = scheduleItems.filter(i => i.status === 'upcoming').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Event Schedule</h2>
          <p className="text-muted-foreground">Manage your event timeline and sessions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Schedule Item' : 'Add Schedule Item'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="activity">Activity Name *</Label>
                <Input
                  id="activity"
                  value={formData.activity}
                  onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
                  placeholder="Opening Keynote"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduled_time">Date & Time *</Label>
                  <Input
                    id="scheduled_time"
                    type="datetime-local"
                    value={formData.scheduled_time || ''}
                    onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Main Hall"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(status => (
                        <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead_name">Session Lead</Label>
                  <Input
                    id="lead_name"
                    value={formData.lead_name || ''}
                    onChange={(e) => setFormData({ ...formData, lead_name: e.target.value })}
                    placeholder="John Smith"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional details..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingItem ? 'Update' : 'Add'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{scheduleItems.length}</p>
                <p className="text-sm text-muted-foreground">Total Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcoming}</p>
                <p className="text-sm text-muted-foreground">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inProgress}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900">
                <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completed}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule List */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {scheduleItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No schedule items yet</p>
              <p className="text-sm">Add your first schedule item to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scheduleItems.map((item) => {
                const statusConfig = getStatusConfig(item.status);
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-shrink-0 text-center min-w-[80px]">
                      <p className="text-lg font-semibold">
                        {format(new Date(item.scheduled_time), 'HH:mm')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(item.scheduled_time), 'MMM d')}
                      </p>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{item.activity}</h4>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {item.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {item.location}
                          </span>
                        )}
                        {item.lead_name && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {item.lead_name}
                          </span>
                        )}
                      </div>
                    </div>

                    <Select value={item.status} onValueChange={(v) => handleStatusChange(item.id, v)}>
                      <SelectTrigger className="w-[130px]">
                        <Badge className={statusConfig.color} variant="secondary">
                          {statusConfig.label}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map(status => (
                          <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdateScheduleTab;
