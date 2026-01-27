import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from 'lucide-react';
import { 
  useCreateSession, 
  useUpdateSession,
  useDeleteSession,
  Speaker, 
  SpeakerSession 
} from '@/hooks/useSpeakerLiaisonData';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface ScheduleSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  speakers: Speaker[];
  session?: SpeakerSession | null;
}

export function ScheduleSessionDialog({
  open,
  onOpenChange,
  workspaceId,
  speakers,
  session,
}: ScheduleSessionDialogProps) {
  const [speakerId, setSpeakerId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sessionType, setSessionType] = useState<'keynote' | 'workshop' | 'panel' | 'breakout' | 'fireside'>('breakout');
  const [scheduledDate, setScheduledDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [room, setRoom] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const createSession = useCreateSession(workspaceId);
  const updateSession = useUpdateSession(workspaceId);
  const deleteSession = useDeleteSession(workspaceId);

  const isEditing = !!session;

  useEffect(() => {
    if (session) {
      setSpeakerId(session.speaker_id);
      setTitle(session.title);
      setDescription(session.description || '');
      setSessionType(session.session_type || 'breakout');
      setScheduledDate(session.scheduled_date || '');
      setStartTime(session.start_time || '');
      setEndTime(session.end_time || '');
      setRoom(session.room || '');
    } else {
      resetForm();
    }
  }, [session, open]);

  const resetForm = () => {
    setSpeakerId('');
    setTitle('');
    setDescription('');
    setSessionType('breakout');
    setScheduledDate('');
    setStartTime('');
    setEndTime('');
    setRoom('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const sessionData = {
      speaker_id: speakerId,
      title,
      description: description || undefined,
      session_type: sessionType,
      scheduled_date: scheduledDate || undefined,
      start_time: startTime || undefined,
      end_time: endTime || undefined,
      room: room || undefined,
    };

    if (isEditing && session) {
      await updateSession.mutateAsync({ id: session.id, ...sessionData });
    } else {
      await createSession.mutateAsync(sessionData);
    }

    onOpenChange(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (session) {
      await deleteSession.mutateAsync(session.id);
      onOpenChange(false);
    }
  };

  const isPending = createSession.isPending || updateSession.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {isEditing ? 'Edit Session' : 'Schedule Session'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="speaker">Speaker *</Label>
              <Select value={speakerId} onValueChange={setSpeakerId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select speaker" />
                </SelectTrigger>
                <SelectContent>
                  {speakers.map((speaker) => (
                    <SelectItem key={speaker.id} value={speaker.id}>
                      {speaker.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Session Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Opening Keynote"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Session Type</Label>
              <Select 
                value={sessionType} 
                onValueChange={(value: 'keynote' | 'workshop' | 'panel' | 'breakout' | 'fireside') => setSessionType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="keynote">Keynote</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="panel">Panel</SelectItem>
                  <SelectItem value="breakout">Breakout</SelectItem>
                  <SelectItem value="fireside">Fireside Chat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="room">Room</Label>
                <Input
                  id="room"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="e.g., Main Hall"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Session description..."
                rows={3}
              />
            </div>

            <DialogFooter className="gap-2">
              {isEditing && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete
                </Button>
              )}
              <div className="flex-1" />
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !speakerId || !title}>
                {isPending ? 'Saving...' : isEditing ? 'Update Session' : 'Schedule Session'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Session"
        description="Are you sure you want to delete this session? This action cannot be undone."
        onConfirm={handleDelete}
        variant="danger"
      />
    </>
  );
}
