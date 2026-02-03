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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Target, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Goal {
  name: string;
  target: string;
  unit: string;
  deadline: string;
}

interface GoalSettingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  workspaceName: string;
}

const GOAL_UNITS = [
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'count', label: 'Count (#)' },
  { value: 'hours', label: 'Hours' },
  { value: 'currency', label: 'Currency ($)' },
  { value: 'rating', label: 'Rating (1-5)' },
];

export function GoalSettingDialog({
  open,
  onOpenChange,
  workspaceId,
  workspaceName,
}: GoalSettingDialogProps) {
  const [goals, setGoals] = useState<Goal[]>([
    { name: '', target: '', unit: 'percentage', deadline: '' },
  ]);
  const [isSaving, setIsSaving] = useState(false);

  const addGoal = () => {
    setGoals([...goals, { name: '', target: '', unit: 'percentage', deadline: '' }]);
  };

  const removeGoal = (index: number) => {
    if (goals.length > 1) {
      setGoals(goals.filter((_, i) => i !== index));
    }
  };

  const updateGoal = (index: number, field: keyof Goal, value: string) => {
    const updated = [...goals];
    updated[index] = { ...updated[index], [field]: value };
    setGoals(updated);
  };

  const handleSave = async () => {
    const validGoals = goals.filter((g) => g.name.trim() && g.target);
    if (validGoals.length === 0) {
      toast.error('Please add at least one goal');
      return;
    }

    setIsSaving(true);
    try {
      const goalsToInsert = validGoals.map((goal) => ({
        workspace_id: workspaceId,
        title: goal.name.trim(),
        target_value: parseFloat(goal.target) || 0,
        current_value: 0,
        unit: goal.unit,
        due_date: goal.deadline || null,
        status: 'active',
      }));

      const { error } = await supabase.from('workspace_goals').insert(goalsToInsert);

      if (error) throw error;

      toast.success(`${validGoals.length} goal(s) created successfully!`);
      setGoals([{ name: '', target: '', unit: 'percentage', deadline: '' }]);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save goals:', error);
      toast.error('Failed to save goals');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Set Department Goals
          </DialogTitle>
          <DialogDescription>
            Define objectives and KPIs for {workspaceName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {goals.map((goal, index) => (
            <div
              key={index}
              className="p-4 border border-border rounded-lg space-y-3 bg-muted/30"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  Goal {index + 1}
                </span>
                {goals.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeGoal(index)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid gap-3">
                <div>
                  <Label htmlFor={`goal-name-${index}`}>Goal Name</Label>
                  <Input
                    id={`goal-name-${index}`}
                    placeholder="e.g., Task Completion Rate"
                    value={goal.name}
                    onChange={(e) => updateGoal(index, 'name', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor={`goal-target-${index}`}>Target Value</Label>
                    <Input
                      id={`goal-target-${index}`}
                      type="number"
                      placeholder="e.g., 95"
                      value={goal.target}
                      onChange={(e) => updateGoal(index, 'target', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`goal-unit-${index}`}>Unit</Label>
                    <Select
                      value={goal.unit}
                      onValueChange={(value) => updateGoal(index, 'unit', value)}
                    >
                      <SelectTrigger id={`goal-unit-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GOAL_UNITS.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor={`goal-deadline-${index}`}>Deadline (optional)</Label>
                  <Input
                    id={`goal-deadline-${index}`}
                    type="date"
                    value={goal.deadline}
                    onChange={(e) => updateGoal(index, 'deadline', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addGoal}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Goal
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Goals'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
