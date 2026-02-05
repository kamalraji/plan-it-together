import { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSpeakers, Speaker } from '@/hooks/useContentDepartmentData';
import { UserPlus, Mic, Loader2, Plus, Trash2, Edit2, CheckCircle, Clock, XCircle, Phone, Mail, MapPin, Calendar, Download } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface AddSpeakerTabProps {
  workspace: Workspace;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', icon: Clock, color: 'bg-warning/10 text-warning border-warning/30' },
  { value: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: 'bg-success/10 text-success border-success/30' },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'bg-destructive/10 text-destructive border-destructive/30' },
];

export function AddSpeakerTab({ workspace }: AddSpeakerTabProps) {
  const queryClient = useQueryClient();
  const { data: speakers, isLoading } = useSpeakers(workspace.id);
  
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [editingSpeaker, setEditingSpeaker] = useState<Speaker | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    bio: '',
    session_title: '',
    session_time: '',
    location: '',
    travel_arranged: false,
    accommodation_arranged: false,
    notes: '',
  });

  // Create/Update speaker mutation
  const saveSpeakerMutation = useMutation({
    mutationFn: async () => {
      const speakerData = {
        workspace_id: workspace.id,
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        role: formData.role || null,
        bio: formData.bio || null,
        session_title: formData.session_title || null,
        session_time: formData.session_time || null,
        location: formData.location || null,
        travel_arranged: formData.travel_arranged,
        accommodation_arranged: formData.accommodation_arranged,
        notes: formData.notes || null,
        status: 'pending',
      };

      if (editingSpeaker) {
        const { error } = await supabase
          .from('workspace_speakers')
          .update({ ...speakerData, updated_at: new Date().toISOString() })
          .eq('id', editingSpeaker.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('workspace_speakers')
          .insert([speakerData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-speakers', workspace.id] });
      resetForm();
      toast.success(editingSpeaker ? 'Speaker updated' : 'Speaker added');
    },
    onError: (error: Error) => {
      toast.error('Failed to save speaker: ' + error.message);
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ speakerId, status }: { speakerId: string; status: string }) => {
      const { error } = await supabase
        .from('workspace_speakers')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', speakerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-speakers', workspace.id] });
      toast.success('Status updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update status: ' + error.message);
    },
  });

  // Delete speaker mutation
  const deleteSpeakerMutation = useMutation({
    mutationFn: async (speakerId: string) => {
      const { error } = await supabase
        .from('workspace_speakers')
        .delete()
        .eq('id', speakerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-speakers', workspace.id] });
      toast.success('Speaker removed');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: '',
      bio: '',
      session_title: '',
      session_time: '',
      location: '',
      travel_arranged: false,
      accommodation_arranged: false,
      notes: '',
    });
    setEditingSpeaker(null);
    setShowForm(false);
  };

  const handleEdit = (speaker: Speaker) => {
    setEditingSpeaker(speaker);
    setFormData({
      name: speaker.name,
      email: speaker.email || '',
      phone: speaker.phone || '',
      role: speaker.role || '',
      bio: speaker.bio || '',
      session_title: speaker.session_title || '',
      session_time: speaker.session_time ? speaker.session_time.slice(0, 16) : '',
      location: speaker.location || '',
      travel_arranged: speaker.travel_arranged,
      accommodation_arranged: speaker.accommodation_arranged,
      notes: speaker.notes || '',
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    saveSpeakerMutation.mutate();
  };

  const exportSpeakers = () => {
    if (!speakers || speakers.length === 0) return;
    
    const csv = [
      ['Name', 'Email', 'Phone', 'Role', 'Session', 'Time', 'Location', 'Status', 'Travel', 'Accommodation'].join(','),
      ...speakers.map(s => [
        s.name,
        s.email || '',
        s.phone || '',
        s.role || '',
        s.session_title || '',
        s.session_time ? format(new Date(s.session_time), 'PPp') : '',
        s.location || '',
        s.status,
        s.travel_arranged ? 'Yes' : 'No',
        s.accommodation_arranged ? 'Yes' : 'No',
      ].map(v => `"${v}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `speakers-${workspace.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Speaker list exported');
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_OPTIONS.find(s => s.value === status);
    if (!config) return null;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={cn('gap-1', config.color)}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const filteredSpeakers = speakers?.filter(s =>
    statusFilter === 'all' || s.status === statusFilter
  ) || [];

  const stats = {
    total: speakers?.length || 0,
    pending: speakers?.filter(s => s.status === 'pending').length || 0,
    confirmed: speakers?.filter(s => s.status === 'confirmed').length || 0,
    cancelled: speakers?.filter(s => s.status === 'cancelled').length || 0,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter('all')}>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Speakers</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter('pending')}>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-warning">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter('confirmed')}>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-success">{stats.confirmed}</div>
            <p className="text-xs text-muted-foreground">Confirmed</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter('cancelled')}>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-destructive">{stats.cancelled}</div>
            <p className="text-xs text-muted-foreground">Cancelled</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Speaker Form */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-emerald-500" />
              {editingSpeaker ? 'Edit Speaker' : 'Add Speaker'}
            </CardTitle>
            <CardDescription>Register and manage event speakers</CardDescription>
          </div>
          <div className="flex gap-2">
            {speakers && speakers.length > 0 && (
              <Button variant="outline" onClick={exportSpeakers}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
            {!showForm && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Speaker
              </Button>
            )}
          </div>
        </CardHeader>

        {showForm && (
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Speaker name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role/Title</Label>
                  <Input
                    id="role"
                    placeholder="e.g., Keynote Speaker, Panelist"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="speaker@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Brief speaker biography..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Session Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="session_title">Session Title</Label>
                    <Input
                      id="session_title"
                      placeholder="Talk/workshop title"
                      value={formData.session_title}
                      onChange={(e) => setFormData({ ...formData, session_title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="session_time">Date & Time</Label>
                    <Input
                      id="session_time"
                      type="datetime-local"
                      value={formData.session_time}
                      onChange={(e) => setFormData({ ...formData, session_time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="Room/Stage"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Logistics</h4>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="travel"
                      checked={formData.travel_arranged}
                      onCheckedChange={(checked) => setFormData({ ...formData, travel_arranged: !!checked })}
                    />
                    <Label htmlFor="travel" className="cursor-pointer">Travel Arranged</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="accommodation"
                      checked={formData.accommodation_arranged}
                      onCheckedChange={(checked) => setFormData({ ...formData, accommodation_arranged: !!checked })}
                    />
                    <Label htmlFor="accommodation" className="cursor-pointer">Accommodation Arranged</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any internal notes about this speaker..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveSpeakerMutation.isPending}>
                  {saveSpeakerMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingSpeaker ? 'Update Speaker' : 'Add Speaker'}
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Speakers List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-rose-500" />
              Speaker Directory
            </CardTitle>
            <CardDescription>
              {statusFilter === 'all' ? 'All speakers' : `Showing ${statusFilter} speakers`}
            </CardDescription>
          </div>
          {statusFilter !== 'all' && (
            <Button variant="ghost" size="sm" onClick={() => setStatusFilter('all')}>
              Clear Filter
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {filteredSpeakers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mic className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No speakers found</p>
              <p className="text-sm">Click "Add Speaker" to register your first speaker.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSpeakers.map((speaker) => (
                <div
                  key={speaker.id}
                  className="flex flex-col md:flex-row md:items-start justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{speaker.name}</span>
                      {getStatusBadge(speaker.status)}
                      {speaker.role && (
                        <Badge variant="outline" className="text-xs">{speaker.role}</Badge>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                      {speaker.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {speaker.email}
                        </span>
                      )}
                      {speaker.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {speaker.phone}
                        </span>
                      )}
                    </div>

                    {speaker.session_title && (
                      <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                        <span className="font-medium">{speaker.session_title}</span>
                        {speaker.session_time && (
                          <span className="text-muted-foreground ml-2">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {format(new Date(speaker.session_time), 'PPp')}
                          </span>
                        )}
                        {speaker.location && (
                          <span className="text-muted-foreground ml-2">
                            <MapPin className="h-3 w-3 inline mr-1" />
                            {speaker.location}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 mt-2">
                      {speaker.travel_arranged && (
                        <Badge variant="outline" className="text-xs bg-success/10">✓ Travel</Badge>
                      )}
                      {speaker.accommodation_arranged && (
                        <Badge variant="outline" className="text-xs bg-success/10">✓ Accommodation</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={speaker.status}
                      onValueChange={(value) => updateStatusMutation.mutate({ speakerId: speaker.id, status: value })}
                    >
                      <SelectTrigger className="w-[120px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(speaker)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteSpeakerMutation.mutate(speaker.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
