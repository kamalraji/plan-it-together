import { useMemo } from 'react';

interface Subtask {
  id: string;
  status: 'TODO' | 'COMPLETED';
}

interface SubtaskProgress {
  completed: number;
  total: number;
  percentage: number;
  isComplete: boolean;
}

/**
 * Calculate progress based on subtask completion status
 */
export function useSubtaskProgress(subtasks: Subtask[]): SubtaskProgress {
  return useMemo(() => {
    const total = subtasks.length;
    const completed = subtasks.filter(s => s.status === 'COMPLETED').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const isComplete = total > 0 && completed === total;

    return { completed, total, percentage, isComplete };
  }, [subtasks]);
}

/**
 * Pure function version for non-hook contexts
 */
export function calculateSubtaskProgress(subtasks: Subtask[]): SubtaskProgress {
  const total = subtasks.length;
  const completed = subtasks.filter(s => s.status === 'COMPLETED').length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isComplete = total > 0 && completed === total;

  return { completed, total, percentage, isComplete };
}
