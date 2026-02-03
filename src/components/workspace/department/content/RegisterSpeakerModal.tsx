import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';

interface RegisterSpeakerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
}

type SpeakerStatus = 'pending' | 'confirmed' | 'cancelled';

export function RegisterSpeakerModal({ open, onOpenChange, workspaceId }: RegisterSpeakerModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [bio, setBio] = useState('');
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<SpeakerStatus>('pending');
  const [travelArranged, setTravelArranged] = useState(false);
  const [accommodationArranged, setAccommodationArranged] = useState(false);
  const [notes, setNotes] = useState('');

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('workspace_speakers')
        .insert([{
          workspace_id: workspaceId,
          name,
          email: email || null,
          phone: phone || null,
          role: role || null,
          bio: bio || null,
          session_title: sessionTitle || null,
          session_time: sessionTime || null,
          location: location || null,
          status,
          travel_arranged: travelArranged,
          accommodation_arranged: accommodationArranged,
          notes: notes || null,
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-speakers', workspaceId] });
      toast.success('Speaker registered successfully');
      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Failed to register speaker: ' + error.message);
    },
  });

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setRole('');
    setBio('');
    setSessionTitle('');
    setSessionTime('');
    setLocation('');
    setStatus('pending');
    setTravelArranged(false);
    setAccommodationArranged(false);
    setNotes('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter speaker name');
      return;
    }
    createMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Register New Speaker
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Jane Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role / Title</Label>
              <Input
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Keynote Speaker"
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="speaker@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>

          {/* Session Details */}
          <div className="space-y-2">
            <Label htmlFor="sessionTitle">Session Title</Label>
            <Input
              id="sessionTitle"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              placeholder="The Future of AI in Education"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sessionTime">Session Time</Label>
              <Input
                id="sessionTime"
                type="datetime-local"
                value={sessionTime}
                onChange={(e) => setSessionTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location / Venue</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Main Hall A"
              />
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Biography</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief biography of the speaker..."
              rows={3}
            />
          </div>

          {/* Status & Logistics */}
          <div className="space-y-2">
            <Label htmlFor="status">Confirmation Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as SpeakerStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="travel"
                checked={travelArranged}
                onCheckedChange={setTravelArranged}
              />
              <Label htmlFor="travel">Travel Arranged</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="accommodation"
                checked={accommodationArranged}
                onCheckedChange={setAccommodationArranged}
              />
              <Label htmlFor="accommodation">Accommodation Arranged</Label>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Registering...' : 'Register Speaker'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
