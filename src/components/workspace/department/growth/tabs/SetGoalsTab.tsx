import React, { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Target, TrendingUp, TrendingDown, Minus, Trash2, CheckCircle2, Calendar, Edit2 } from 'lucide-react';
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal, Goal } from '@/hooks/useGrowthDepartmentData';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';

interface SetGoalsTabProps {
  workspace: Workspace;
}

const categoryConfig: Record<string, { color: string; label: string }> = {
  reach: { color: 'bg-blue-500/20 text-blue-600', label: 'Reach' },
  engagement: { color: 'bg-purple-500/20 text-purple-600', label: 'Engagement' },
  revenue: { color: 'bg-green-500/20 text-green-600', label: 'Revenue' },
  audience: { color: 'bg-amber-500/20 text-amber-600', label: 'Audience' },
  conversion: { color: 'bg-pink-500/20 text-pink-600', label: 'Conversion' },
  brand: { color: 'bg-cyan-500/20 text-cyan-600', label: 'Brand' },
};

const statusConfig: Record<string, { color: string; label: string }> = {
  active: { color: 'bg-blue-500/20 text-blue-600', label: 'Active' },
  achieved: { color: 'bg-green-500/20 text-green-600', label: 'Achieved' },
  missed: { color: 'bg-red-500/20 text-red-600', label: 'Missed' },
  cancelled: { color: 'bg-muted-foreground/30/20 text-muted-foreground', label: 'Cancelled' },
};

const trendIcons: Record<string, React.ElementType> = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

export function SetGoalsTab({ workspace }: SetGoalsTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [formData, setFormData] = useState({
    title: '',
    category: 'reach',
    target_value: 0,
    current_value: 0,
    unit: 'count',
    due_date: '',
    notes: '',
  });

  const { data: goals, isLoading } = useGoals(workspace.id);
  const createGoal = useCreateGoal(workspace.id);
  const updateGoal = useUpdateGoal(workspace.id);
  const deleteGoal = useDeleteGoal(workspace.id);

  const filteredGoals = goals?.filter(g => 
    statusFilter === 'all' || g.status === statusFilter
  ) || [];

  const resetForm = () => {
    setFormData({ title: '', category: 'reach', target_value: 0, current_value: 0, unit: 'count', due_date: '', notes: '' });
    setEditingGoal(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingGoal) {
      await updateGoal.mutateAsync({
        id: editingGoal.id,
        ...formData,
        due_date: formData.due_date || null,
      });
    } else {
      await createGoal.mutateAsync({
        ...formData,
        due_date: formData.due_date || null,
      });
    }
    
    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      category: goal.category,
      target_value: goal.target_value,
      current_value: goal.current_value,
      unit: goal.unit,
      due_date: goal.due_date || '',
      notes: goal.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleMarkAchieved = (goal: Goal) => {
    updateGoal.mutate({ id: goal.id, status: 'achieved', current_value: goal.target_value });
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Growth Goals</h2>
          <p className="text-muted-foreground">Set and track your growth objectives</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Set Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGoal ? 'Edit Goal' : 'Set New Goal'}</DialogTitle>
              <DialogDescription>Define your growth objective and target</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Goal Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Increase social media followers"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="count">Count</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="usd">USD</SelectItem>
                      <SelectItem value="followers">Followers</SelectItem>
                      <SelectItem value="impressions">Impressions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="current_value">Current Value</Label>
                  <Input
                    id="current_value"
                    type="number"
                    value={formData.current_value}
                    onChange={(e) => setFormData({ ...formData, current_value: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target_value">Target Value</Label>
                  <Input
                    id="target_value"
                    type="number"
                    value={formData.target_value}
                    onChange={(e) => setFormData({ ...formData, target_value: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date (optional)</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional context or milestones..."
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>Cancel</Button>
                <Button type="submit" disabled={createGoal.isPending || updateGoal.isPending}>
                  {editingGoal ? 'Update Goal' : 'Create Goal'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'active', 'achieved', 'missed'].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(status)}
            className="capitalize"
          >
            {status}
          </Button>
        ))}
      </div>

      {/* Goals List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredGoals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">No goals found. Set your first growth goal!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredGoals.map((goal) => {
            const progress = goal.target_value > 0 ? Math.min((goal.current_value / goal.target_value) * 100, 100) : 0;
            const TrendIcon = trendIcons[goal.trend] || Minus;
            const trendColor = goal.trend === 'up' ? 'text-green-500' : goal.trend === 'down' ? 'text-red-500' : 'text-muted-foreground';
            
            return (
              <Card key={goal.id}>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className={categoryConfig[goal.category]?.color}>
                          {categoryConfig[goal.category]?.label}
                        </Badge>
                        <Badge className={statusConfig[goal.status]?.color}>
                          {statusConfig[goal.status]?.label}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg">{goal.title}</h3>
                    </div>
                    <TrendIcon className={`h-5 w-5 ${trendColor}`} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {goal.current_value.toLocaleString()} / {goal.target_value.toLocaleString()} {goal.unit}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-right">{progress.toFixed(1)}% complete</p>
                  </div>

                  {goal.due_date && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Due {format(new Date(goal.due_date), 'MMM d, yyyy')}</span>
                    </div>
                  )}

                  {goal.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{goal.notes}</p>
                  )}

                  <div className="flex gap-2 pt-2">
                    {goal.status === 'active' && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => handleMarkAchieved(goal)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Mark Achieved
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(goal)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteGoal.mutate(goal.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
