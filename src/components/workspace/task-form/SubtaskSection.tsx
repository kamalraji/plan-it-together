import { useState } from 'react';
import { Check, Plus, X, GripVertical, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { TeamMember } from '@/types';

export interface Subtask {
  id: string;
  title: string;
  status: 'TODO' | 'COMPLETED';
  assignedTo?: string;
}

interface SubtaskSectionProps {
  subtasks: Subtask[];
  onChange: (subtasks: Subtask[]) => void;
  teamMembers?: TeamMember[];
  disabled?: boolean;
}

export function SubtaskSection({ 
  subtasks, 
  onChange, 
  teamMembers = [],
  disabled = false 
}: SubtaskSectionProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const completedCount = subtasks.filter(s => s.status === 'COMPLETED').length;
  const totalCount = subtasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    
    const newSubtask: Subtask = {
      id: `temp-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      status: 'TODO',
    };
    
    onChange([...subtasks, newSubtask]);
    setNewSubtaskTitle('');
  };

  const handleToggleStatus = (id: string) => {
    onChange(
      subtasks.map(s => 
        s.id === id 
          ? { ...s, status: s.status === 'TODO' ? 'COMPLETED' : 'TODO' }
          : s
      )
    );
  };

  const handleRemoveSubtask = (id: string) => {
    onChange(subtasks.filter(s => s.id !== id));
  };

  const handleUpdateTitle = (id: string, title: string) => {
    onChange(
      subtasks.map(s => s.id === id ? { ...s, title } : s)
    );
    setEditingId(null);
  };

  const handleAssignSubtask = (id: string, userId: string) => {
    onChange(
      subtasks.map(s => 
        s.id === id 
          ? { ...s, assignedTo: userId || undefined }
          : s
      )
    );
  };

  const getAssigneeName = (userId?: string) => {
    if (!userId) return null;
    const member = teamMembers.find(m => m.userId === userId);
    return member?.user?.name || 'Assigned';
  };

  return (
    <div className="space-y-3">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Subtasks
          </span>
          {totalCount > 0 && (
            <span className="text-xs text-muted-foreground">
              ({completedCount}/{totalCount})
            </span>
          )}
        </div>
        {totalCount > 0 && (
          <span className="text-xs font-medium text-primary">
            {progressPercent}%
          </span>
        )}
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <Progress value={progressPercent} className="h-1.5" />
      )}

      {/* Subtask list */}
      <div className="space-y-1">
        {subtasks.map((subtask) => (
          <div
            key={subtask.id}
            className={cn(
              "group flex items-center gap-2 p-2 rounded-md border border-border/50 bg-muted/20 transition-colors",
              subtask.status === 'COMPLETED' && "bg-primary/5 border-primary/20",
              !disabled && "hover:bg-muted/40"
            )}
          >
            {/* Drag handle */}
            <GripVertical className="h-3 w-3 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
            
            {/* Checkbox */}
            <button
              type="button"
              onClick={() => !disabled && handleToggleStatus(subtask.id)}
              disabled={disabled}
              className={cn(
                "flex-shrink-0 h-4 w-4 rounded border transition-all",
                subtask.status === 'COMPLETED'
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-muted-foreground/30 hover:border-primary"
              )}
            >
              {subtask.status === 'COMPLETED' && (
                <Check className="h-3 w-3 m-auto" />
              )}
            </button>

            {/* Title */}
            {editingId === subtask.id ? (
              <Input
                autoFocus
                value={subtask.title}
                onChange={(e) => handleUpdateTitle(subtask.id, e.target.value)}
                onBlur={() => setEditingId(null)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setEditingId(null);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                className="h-6 text-xs flex-1 px-1"
              />
            ) : (
              <span
                onClick={() => !disabled && setEditingId(subtask.id)}
                className={cn(
                  "flex-1 text-xs cursor-text truncate",
                  subtask.status === 'COMPLETED' && "line-through text-muted-foreground"
                )}
              >
                {subtask.title}
              </span>
            )}

            {/* Assignee dropdown */}
            {teamMembers.length > 0 && (
              <select
                value={subtask.assignedTo || ''}
                onChange={(e) => handleAssignSubtask(subtask.id, e.target.value)}
                disabled={disabled}
                className="h-6 text-xs px-1 rounded border border-transparent bg-transparent hover:border-border focus:border-ring focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity"
                title="Assign subtask"
              >
                <option value="">Unassigned</option>
                {teamMembers.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.user.name}
                  </option>
                ))}
              </select>
            )}

            {/* Assignee badge (shown when assigned) */}
            {subtask.assignedTo && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                <User className="h-2.5 w-2.5" />
                <span className="truncate max-w-[60px]">
                  {getAssigneeName(subtask.assignedTo)}
                </span>
              </div>
            )}

            {/* Delete button */}
            <button
              type="button"
              onClick={() => handleRemoveSubtask(subtask.id)}
              disabled={disabled}
              className="flex-shrink-0 p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Add subtask input */}
      <div className="flex gap-1.5">
        <Input
          type="text"
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddSubtask();
            }
          }}
          placeholder="Add a subtask..."
          disabled={disabled}
          className="h-8 text-xs flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddSubtask}
          disabled={disabled || !newSubtaskTitle.trim()}
          className="h-8 px-2"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
