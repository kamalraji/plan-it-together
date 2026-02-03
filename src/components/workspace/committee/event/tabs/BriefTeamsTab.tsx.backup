import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BellRing, Calendar, Clock, MapPin, Plus, Pencil, Trash2, Loader2, CheckCircle2, Link } from 'lucide-react';
import { format, isToday } from 'date-fns';
import {
  useTeamBriefings,
  useCreateTeamBriefing,
  useUpdateTeamBriefing,
  useDeleteTeamBriefing,
  TeamBriefing,
  TeamBriefingInsert,
} from '@/hooks/useEventCommitteeData';

interface BriefTeamsTabProps {
  workspaceId: string;
}

const BRIEFING_TYPES = [
  { value: 'general', label: 'General', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
  { value: 'pre-event', label: 'Pre-Event', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { value: 'daily', label: 'Daily', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  { value: 'emergency', label: 'Emergency', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  { value: 'debrief', label: 'Debrief', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
];

const STATUSES = [
  { value: 'scheduled', label: 'Scheduled', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { value: 'in-progress', label: 'In Progress', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  { value: 'completed', label: 'Completed', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
];

export const BriefTeamsTab: React.FC<BriefTeamsTabProps> = ({ workspaceId }) => {
  const { data: briefings = [], isLoading } = useTeamBriefings(workspaceId);
  const createMutation = useCreateTeamBriefing();
  const updateMutation = useUpdateTeamBriefing();
  const deleteMutation = useDeleteTeamBriefing();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBriefing, setEditingBriefing] = useState<TeamBriefing | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    briefing_type: 'general',
    scheduled_at: '',
    duration_minutes: 30,
    location: '',
    agenda: '',
    materials_url: '',
  });

  const handleOpenDialog = (briefing?: TeamBriefing) => {
    if (briefing) {
      setEditingBriefing(briefing);
      setFormData({
        title: briefing.title,
        briefing_type: briefing.briefing_type,
        scheduled_at: format(new Date(briefing.scheduled_at), "yyyy-MM-dd'T'HH:mm"),
        duration_minutes: briefing.duration_minutes,
        location: briefing.location || '',
        agenda: briefing.agenda || '',
        materials_url: briefing.materials_url || '',
      });
    } else {
      setEditingBriefing(null);
      setFormData({
        title: '',
        briefing_type: 'general',
        scheduled_at: '',
        duration_minutes: 30,
        location: '',
        agenda: '',
        materials_url: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.scheduled_at) return;

    const payload: TeamBriefingInsert = {
      workspace_id: workspaceId,
      title: formData.title,
      briefing_type: formData.briefing_type,
      scheduled_at: new Date(formData.scheduled_at).toISOString(),
      duration_minutes: formData.duration_minutes,
      location: formData.location || null,
      agenda: formData.agenda || null,
      materials_url: formData.materials_url || null,
      status: 'scheduled',
      attendees: [],
      notes: null,
      created_by: null,
    };

    if (editingBriefing) {
      await updateMutation.mutateAsync({ id: editingBriefing.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this briefing?')) {
      await deleteMutation.mutateAsync({ id, workspaceId });
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    await updateMutation.mutateAsync({ id, status });
  };

  const getTypeConfig = (type: string) =>
    BRIEFING_TYPES.find(t => t.value === type) || BRIEFING_TYPES[0];

  const getStatusConfig = (status: string) =>
    STATUSES.find(s => s.value === status) || STATUSES[0];

  // Stats
  const scheduled = briefings.filter(b => b.status === 'scheduled').length;
  const completed = briefings.filter(b => b.status === 'completed').length;
  const upcomingToday = briefings.filter(b => 
    b.status === 'scheduled' && isToday(new Date(b.scheduled_at))
  ).length;

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
          <h2 className="text-2xl font-bold">Team Briefings</h2>
          <p className="text-muted-foreground">Schedule and manage team briefings</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Schedule Briefing
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingBriefing ? 'Edit Briefing' : 'Schedule Briefing'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Morning Team Standup"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="briefing_type">Briefing Type</Label>
                  <Select value={formData.briefing_type} onValueChange={(v) => setFormData({ ...formData, briefing_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BRIEFING_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (mins)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min={5}
                    max={180}
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 30 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduled_at">Date & Time *</Label>
                  <Input
                    id="scheduled_at"
                    type="datetime-local"
                    value={formData.scheduled_at}
                    onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Meeting Room A"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agenda">Agenda</Label>
                <Textarea
                  id="agenda"
                  value={formData.agenda}
                  onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
                  placeholder="1. Status updates&#10;2. Key issues&#10;3. Action items"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="materials_url">Materials Link</Label>
                <Input
                  id="materials_url"
                  type="url"
                  value={formData.materials_url}
                  onChange={(e) => setFormData({ ...formData, materials_url: e.target.value })}
                  placeholder="https://docs.google.com/..."
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
                  {editingBriefing ? 'Update' : 'Schedule'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{scheduled}</p>
                <p className="text-sm text-muted-foreground">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900">
                <BellRing className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingToday}</p>
                <p className="text-sm text-muted-foreground">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completed}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Briefings List */}
      <Card>
        <CardHeader>
          <CardTitle>All Briefings</CardTitle>
        </CardHeader>
        <CardContent>
          {briefings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BellRing className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No briefings scheduled</p>
              <p className="text-sm">Schedule your first team briefing</p>
            </div>
          ) : (
            <div className="space-y-3">
              {briefings.map((briefing) => {
                const typeConfig = getTypeConfig(briefing.briefing_type);
                const statusConfig = getStatusConfig(briefing.status);

                return (
                  <div
                    key={briefing.id}
                    className={`p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors ${
                      briefing.status === 'cancelled' ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{briefing.title}</h4>
                          <Badge className={typeConfig.color} variant="secondary">
                            {typeConfig.label}
                          </Badge>
                          <Badge className={statusConfig.color} variant="secondary">
                            {statusConfig.label}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(briefing.scheduled_at), 'MMM d, yyyy')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(briefing.scheduled_at), 'HH:mm')} ({briefing.duration_minutes} min)
                          </span>
                          {briefing.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {briefing.location}
                            </span>
                          )}
                          {briefing.materials_url && (
                            <a
                              href={briefing.materials_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-primary hover:underline"
                            >
                              <Link className="h-3 w-3" />
                              Materials
                            </a>
                          )}
                        </div>

                        {briefing.agenda && (
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                            {briefing.agenda}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {briefing.status === 'scheduled' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(briefing.id, 'completed')}
                          >
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Complete
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(briefing)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(briefing.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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

export default BriefTeamsTab;
