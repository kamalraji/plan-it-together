import { useMemo } from 'react';
import { WorkspaceTask } from '@/types';
import { getDependencyLinePoints } from '@/lib/ganttUtils';

interface GanttDependencyLinesProps {
  tasks: WorkspaceTask[];
  timelineStart: Date;
  dayWidth: number;
  rowHeight: number;
  taskRowMap: Map<string, number>;
}

export function GanttDependencyLines({
  tasks,
  timelineStart,
  dayWidth,
  rowHeight,
  taskRowMap,
}: GanttDependencyLinesProps) {
  const taskMap = useMemo(() => {
    const map = new Map<string, WorkspaceTask>();
    tasks.forEach(task => map.set(task.id, task));
    return map;
  }, [tasks]);

  const lines = useMemo(() => {
    const result: React.ReactNode[] = [];
    
    tasks.forEach((task) => {
      if (!task.dependencies || task.dependencies.length === 0) return;
      
      task.dependencies.forEach((depId) => {
        const sourceTask = taskMap.get(depId);
        if (!sourceTask) return;
        
        const line = getDependencyLinePoints(
          sourceTask,
          task,
          timelineStart,
          dayWidth,
          rowHeight,
          taskRowMap
        );
        
        if (!line) return;
        
        // Calculate control points for curved line
        const _midX = (line.x1 + line.x2) / 2;
        const curveOffset = Math.min(Math.abs(line.x2 - line.x1) / 3, 30);
        
        // Determine if dependency is satisfied (source completed)
        const isSatisfied = sourceTask.status === 'COMPLETED';
        const strokeColor = isSatisfied ? '#22c55e' : '#94a3b8';
        
        const pathId = `dep-${sourceTask.id}-${task.id}`;
        
        result.push(
          <g key={pathId}>
            {/* Connection line */}
            <path
              d={`
                M ${line.x1} ${line.y1}
                C ${line.x1 + curveOffset} ${line.y1},
                  ${line.x2 - curveOffset} ${line.y2},
                  ${line.x2} ${line.y2}
              `}
              fill="none"
              stroke={strokeColor}
              strokeWidth={2}
              strokeDasharray={isSatisfied ? undefined : "4 2"}
              className="transition-colors"
            />
            
            {/* Arrow head */}
            <polygon
              points={`
                ${line.x2},${line.y2}
                ${line.x2 - 6},${line.y2 - 4}
                ${line.x2 - 6},${line.y2 + 4}
              `}
              fill={strokeColor}
              className="transition-colors"
            />
            
            {/* Source dot */}
            <circle
              cx={line.x1}
              cy={line.y1}
              r={3}
              fill={strokeColor}
              className="transition-colors"
            />
          </g>
        );
      });
    });
    
    return result;
  }, [tasks, taskMap, timelineStart, dayWidth, rowHeight, taskRowMap]);

  if (lines.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.15" />
        </filter>
      </defs>
      <g filter="url(#drop-shadow)">
        {lines}
      </g>
    </svg>
  );
}
