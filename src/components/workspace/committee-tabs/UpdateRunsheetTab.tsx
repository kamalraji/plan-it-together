import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ClipboardList, Clock, Play, Pause, CheckCircle, AlertTriangle, Plus, RotateCcw, Trash2, FileText, SkipForward } from 'lucide-react';
import { useRunsheet, RunsheetCue } from '@/hooks/useRunsheet';

interface UpdateRunsheetTabProps {
  workspaceId: string;
  eventId?: string;
}

const CUE_TYPES = [
  { value: 'general', label: 'General' },
  { value: 'audio', label: 'Audio' },
  { value: 'visual', label: 'Visual' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'stage', label: 'Stage' },
];

export function UpdateRunsheetTab({ workspaceId, eventId }: UpdateRunsheetTabProps) {
  const {
    cues,
    stats,
    teamMembers,
    isLoading,
    isSaving,
    createCue,
    deleteCue,
    startCue,
    completeCue,
    skipCue,
    delayCue,
    resetAllCues,
    createDefaultTemplate,
  } = useRunsheet({ workspaceId, eventId });

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCue, setNewCue] = useState({
    scheduledTime: '09:00',
    durationMinutes: 15,
    title: '',
    description: '',
    cueType: 'general',
    technicianId: '',
    notes: '',
  });

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getStatusBadge = (status: RunsheetCue['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><CheckCircle className="h-3 w-3 mr-1" />Done</Badge>;
      case 'live':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 animate-pulse"><Play className="h-3 w-3 mr-1" />Live</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20"><Clock className="h-3 w-3 mr-1" />Upcoming</Badge>;
      case 'delayed':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20"><AlertTriangle className="h-3 w-3 mr-1" />Delayed</Badge>;
      case 'skipped':
        return <Badge className="bg-muted text-muted-foreground"><SkipForward className="h-3 w-3 mr-1" />Skipped</Badge>;
    }
  };

  const getCueTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      audio: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      visual: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
      lighting: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      stage: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
      general: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    };
    return <Badge variant="outline" className={colors[type] || colors.general}>{type}</Badge>;
  };

  const handleAddCue = async () => {
    if (!newCue.title.trim()) return;
    
    await createCue.mutateAsync({
      scheduledTime: newCue.scheduledTime,
      durationMinutes: newCue.durationMinutes,
      title: newCue.title,
      description: newCue.description || undefined,
      cueType: newCue.cueType,
      technicianId: newCue.technicianId || undefined,
      notes: newCue.notes || undefined,
    });

    setNewCue({
      scheduledTime: '09:00',
      durationMinutes: 15,
      title: '',
      description: '',
      cueType: 'general',
      technicianId: '',
      notes: '',
    });
    setIsAddDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Update Runsheet</h2>
          <p className="text-sm text-muted-foreground">Manage technical schedule and cue timings</p>
        </div>
        <div className="flex items-center gap-2">
          {cues.length === 0 && (
            <Button variant="outline" onClick={createDefaultTemplate}>
              <FileText className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          )}
          <Button variant="outline" onClick={resetAllCues} disabled={isSaving || cues.length === 0}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset All
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Cue
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Cue</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={newCue.scheduledTime}
                      onChange={(e) => setNewCue({ ...newCue, scheduledTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (min)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={newCue.durationMinutes}
                      onChange={(e) => setNewCue({ ...newCue, durationMinutes: parseInt(e.target.value) || 5 })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={newCue.title}
                    onChange={(e) => setNewCue({ ...newCue, title: e.target.value })}
                    placeholder="e.g., Opening Ceremony Audio Cue"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newCue.description}
                    onChange={(e) => setNewCue({ ...newCue, description: e.target.value })}
                    placeholder="Additional details..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={newCue.cueType}
                      onValueChange={(value) => setNewCue({ ...newCue, cueType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CUE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Technician</Label>
                    <Select
                      value={newCue.technicianId}
                      onValueChange={(value) => setNewCue({ ...newCue, technicianId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Assign..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={newCue.notes}
                    onChange={(e) => setNewCue({ ...newCue, notes: e.target.value })}
                    placeholder="Any notes for this cue..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddCue} disabled={!newCue.title.trim() || isSaving}>
                    Add Cue
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Progress */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Cues</div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/10 border-emerald-500/20">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-emerald-500">{stats.completed}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-500">{stats.live}</div>
            <div className="text-xs text-muted-foreground">Live Now</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-amber-500">{stats.delayed}</div>
            <div className="text-xs text-muted-foreground">Delayed</div>
          </CardContent>
        </Card>
      </div>

      {/* Runsheet */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Technical Runsheet
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cues.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No cues yet. Add your first cue or create a template.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cues.map((cue) => (
                <div
                  key={cue.id}
                  className={`flex items-start gap-4 p-3 rounded-lg border transition-colors ${
                    cue.status === 'live' 
                      ? 'bg-red-500/5 border-red-500/30' 
                      : cue.status === 'completed'
                      ? 'bg-muted/30 opacity-60'
                      : cue.status === 'skipped'
                      ? 'bg-muted/20 opacity-40'
                      : cue.status === 'delayed'
                      ? 'bg-amber-500/5 border-amber-500/30'
                      : 'bg-card hover:bg-muted/30'
                  }`}
                >
                  <div className="text-center min-w-[60px]">
                    <div className="font-mono font-bold">{cue.scheduledTime.slice(0, 5)}</div>
                    <div className="text-xs text-muted-foreground">{formatDuration(cue.durationMinutes)}</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{cue.title}</span>
                      {getCueTypeBadge(cue.cueType)}
                    </div>
                    {cue.description && (
                      <div className="text-sm text-muted-foreground">{cue.description}</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {cue.technicianName ? `Tech: ${cue.technicianName}` : 'Unassigned'}
                      {cue.notes && ` • ${cue.notes}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(cue.status)}
                    {cue.status === 'live' && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => completeCue(cue.id)} title="Complete">
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => delayCue(cue.id)} title="Mark Delayed">
                          <Pause className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {cue.status === 'upcoming' && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => startCue(cue.id)} title="Start Cue">
                          <Play className="h-4 w-4 text-emerald-500" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => skipCue(cue.id)} title="Skip">
                          <SkipForward className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {cue.status === 'delayed' && (
                      <Button variant="ghost" size="sm" onClick={() => startCue(cue.id)} title="Resume">
                        <Play className="h-4 w-4 text-emerald-500" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => deleteCue.mutate(cue.id)}
                      className="text-destructive hover:text-destructive"
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
