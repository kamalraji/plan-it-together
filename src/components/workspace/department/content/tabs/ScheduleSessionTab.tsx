import { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import { useSpeakers, Speaker } from '@/hooks/useContentDepartmentData';
import { Calendar, Clock, MapPin, Loader2, User, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, startOfDay, isSameDay, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ScheduleSessionTabProps {
  workspace: Workspace;
}

export function ScheduleSessionTab({ workspace }: ScheduleSessionTabProps) {
  const queryClient = useQueryClient();
  const { data: speakers, isLoading } = useSpeakers(workspace.id);
  
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [editingSession, setEditingSession] = useState<Speaker | null>(null);
  const [sessionData, setSessionData] = useState({
    session_title: '',
    session_time: '',
    location: '',
  });

  // Update session mutation
  const updateSessionMutation = useMutation({
    mutationFn: async ({ speakerId, data }: { speakerId: string; data: Partial<Speaker> }) => {
      const { error } = await supabase
        .from('workspace_speakers')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', speakerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-speakers', workspace.id] });
      setEditingSession(null);
      toast.success('Session updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update session: ' + error.message);
    },
  });

  const handleEditSession = (speaker: Speaker) => {
    setEditingSession(speaker);
    setSessionData({
      session_title: speaker.session_title || '',
      session_time: speaker.session_time ? speaker.session_time.slice(0, 16) : '',
      location: speaker.location || '',
    });
  };

  const handleSaveSession = () => {
    if (!editingSession) return;
    updateSessionMutation.mutate({
      speakerId: editingSession.id,
      data: {
        session_title: sessionData.session_title || null,
        session_time: sessionData.session_time || null,
        location: sessionData.location || null,
      },
    });
  };

  const handleQuickSchedule = (speakerId: string) => {
    const speaker = speakers?.find(s => s.id === speakerId);
    if (speaker) {
      handleEditSession(speaker);
    }
  };

  // Group sessions by date
  const getSessionsForDate = (date: Date) => {
    return speakers?.filter(speaker => {
      if (!speaker.session_time) return false;
      return isSameDay(parseISO(speaker.session_time), date);
    }).sort((a, b) => {
      if (!a.session_time || !b.session_time) return 0;
      return new Date(a.session_time).getTime() - new Date(b.session_time).getTime();
    }) || [];
  };

  // Check for conflicts (same time + location)
  const checkConflicts = (sessions: Speaker[]) => {
    const conflicts: string[] = [];
    for (let i = 0; i < sessions.length; i++) {
      for (let j = i + 1; j < sessions.length; j++) {
        const a = sessions[i];
        const b = sessions[j];
        if (a.session_time === b.session_time && a.location === b.location && a.location) {
          conflicts.push(`${a.name} and ${b.name} are both scheduled at ${a.location}`);
        }
      }
    }
    return conflicts;
  };

  const unscheduledSpeakers = speakers?.filter(s => !s.session_time && s.status === 'confirmed') || [];
  const todaySessions = getSessionsForDate(selectedDate);
  const conflicts = checkConflicts(todaySessions);

  // Get unique locations
  const locations = [...new Set(speakers?.map(s => s.location).filter(Boolean))] as string[];

  // Navigation
  const goToPreviousDay = () => setSelectedDate(d => addDays(d, -1));
  const goToNextDay = () => setSelectedDate(d => addDays(d, 1));
  const goToToday = () => setSelectedDate(startOfDay(new Date()));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const scheduledCount = speakers?.filter(s => s.session_time).length || 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{speakers?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Total Speakers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{scheduledCount}</div>
            <p className="text-xs text-muted-foreground">Scheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-amber-600">{unscheduledSpeakers.length}</div>
            <p className="text-xs text-muted-foreground">Need Scheduling</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{todaySessions.length}</div>
            <p className="text-xs text-muted-foreground">Today's Sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Conflict Warnings */}
      {conflicts.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-700">Scheduling Conflicts Detected</h4>
                <ul className="text-sm text-amber-600 mt-1 space-y-1">
                  {conflicts.map((conflict, i) => (
                    <li key={i}>{conflict}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Date Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-pink-500" />
              Session Schedule
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousDay}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={goToNextDay}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todaySessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No sessions scheduled for this date</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaySessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border",
                    editingSession?.id === session.id && "ring-2 ring-primary"
                  )}
                >
                  {editingSession?.id === session.id ? (
                    <div className="w-full space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Session Title</Label>
                          <Input
                            value={sessionData.session_title}
                            onChange={(e) => setSessionData({ ...sessionData, session_title: e.target.value })}
                            placeholder="Session title"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Date & Time</Label>
                          <Input
                            type="datetime-local"
                            value={sessionData.session_time}
                            onChange={(e) => setSessionData({ ...sessionData, session_time: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Location</Label>
                          <Input
                            value={sessionData.location}
                            onChange={(e) => setSessionData({ ...sessionData, location: e.target.value })}
                            placeholder="Room/Stage"
                            list="locations"
                          />
                          <datalist id="locations">
                            {locations.map(loc => (
                              <option key={loc} value={loc} />
                            ))}
                          </datalist>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingSession(null)}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSaveSession} disabled={updateSessionMutation.isPending}>
                          {updateSessionMutation.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{session.name}</span>
                          <Badge variant={session.status === 'confirmed' ? 'default' : 'secondary'}>
                            {session.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">{session.session_title || 'Untitled Session'}</span>
                          {session.session_time && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(parseISO(session.session_time), 'h:mm a')}
                            </span>
                          )}
                          {session.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {session.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleEditSession(session)}>
                        Edit
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unscheduled Speakers */}
      {unscheduledSpeakers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Speakers Awaiting Schedule
            </CardTitle>
            <CardDescription>
              Confirmed speakers who haven't been assigned a session time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {unscheduledSpeakers.map((speaker) => (
                <div
                  key={speaker.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <span className="font-medium">{speaker.name}</span>
                    {speaker.role && (
                      <span className="text-sm text-muted-foreground ml-2">({speaker.role})</span>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleQuickSchedule(speaker.id)}>
                    <Calendar className="h-4 w-4 mr-1" />
                    Schedule
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
