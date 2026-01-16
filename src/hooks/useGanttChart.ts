import { useState, useMemo, useCallback } from 'react';
import { WorkspaceTask, TaskStatus } from '@/types';
import { 
  GanttViewMode, 
  getTimelineRange, 
  getDayWidth, 
  groupTasksByCategory,
  generateTimelineHeaders,
  calculateDaysBetween
} from '@/lib/ganttUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface UseGanttChartOptions {
  tasks: WorkspaceTask[];
  workspaceId: string;
}

export function useGanttChart({ tasks, workspaceId }: UseGanttChartOptions) {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<GanttViewMode>('week');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isDrawingDependency, setIsDrawingDependency] = useState(false);
  const [dependencySource, setDependencySource] = useState<string | null>(null);

  // Calculate timeline range
  const timelineRange = useMemo(() => 
    getTimelineRange(tasks, viewMode),
    [tasks, viewMode]
  );

  // Generate timeline headers
  const timelineHeaders = useMemo(() => 
    generateTimelineHeaders(timelineRange, viewMode),
    [timelineRange, viewMode]
  );

  // Day width based on view mode
  const dayWidth = useMemo(() => getDayWidth(viewMode), [viewMode]);

  // Total timeline width
  const totalDays = useMemo(() => 
    calculateDaysBetween(timelineRange.start, timelineRange.end),
    [timelineRange]
  );

  // Group tasks by category
  const groupedTasks = useMemo(() => 
    groupTasksByCategory(tasks),
    [tasks]
  );

  // Build task row map for positioning
  const taskRowMap = useMemo(() => {
    const map = new Map<string, number>();
    let rowIndex = 0;
    
    groupedTasks.forEach((categoryTasks, category) => {
      if (!expandedCategories.has(category)) {
        categoryTasks.forEach(task => {
          map.set(task.id, rowIndex);
        });
        rowIndex++;
      } else {
        categoryTasks.forEach(task => {
          map.set(task.id, rowIndex);
          rowIndex++;
        });
      }
    });
    
    return map;
  }, [groupedTasks, expandedCategories]);

  // Scroll to a specific date
  const scrollToDate = useCallback((date: Date, containerRef: React.RefObject<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const daysSinceStart = calculateDaysBetween(timelineRange.start, date);
    const scrollPosition = daysSinceStart * dayWidth - containerRef.current.clientWidth / 2;
    
    containerRef.current.scrollTo({
      left: Math.max(0, scrollPosition),
      behavior: 'smooth',
    });
  }, [timelineRange, dayWidth]);

  // Scroll to today
  const scrollToToday = useCallback((containerRef: React.RefObject<HTMLDivElement>) => {
    scrollToDate(new Date(), containerRef);
  }, [scrollToDate]);

  // Handle task drag (update dates)
  const handleTaskDrag = useCallback(async (
    taskId: string,
    newStartDate: Date,
    newEndDate: Date
  ) => {
    try {
      const { error } = await supabase
        .from('workspace_tasks')
        .update({
          start_date: newStartDate.toISOString(),
          end_date: newEndDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .eq('workspace_id', workspaceId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
      toast.success('Task dates updated');
    } catch (error) {
      console.error('Failed to update task dates:', error);
      toast.error('Failed to update task dates');
    }
  }, [workspaceId, queryClient]);

  // Handle milestone creation
  const handleMilestoneCreate = useCallback(async (
    date: Date,
    title: string
  ) => {
    try {
      const { error } = await supabase
        .from('workspace_tasks')
        .insert({
          workspace_id: workspaceId,
          title,
          description: 'Milestone',
          priority: 'HIGH',
          status: TaskStatus.NOT_STARTED,
          start_date: date.toISOString(),
          end_date: date.toISOString(),
          is_milestone: true,
        });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
      toast.success('Milestone created');
    } catch (error) {
      console.error('Failed to create milestone:', error);
      toast.error('Failed to create milestone');
    }
  }, [workspaceId, queryClient]);

  // Handle dependency creation
  const handleDependencyCreate = useCallback(async (
    fromTaskId: string,
    toTaskId: string
  ) => {
    try {
      // Get the target task's current dependencies
      const { data: targetTask, error: fetchError } = await supabase
        .from('workspace_tasks')
        .select('*')
        .eq('id', toTaskId)
        .single();

      if (fetchError) throw fetchError;

      const currentDeps = ((targetTask as any)?.dependencies || []) as string[];
      if (currentDeps.includes(fromTaskId)) {
        toast.info('Dependency already exists');
        return;
      }

      const { error: updateError } = await supabase
        .from('workspace_tasks')
        .update({
          dependencies: [...currentDeps, fromTaskId],
          updated_at: new Date().toISOString(),
        })
        .eq('id', toTaskId);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
      toast.success('Dependency created');
    } catch (error) {
      console.error('Failed to create dependency:', error);
      toast.error('Failed to create dependency');
    }
  }, [workspaceId, queryClient]);

  // Toggle category expansion
  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  // Start dependency drawing mode
  const startDependencyDraw = useCallback((taskId: string) => {
    setIsDrawingDependency(true);
    setDependencySource(taskId);
  }, []);

  // Complete dependency drawing
  const completeDependencyDraw = useCallback((targetTaskId: string) => {
    if (dependencySource && dependencySource !== targetTaskId) {
      handleDependencyCreate(dependencySource, targetTaskId);
    }
    setIsDrawingDependency(false);
    setDependencySource(null);
  }, [dependencySource, handleDependencyCreate]);

  // Cancel dependency drawing
  const cancelDependencyDraw = useCallback(() => {
    setIsDrawingDependency(false);
    setDependencySource(null);
  }, []);

  // Get today's position
  const todayPosition = useMemo(() => {
    const today = new Date();
    return calculateDaysBetween(timelineRange.start, today) * dayWidth;
  }, [timelineRange, dayWidth]);

  return {
    // View state
    viewMode,
    setViewMode,
    selectedTaskIds,
    setSelectedTaskIds,
    expandedCategories,
    toggleCategory,
    
    // Timeline calculations
    timelineRange,
    timelineHeaders,
    dayWidth,
    totalDays,
    todayPosition,
    
    // Task organization
    groupedTasks,
    taskRowMap,
    
    // Navigation
    scrollToDate,
    scrollToToday,
    
    // Task operations
    handleTaskDrag,
    handleMilestoneCreate,
    handleDependencyCreate,
    
    // Dependency drawing
    isDrawingDependency,
    dependencySource,
    startDependencyDraw,
    completeDependencyDraw,
    cancelDependencyDraw,
  };
}
