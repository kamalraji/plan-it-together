import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useMediaCrew, MediaCrew } from '@/hooks/useMediaData';
import { Loader2 } from 'lucide-react';

interface AddCrewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
}

export function AddCrewModal({ open, onOpenChange, workspaceId }: AddCrewModalProps) {
  const { addCrewMember } = useMediaCrew(workspaceId);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    crew_type: 'photographer' as MediaCrew['crew_type'],
    assignment: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await addCrewMember.mutateAsync({
      workspace_id: workspaceId,
      name: formData.name,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      crew_type: formData.crew_type,
      assignment: formData.assignment || undefined,
      notes: formData.notes || undefined,
      status: 'off_duty',
      equipment: [],
    });

    setFormData({
      name: '',
      email: '',
      phone: '',
      crew_type: 'photographer',
      assignment: '',
      notes: '',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Crew Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Full name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="crew_type">Crew Type *</Label>
            <Select
              value={formData.crew_type}
              onValueChange={(value: MediaCrew['crew_type']) => 
                setFormData({ ...formData, crew_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="photographer">Photographer</SelectItem>
                <SelectItem value="videographer">Videographer</SelectItem>
                <SelectItem value="drone">Drone Operator</SelectItem>
                <SelectItem value="audio">Audio Engineer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignment">Assignment</Label>
            <Input
              id="assignment"
              value={formData.assignment}
              onChange={(e) => setFormData({ ...formData, assignment: e.target.value })}
              placeholder="e.g., Main Stage, Backstage"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addCrewMember.isPending || !formData.name}>
              {addCrewMember.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Crew Member
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
