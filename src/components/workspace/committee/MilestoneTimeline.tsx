import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Check, Clock, AlertCircle, ChevronRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMilestones, Milestone } from '@/hooks/useCommitteeDashboard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface MilestoneTimelineProps {
  workspaceId: string;
}

const statusConfig = {
  pending: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Pending' },
  in_progress: { icon: ChevronRight, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'In Progress' },
  completed: { icon: Check, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Completed' },
  overdue: { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Overdue' },
};

export function MilestoneTimeline({ workspaceId }: MilestoneTimelineProps) {
  const { milestones, isLoading, createMilestone, updateMilestone, deleteMilestone } = useMilestones(workspaceId);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ title: '', due_date: '' });

  const handleAdd = () => {
    if (!newMilestone.title.trim()) return;
    createMilestone({
      workspace_id: workspaceId,
      title: newMilestone.title,
      description: null,
      due_date: newMilestone.due_date || null,
      completed_at: null,
      status: 'pending',
      sort_order: milestones.length,
    });
    setNewMilestone({ title: '', due_date: '' });
    setShowAddDialog(false);
  };

  const toggleComplete = (milestone: Milestone) => {
    if (milestone.status === 'completed') {
      updateMilestone({ id: milestone.id, status: 'pending', completed_at: null });
    } else {
      updateMilestone({ id: milestone.id, status: 'completed', completed_at: new Date().toISOString() });
    }
  };

  const completedCount = milestones.filter(m => m.status === 'completed').length;
  const progress = milestones.length > 0 ? (completedCount / milestones.length) * 100 : 0;

  if (isLoading) {
    return <div className="animate-pulse h-48 bg-muted rounded-xl" />;
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Milestone Timeline</h3>
          <p className="text-xs text-muted-foreground">
            {completedCount} of {milestones.length} completed
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Milestone</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Milestone title"
                value={newMilestone.title}
                onChange={(e) => setNewMilestone(prev => ({ ...prev, title: e.target.value }))}
              />
              <Input
                type="date"
                value={newMilestone.due_date}
                onChange={(e) => setNewMilestone(prev => ({ ...prev, due_date: e.target.value }))}
              />
              <Button onClick={handleAdd} className="w-full">Add Milestone</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {milestones.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No milestones yet. Add your first milestone to track progress.
          </p>
        ) : (
          <div className="space-y-4">
            {milestones.map((milestone, index) => {
              const config = statusConfig[milestone.status];
              const Icon = config.icon;
              const isLast = index === milestones.length - 1;

              return (
                <div key={milestone.id} className="relative flex gap-4">
                  {/* Timeline line */}
                  {!isLast && (
                    <div className="absolute left-[15px] top-8 w-0.5 h-[calc(100%+1rem)] bg-border" />
                  )}

                  {/* Status icon */}
                  <button
                    onClick={() => toggleComplete(milestone)}
                    className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full ${config.bg} flex items-center justify-center transition-colors hover:opacity-80`}
                  >
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </button>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`font-medium ${milestone.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {milestone.title}
                        </p>
                        {milestone.due_date && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Due: {format(new Date(milestone.due_date), 'MMM d, yyyy')}
                          </p>
                        )}
                        {milestone.completed_at && (
                          <p className="text-xs text-emerald-500 mt-0.5">
                            Completed: {format(new Date(milestone.completed_at), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteMilestone(milestone.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
