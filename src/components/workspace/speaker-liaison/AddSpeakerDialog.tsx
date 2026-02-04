import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useCreateSpeaker } from '@/hooks/useSpeakerLiaisonData';
import { Loader2 } from 'lucide-react';

interface AddSpeakerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string | undefined;
}

export function AddSpeakerDialog({ open, onOpenChange, workspaceId }: AddSpeakerDialogProps) {
  const createSpeaker = useCreateSpeaker(workspaceId);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    bio: '',
    session_title: '',
    status: 'pending' as 'pending' | 'confirmed',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    await createSpeaker.mutateAsync(formData);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: '',
      bio: '',
      session_title: '',
      status: 'pending',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Speaker</DialogTitle>
          <DialogDescription>
            Enter the speaker's details. They can be invited later to submit their materials.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Dr. Jane Smith"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jane@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role / Title</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="CEO, Professor, etc."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="session_title">Session Topic</Label>
              <Input
                id="session_title"
                value={formData.session_title}
                onChange={(e) => setFormData({ ...formData, session_title: e.target.value })}
                placeholder="The Future of AI in Healthcare"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Initial Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'pending' | 'confirmed') => 
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending Confirmation</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Short Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Brief biography for the speaker..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createSpeaker.isPending || !formData.name.trim()}>
              {createSpeaker.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Speaker
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
