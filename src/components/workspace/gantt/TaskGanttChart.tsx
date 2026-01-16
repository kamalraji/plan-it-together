import { useRef, useState, useCallback } from 'react';
import { WorkspaceTask, TeamMember, TaskStatus } from '@/types';
import { useGanttChart } from '@/hooks/useGanttChart';
import { GanttTimelineHeader } from './GanttTimelineHeader';
import { GanttTaskRow } from './GanttTaskRow';
import { GanttDependencyLines } from './GanttDependencyLines';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronDown, Diamond } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface TaskGanttChartProps {
  tasks: WorkspaceTask[];
  teamMembers?: TeamMember[];
  workspaceId: string;
  onTaskClick?: (task: WorkspaceTask) => void;
}

const ROW_HEIGHT = 44;
const TASK_LIST_WIDTH = 280;

export function TaskGanttChart({ 
  tasks, 
  teamMembers, 
  workspaceId, 
  onTaskClick 
}: TaskGanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingTask, setDraggingTask] = useState<string | null>(null);

  const {
    viewMode,
    setViewMode,
    expandedCategories,
    toggleCategory,
    timelineRange,
    timelineHeaders,
    dayWidth,
    totalDays,
    todayPosition,
    groupedTasks,
    taskRowMap,
    scrollToToday,
    handleTaskDrag,
    handleMilestoneCreate,
    isDrawingDependency,
    dependencySource,
    startDependencyDraw,
    completeDependencyDraw,
    cancelDependencyDraw,
  } = useGanttChart({ tasks, workspaceId });

  const handleScrollToToday = useCallback(() => {
    scrollToToday(containerRef);
  }, [scrollToToday]);

  // Calculate total rows for height
  let totalRows = 0;
  groupedTasks.forEach((categoryTasks, category) => {
    totalRows += 1; // Category header
    if (expandedCategories.has(category)) {
      totalRows += categoryTasks.length;
    }
  });

  const timelineWidth = totalDays * dayWidth;

  return (
    <div className="flex flex-col h-full border border-border rounded-xl overflow-hidden bg-card">
      {/* Timeline Controls */}
      <GanttTimelineHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onScrollToToday={handleScrollToToday}
        timelineRange={timelineRange}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Task List (Left Panel) */}
        <div 
          className="shrink-0 border-r border-border bg-muted/30"
          style={{ width: TASK_LIST_WIDTH }}
        >
          <div className="h-10 flex items-center px-3 border-b border-border bg-muted/50">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tasks
            </span>
          </div>
          <div className="overflow-y-auto" style={{ height: `calc(100% - 40px)` }}>
            {Array.from(groupedTasks.entries()).map(([category, categoryTasks]) => (
              <div key={category}>
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center gap-2 px-3 h-10 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                >
                  {expandedCategories.has(category) ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span>{category}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {categoryTasks.length}
                  </span>
                </button>

                {/* Tasks in Category */}
                {expandedCategories.has(category) && categoryTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick?.(task)}
                    className={cn(
                      "flex items-center gap-2 px-3 pl-8 h-11 text-sm cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/50",
                      draggingTask === task.id && "bg-primary/10"
                    )}
                  >
                    {task.metadata?.isMilestone ? (
                      <Diamond className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    ) : (
                      <div className={cn(
                        "h-2 w-2 rounded-full shrink-0",
                        task.status === TaskStatus.COMPLETED ? "bg-emerald-500" :
                        task.status === TaskStatus.IN_PROGRESS ? "bg-blue-500" :
                        task.status === TaskStatus.BLOCKED ? "bg-red-500" :
                        "bg-slate-400"
                      )} />
                    )}
                    <span className="truncate">{task.title}</span>
                  </div>
                ))}
              </div>
            ))}
            
            {groupedTasks.size === 0 && (
              <div className="p-6 text-center text-muted-foreground text-sm">
                No tasks to display
              </div>
            )}
          </div>
        </div>

        {/* Timeline (Right Panel) */}
        <ScrollArea className="flex-1" ref={containerRef}>
          <div style={{ width: Math.max(timelineWidth, 800) }}>
            {/* Timeline Header */}
            <div className="h-10 flex border-b border-border bg-muted/50 sticky top-0 z-10">
              {timelineHeaders.map((header, index) => (
                <div
                  key={index}
                  className="flex items-center justify-center text-xs font-medium text-muted-foreground border-r border-border/50"
                  style={{ width: header.width, minWidth: header.width }}
                >
                  {header.label}
                </div>
              ))}
            </div>

            {/* Timeline Grid */}
            <div 
              className="relative"
              style={{ height: totalRows * ROW_HEIGHT }}
              onClick={isDrawingDependency ? cancelDependencyDraw : undefined}
            >
              {/* Today Line */}
              {todayPosition > 0 && todayPosition < timelineWidth && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                  style={{ left: todayPosition }}
                >
                  <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full" />
                </div>
              )}

              {/* Grid Lines */}
              {timelineHeaders.map((header, index) => {
                let offset = 0;
                for (let i = 0; i < index; i++) {
                  offset += timelineHeaders[i].width;
                }
                return (
                  <div
                    key={index}
                    className="absolute top-0 bottom-0 border-l border-border/30"
                    style={{ left: offset }}
                  />
                );
              })}

              {/* Dependency Lines */}
              <GanttDependencyLines
                tasks={tasks}
                timelineStart={timelineRange.start}
                dayWidth={dayWidth}
                rowHeight={ROW_HEIGHT}
                taskRowMap={taskRowMap}
              />

              {/* Task Rows */}
              {(() => {
                let rowIndex = 0;
                const rows: React.ReactNode[] = [];

                groupedTasks.forEach((categoryTasks, category) => {
                  // Category row
                  rows.push(
                    <div
                      key={`category-${category}`}
                      className="absolute left-0 right-0 flex items-center bg-muted/20 border-b border-border/30"
                      style={{ 
                        top: rowIndex * ROW_HEIGHT, 
                        height: ROW_HEIGHT 
                      }}
                    />
                  );
                  rowIndex++;

                  // Task rows
                  if (expandedCategories.has(category)) {
                    categoryTasks.forEach((task) => {
                      rows.push(
                        <GanttTaskRow
                          key={task.id}
                          task={task}
                          timelineStart={timelineRange.start}
                          dayWidth={dayWidth}
                          rowHeight={ROW_HEIGHT}
                          rowIndex={rowIndex}
                          isSelected={false}
                          isDragging={draggingTask === task.id}
                          isDrawingDependency={isDrawingDependency}
                          isDependencySource={dependencySource === task.id}
                          onDragStart={() => setDraggingTask(task.id)}
                          onDragEnd={(newStart, newEnd) => {
                            setDraggingTask(null);
                            handleTaskDrag(task.id, newStart, newEnd);
                          }}
                          onDependencyStart={() => startDependencyDraw(task.id)}
                          onDependencyEnd={() => completeDependencyDraw(task.id)}
                          onClick={() => onTaskClick?.(task)}
                        />
                      );
                      rowIndex++;
                    });
                  }
                });

                return rows;
              })()}
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-blue-500 rounded-sm" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-emerald-500 rounded-sm" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-slate-400 rounded-sm" />
          <span>Not Started</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Diamond className="h-3 w-3 text-amber-500" />
          <span>Milestone</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <div className="w-6 h-0.5 bg-red-500" />
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
