/**
 * TaskSummarizer - AI-powered task breakdown and subtask generation
 */
import React, { useState } from 'react';
import { Sparkles, Loader2, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuickAIActions } from '@/hooks/useAIContentAssist';
import { cn } from '@/lib/utils';

interface SuggestedSubtask {
  id: string;
  title: string;
  selected: boolean;
}

interface TaskSummarizerProps {
  taskTitle: string;
  taskDescription: string;
  onAddSubtasks?: (subtasks: string[]) => void;
  className?: string;
}

export const TaskSummarizer: React.FC<TaskSummarizerProps> = ({
  taskTitle,
  taskDescription,
  onAddSubtasks,
  className,
}) => {
  const [suggestedSubtasks, setSuggestedSubtasks] = useState<SuggestedSubtask[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { suggestSubtasks, isLoading } = useQuickAIActions();

  const handleGenerateSubtasks = async () => {
    if (!taskTitle && !taskDescription) return;

    const result = await suggestSubtasks(taskTitle, taskDescription);
    if (result) {
      // Parse the AI response into subtasks
      const lines = result.split('\n').filter((line) => line.trim());
      const parsed: SuggestedSubtask[] = lines
        .map((line, index) => {
          // Remove bullet points, numbers, dashes, etc.
          const cleanedTitle = line
            .replace(/^[\d\.\-\*\•\○\●]\s*/, '')
            .replace(/^\d+[\.\)]\s*/, '')
            .trim();
          return {
            id: `subtask-${index}`,
            title: cleanedTitle,
            selected: true,
          };
        })
        .filter((subtask) => subtask.title.length > 0 && subtask.title.length < 200);

      setSuggestedSubtasks(parsed);
      setIsExpanded(true);
    }
  };

  const toggleSubtask = (id: string) => {
    setSuggestedSubtasks((prev) =>
      prev.map((subtask) =>
        subtask.id === id ? { ...subtask, selected: !subtask.selected } : subtask
      )
    );
  };

  const handleAddSelected = () => {
    const selected = suggestedSubtasks
      .filter((subtask) => subtask.selected)
      .map((subtask) => subtask.title);

    if (onAddSubtasks && selected.length > 0) {
      onAddSubtasks(selected);
      setSuggestedSubtasks([]);
      setIsExpanded(false);
    }
  };

  const handleDismiss = () => {
    setSuggestedSubtasks([]);
    setIsExpanded(false);
  };

  const selectedCount = suggestedSubtasks.filter((s) => s.selected).length;

  if (!isExpanded && suggestedSubtasks.length === 0) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleGenerateSubtasks}
        disabled={isLoading || (!taskTitle && !taskDescription)}
        className={cn('text-muted-foreground hover:text-primary', className)}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            Suggest Subtasks
          </>
        )}
      </Button>
    );
  }

  return (
    <Card className={cn('border-primary/20', className)}>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Suggested Subtasks
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="py-2 px-4">
        <div className="space-y-2">
          {suggestedSubtasks.map((subtask) => (
            <div
              key={subtask.id}
              className={cn(
                'flex items-start gap-3 p-2 rounded-md transition-colors cursor-pointer',
                subtask.selected
                  ? 'bg-primary/5 hover:bg-primary/10'
                  : 'hover:bg-muted/50 opacity-60'
              )}
              onClick={() => toggleSubtask(subtask.id)}
            >
              <Checkbox
                checked={subtask.selected}
                onCheckedChange={() => toggleSubtask(subtask.id)}
                className="mt-0.5"
              />
              <span className="text-sm flex-1">{subtask.title}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <span className="text-xs text-muted-foreground">
            {selectedCount} of {suggestedSubtasks.length} selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDismiss}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddSelected}
              disabled={selectedCount === 0}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add {selectedCount} Subtask{selectedCount !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
