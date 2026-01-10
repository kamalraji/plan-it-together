import React, { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSpeakers, Speaker } from '@/hooks/useContentDepartmentData';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mic, Plus, Loader2, Trash2, Filter, CheckCircle, Clock, XCircle, Mail, Phone } from 'lucide-react';

interface AddSpeakerTabProps {
  workspace: Workspace;
}

type SpeakerStatus = 'pending' | 'confirmed' | 'cancelled';

const STATUS_CONFIG: Record<SpeakerStatus, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: 'Pending', icon: Clock, color: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Confirmed', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'bg-red-100 text-red-700' },
};

export function AddSpeakerTab({ workspace }: AddSpeakerTabProps) {
  const queryClient = useQueryClient();
  const { data: speakers, isLoading } = useSpeakers(workspace.id);

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [location, setLocation] = useState('');
  const [travelArranged, setTravelArranged] = useState(false);
  const [accommodationArranged, setAccommodationArranged] = useState(false);
  const [statusFilter, setStatusFilter] = useState<SpeakerStatus | 'all'>('all');

  const createMutation = useMutation({
    mutationFn: async (speaker: Omit<Speaker, 'id' | 'workspace_id' | 'created_at' | 'updated_at' | 'avatar_url'>) => {
      const { error } = await supabase
        .from('workspace_speakers')
        .insert({
          workspace_id: workspace.id,
          ...speaker,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-speakers', workspace.id] });
      toast.success('Speaker registered successfully');
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Failed to register speaker: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
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
    onError: (error: any) => {
      toast.error('Failed to remove: ' + error.message);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ speakerId, status }: { speakerId: string; status: SpeakerStatus }) => {
      const { error } = await supabase
        .from('workspace_speakers')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', speakerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-speakers', workspace.id] });
      toast.success('Speaker status updated');
    },
    onError: (error: any) => {
      toast.error('Failed to update status: ' + error.message);
    },
  });

  const resetForm = () => {
    setName('');
    setRole('');
    setEmail('');
    setPhone('');
    setBio('');
    setSessionTitle('');
    setSessionTime('');
    setLocation('');
    setTravelArranged(false);
    setAccommodationArranged(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter the speaker name');
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      role: role.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      bio: bio.trim() || null,
      session_title: sessionTitle.trim() || null,
      session_time: sessionTime || null,
      location: location.trim() || null,
      status: 'pending',
      travel_arranged: travelArranged,
      accommodation_arranged: accommodationArranged,
      notes: null,
    });
  };

  const filteredSpeakers = speakers?.filter(speaker =>
    statusFilter === 'all' || speaker.status === statusFilter
  ) || [];

  const stats = {
    total: speakers?.length || 0,
    pending: speakers?.filter(s => s.status === 'pending').length || 0,
    confirmed: speakers?.filter(s => s.status === 'confirmed').length || 0,
    cancelled: speakers?.filter(s => s.status === 'cancelled').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-muted/30">
          <CardContent className="p-4 text-center">
            <Mic className="h-5 w-5 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Speakers</div>
          </CardContent>
        </Card>
        {Object.entries(STATUS_CONFIG).map(([status, config]) => (
          <Card key={status} className="bg-muted/30">
            <CardContent className="p-4 text-center">
              <config.icon className={`h-5 w-5 mx-auto mb-2 ${status === 'pending' ? 'text-amber-500' : status === 'confirmed' ? 'text-emerald-500' : 'text-red-500'}`} />
              <div className="text-2xl font-bold">{stats[status as SpeakerStatus]}</div>
              <div className="text-xs text-muted-foreground">{config.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Register Speaker
            </CardTitle>
            <CardDescription>Add a new speaker to the event</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="speaker-name">Name *</Label>
                  <Input
                    id="speaker-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Speaker name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="speaker-role">Role/Title</Label>
                  <Input
                    id="speaker-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g., CEO, Professor"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="speaker-email">Email</Label>
                  <Input
                    id="speaker-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="speaker-phone">Phone</Label>
                  <Input
                    id="speaker-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="session-title">Session Title</Label>
                <Input
                  id="session-title"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="Talk or workshop title"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="session-time">Session Time</Label>
                  <Input
                    id="session-time"
                    type="datetime-local"
                    value={sessionTime}
                    onChange={(e) => setSessionTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Room/Stage"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Brief speaker biography..."
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="travel"
                    checked={travelArranged}
                    onCheckedChange={setTravelArranged}
                  />
                  <Label htmlFor="travel" className="text-sm">Travel Arranged</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="accommodation"
                    checked={accommodationArranged}
                    onCheckedChange={setAccommodationArranged}
                  />
                  <Label htmlFor="accommodation" className="text-sm">Accommodation Arranged</Label>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Register Speaker
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Speakers List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-primary" />
                Speakers Directory
              </CardTitle>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as SpeakerStatus | 'all')}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredSpeakers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No speakers found
              </div>
            ) : (
              <ScrollArea className="h-[450px]">
                <div className="space-y-3">
                  {filteredSpeakers.map((speaker) => {
                    const statusConfig = STATUS_CONFIG[speaker.status];
                    const StatusIcon = statusConfig.icon;

                    return (
                      <div
                        key={speaker.id}
                        className="p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{speaker.name}</h4>
                              <Badge className={`text-xs ${statusConfig.color}`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                            </div>
                            {speaker.role && (
                              <p className="text-sm text-muted-foreground">{speaker.role}</p>
                            )}
                            {speaker.session_title && (
                              <p className="text-sm mt-1 font-medium text-primary">{speaker.session_title}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
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
                            <div className="flex items-center gap-2 mt-2">
                              {speaker.travel_arranged && (
                                <Badge variant="secondary" className="text-xs">✈️ Travel</Badge>
                              )}
                              {speaker.accommodation_arranged && (
                                <Badge variant="secondary" className="text-xs">🏨 Accommodation</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Select
                              value={speaker.status}
                              onValueChange={(v) => updateStatusMutation.mutate({ speakerId: speaker.id, status: v as SpeakerStatus })}
                            >
                              <SelectTrigger className="w-28 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                                  <SelectItem key={value} value={value}>
                                    {config.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => deleteMutation.mutate(speaker.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
    </div>
  );
}
