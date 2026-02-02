import { useState } from 'react';
import { useTimeTracking } from '@/hooks/useTimeTracking';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Clock, Send } from 'lucide-react';
import { format } from 'date-fns';

interface TimeTrackerProps {
  workspaceId: string;
}

export function TimeTracker({ workspaceId }: TimeTrackerProps) {
  const { user } = useAuth();
  const { createEntry, isCreating } = useTimeTracking(workspaceId, user?.id);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    hours: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.hours) return;

    createEntry({
      workspace_id: workspaceId,
      user_id: user.id,
      task_id: null,
      date: formData.date,
      hours: parseFloat(formData.hours),
      description: formData.description || null,
      status: 'draft',
    });

    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      hours: '',
      description: '',
    });
    setIsAdding(false);
  };

  if (!isAdding) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsAdding(true)}
        className="w-full justify-start gap-2"
      >
        <Plus className="h-4 w-4" />
        Log Time
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border border-border rounded-lg bg-card space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Clock className="h-4 w-4 text-primary" />
        Log Time Entry
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hours">Hours</Label>
          <Input
            id="hours"
            type="number"
            step="0.5"
            min="0"
            max="24"
            placeholder="0.0"
            value={formData.hours}
            onChange={(e) => setFormData(prev => ({ ...prev, hours: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          placeholder="What did you work on?"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={2}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isCreating || !formData.hours}>
          <Send className="h-4 w-4 mr-2" />
          Save Entry
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
