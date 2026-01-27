import { useState } from 'react';
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
import { MessageSquare, Mail, Phone } from 'lucide-react';
import { useCreateCommunication, Speaker } from '@/hooks/useSpeakerLiaisonData';

interface LogCommunicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  speakers: Speaker[];
}

export function LogCommunicationDialog({
  open,
  onOpenChange,
  workspaceId,
  speakers,
}: LogCommunicationDialogProps) {
  const [speakerId, setSpeakerId] = useState('');
  const [type, setType] = useState<'email' | 'call' | 'message'>('email');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<string>('sent');

  const createCommunication = useCreateCommunication(workspaceId);

  const resetForm = () => {
    setSpeakerId('');
    setType('email');
    setSubject('');
    setContent('');
    setStatus('sent');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await createCommunication.mutateAsync({
      speaker_id: speakerId,
      type,
      subject,
      content: content || undefined,
      status,
    });

    onOpenChange(false);
    resetForm();
  };

  const getTypeIcon = (t: string) => {
    if (t === 'email') return <Mail className="h-4 w-4" />;
    if (t === 'call') return <Phone className="h-4 w-4" />;
    return <MessageSquare className="h-4 w-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Log Communication
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select value={type} onValueChange={(v) => setType(v as 'email' | 'call' | 'message')}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    {getTypeIcon(type)}
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" /> Email
                    </div>
                  </SelectItem>
                  <SelectItem value="call">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" /> Call
                    </div>
                  </SelectItem>
                  <SelectItem value="message">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" /> Message
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="replied">Replied</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Session confirmation"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Notes / Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Additional details about the communication..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCommunication.isPending || !speakerId || !subject}>
              {createCommunication.isPending ? 'Saving...' : 'Log Communication'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
