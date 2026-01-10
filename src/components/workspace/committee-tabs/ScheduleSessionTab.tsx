import { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSpeakers, Speaker } from '@/hooks/useContentDepartmentData';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Calendar, Clock, MapPin, Loader2, Edit2, Check, X, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface ScheduleSessionTabProps {
  workspace: Workspace;
}

interface EditingSpeaker {
  id: string;
  session_title: string;
  session_time: string;
  location: string;
}

export function ScheduleSessionTab({ workspace }: ScheduleSessionTabProps) {
  const queryClient = useQueryClient();
  const { data: speakers, isLoading } = useSpeakers(workspace.id);

  const [editingSpeaker, setEditingSpeaker] = useState<EditingSpeaker | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('');

  const updateSessionMutation = useMutation({
    mutationFn: async (update: { speakerId: string; session_title: string; session_time: string; location: string }) => {
      const { error } = await supabase
        .from('workspace_speakers')
        .update({
          session_title: update.session_title.trim() || null,
          session_time: update.session_time || null,
          location: update.location.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', update.speakerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-speakers', workspace.id] });
      toast.success('Session updated successfully');
      setEditingSpeaker(null);
    },
    onError: (error: any) => {
      toast.error('Failed to update session: ' + error.message);
    },
  });

  const handleEdit = (speaker: Speaker) => {
    setEditingSpeaker({
      id: speaker.id,
      session_title: speaker.session_title || '',
      session_time: speaker.session_time || '',
      location: speaker.location || '',
    });
  };

  const handleSave = () => {
    if (!editingSpeaker) return;
    updateSessionMutation.mutate({
      speakerId: editingSpeaker.id,
      session_title: editingSpeaker.session_title,
      session_time: editingSpeaker.session_time,
      location: editingSpeaker.location,
    });
  };

  const handleCancel = () => {
    setEditingSpeaker(null);
  };

  // Filter and sort speakers by session time
  const scheduledSpeakers = speakers
    ?.filter(s => s.session_time)
    .filter(s => !dateFilter || s.session_time?.startsWith(dateFilter))
    .sort((a, b) => {
      if (!a.session_time || !b.session_time) return 0;
      return new Date(a.session_time).getTime() - new Date(b.session_time).getTime();
    }) || [];

  const unscheduledSpeakers = speakers?.filter(s => !s.session_time && s.status !== 'cancelled') || [];

  // Get unique dates for filter
  const uniqueDates = [...new Set(
    speakers
      ?.filter(s => s.session_time)
      .map(s => s.session_time!.split('T')[0])
  )].sort();

  // Check for schedule conflicts (same time + same location)
  const getConflicts = (speaker: Speaker): Speaker[] => {
    if (!speaker.session_time || !speaker.location) return [];
    return scheduledSpeakers.filter(s => 
      s.id !== speaker.id &&
      s.session_time === speaker.session_time &&
      s.location === speaker.location
    );
  };

  const stats = {
    scheduled: scheduledSpeakers.length,
    unscheduled: unscheduledSpeakers.length,
    confirmed: speakers?.filter(s => s.status === 'confirmed').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-muted/30">
          <CardContent className="p-4 text-center">
            <Calendar className="h-5 w-5 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{stats.scheduled}</div>
            <div className="text-xs text-muted-foreground">Scheduled Sessions</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 mx-auto mb-2 text-amber-500" />
            <div className="text-2xl font-bold">{stats.unscheduled}</div>
            <div className="text-xs text-muted-foreground">Pending Schedule</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-4 text-center">
            <Check className="h-5 w-5 mx-auto mb-2 text-emerald-500" />
            <div className="text-2xl font-bold">{stats.confirmed}</div>
            <div className="text-xs text-muted-foreground">Confirmed Speakers</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Unscheduled Speakers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-amber-500" />
              Pending Schedule
            </CardTitle>
            <CardDescription>Speakers without assigned times</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : unscheduledSpeakers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                All speakers are scheduled
              </div>
            ) : (
              <ScrollArea className="h-[350px]">
                <div className="space-y-2">
                  {unscheduledSpeakers.map((speaker) => (
                    <div
                      key={speaker.id}
                      className="p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-sm">{speaker.name}</h4>
                          {speaker.role && (
                            <p className="text-xs text-muted-foreground">{speaker.role}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(speaker)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Schedule Timeline */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Session Schedule
                </CardTitle>
                <CardDescription>Manage speaker session times and locations</CardDescription>
              </div>
              {uniqueDates.length > 0 && (
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All dates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All dates</SelectItem>
                    {uniqueDates.map((date) => (
                      <SelectItem key={date} value={date}>
                        {format(parseISO(date), 'MMM d, yyyy')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : scheduledSpeakers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No scheduled sessions yet
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {scheduledSpeakers.map((speaker) => {
                    const isEditing = editingSpeaker?.id === speaker.id;
                    const conflicts = getConflicts(speaker);
                    const hasConflict = conflicts.length > 0;

                    return (
                      <div
                        key={speaker.id}
                        className={`p-4 rounded-lg border transition-colors ${
                          hasConflict ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-900/10' : 'bg-card hover:bg-muted/30'
                        }`}
                      >
                        {isEditing ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{speaker.name}</h4>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleSave}
                                  disabled={updateSessionMutation.isPending}
                                >
                                  {updateSessionMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Check className="h-4 w-4 text-emerald-500" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleCancel}
                                >
                                  <X className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Session Title</Label>
                                <Input
                                  value={editingSpeaker.session_title}
                                  onChange={(e) => setEditingSpeaker({ ...editingSpeaker, session_title: e.target.value })}
                                  placeholder="Session title"
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Date & Time</Label>
                                <Input
                                  type="datetime-local"
                                  value={editingSpeaker.session_time}
                                  onChange={(e) => setEditingSpeaker({ ...editingSpeaker, session_time: e.target.value })}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Location</Label>
                                <Input
                                  value={editingSpeaker.location}
                                  onChange={(e) => setEditingSpeaker({ ...editingSpeaker, location: e.target.value })}
                                  placeholder="Room/Stage"
                                  className="h-8 text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{speaker.name}</h4>
                                {speaker.status === 'confirmed' && (
                                  <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">
                                    Confirmed
                                  </Badge>
                                )}
                                {hasConflict && (
                                  <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Conflict
                                  </Badge>
                                )}
                              </div>
                              {speaker.session_title && (
                                <p className="text-sm font-medium text-primary mt-1">{speaker.session_title}</p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                {speaker.session_time && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {format(parseISO(speaker.session_time), 'MMM d, h:mm a')}
                                  </span>
                                )}
                                {speaker.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {speaker.location}
                                  </span>
                                )}
                              </div>
                              {hasConflict && (
                                <p className="text-xs text-amber-600 mt-2">
                                  Conflicts with: {conflicts.map(c => c.name).join(', ')}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(speaker)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
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
