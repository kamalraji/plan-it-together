import { useState } from 'react';
import { Target, Plus, TrendingUp, AlertTriangle, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useGoals, Goal } from '@/hooks/useCommitteeDashboard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface GoalTrackerProps {
  workspaceId: string;
}

const statusConfig = {
  on_track: { icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'On Track' },
  at_risk: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'At Risk' },
  behind: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Behind' },
  achieved: { icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/10', label: 'Achieved' },
};

export function GoalTracker({ workspaceId }: GoalTrackerProps) {
  const { goals, isLoading, createGoal, updateGoal, deleteGoal } = useGoals(workspaceId);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    target_value: '',
    unit: '',
    category: '',
  });

  const handleAdd = () => {
    if (!newGoal.title.trim()) return;
    createGoal({
      workspace_id: workspaceId,
      title: newGoal.title,
      description: null,
      target_value: newGoal.target_value ? parseFloat(newGoal.target_value) : null,
      current_value: 0,
      unit: newGoal.unit || null,
      due_date: null,
      status: 'on_track',
      category: newGoal.category || null,
    });
    setNewGoal({ title: '', target_value: '', unit: '', category: '' });
    setShowAddDialog(false);
  };

  const handleProgressUpdate = (goal: Goal, value: number) => {
    const newValue = Math.max(0, Math.min(value, goal.target_value || 100));
    let newStatus: Goal['status'] = 'on_track';
    
    if (goal.target_value) {
      const percentage = (newValue / goal.target_value) * 100;
      if (percentage >= 100) newStatus = 'achieved';
      else if (percentage < 25) newStatus = 'behind';
      else if (percentage < 50) newStatus = 'at_risk';
    }

    updateGoal({ id: goal.id, current_value: newValue, status: newStatus });
  };

  const achievedCount = goals.filter(g => g.status === 'achieved').length;

  if (isLoading) {
    return <div className="animate-pulse h-48 bg-muted rounded-xl" />;
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground">OKRs & Goals</h3>
            <p className="text-xs text-muted-foreground">
              {achievedCount} of {goals.length} achieved
            </p>
          </div>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Goal title (e.g., Increase attendance)"
                value={newGoal.title}
                onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  placeholder="Target value"
                  value={newGoal.target_value}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, target_value: e.target.value }))}
                />
                <Input
                  placeholder="Unit (e.g., %, attendees)"
                  value={newGoal.unit}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, unit: e.target.value }))}
                />
              </div>
              <Select
                value={newGoal.category}
                onValueChange={(value) => setNewGoal(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="engagement">Engagement</SelectItem>
                  <SelectItem value="quality">Quality</SelectItem>
                  <SelectItem value="efficiency">Efficiency</SelectItem>
                  <SelectItem value="growth">Growth</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAdd} className="w-full">Add Goal</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No goals set yet. Define OKRs to track committee performance.
        </p>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const config = statusConfig[goal.status];
            const Icon = config.icon;
            const progress = goal.target_value
              ? Math.min((goal.current_value / goal.target_value) * 100, 100)
              : 0;

            return (
              <div key={goal.id} className="p-3 rounded-lg bg-muted/50 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{goal.title}</span>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${config.bg} ${config.color}`}>
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </span>
                    </div>
                    {goal.category && (
                      <span className="text-xs text-muted-foreground capitalize">{goal.category}</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteGoal(goal.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium text-foreground">
                      {goal.current_value}{goal.unit ? ` ${goal.unit}` : ''} / {goal.target_value}{goal.unit ? ` ${goal.unit}` : ''}
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Update progress"
                    className="h-8 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const value = parseFloat((e.target as HTMLInputElement).value);
                        if (!isNaN(value)) {
                          handleProgressUpdate(goal, value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8"
                    onClick={(e) => {
                      const input = (e.target as HTMLElement).parentElement?.querySelector('input');
                      if (input) {
                        const value = parseFloat(input.value);
                        if (!isNaN(value)) {
                          handleProgressUpdate(goal, value);
                          input.value = '';
                        }
                      }
                    }}
                  >
                    Update
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
