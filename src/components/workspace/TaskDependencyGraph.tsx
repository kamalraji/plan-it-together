import { useMemo, useState, useRef, useCallback } from 'react';
import { WorkspaceTask, TaskStatus, TaskPriority } from '@/types';
import { calculateGraphLayout, DependencyNode, DependencyEdge } from '@/lib/taskDependencyGraph';
import { cn } from '@/lib/utils';
import { ZoomIn, ZoomOut, Maximize2, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TaskDependencyGraphProps {
  tasks: WorkspaceTask[];
  selectedTaskId?: string;
  onTaskClick?: (task: WorkspaceTask) => void;
  className?: string;
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 70;
const PADDING = 40;

export function TaskDependencyGraph({
  tasks,
  selectedTaskId,
  onTaskClick,
  className,
}: TaskDependencyGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const graph = useMemo(() => calculateGraphLayout(tasks), [tasks]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'svg') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.2, 2));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.2, 0.4));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return { bg: 'fill-green-100', border: 'stroke-green-500', text: 'text-green-700' };
      case TaskStatus.IN_PROGRESS:
        return { bg: 'fill-blue-100', border: 'stroke-blue-500', text: 'text-blue-700' };
      case TaskStatus.BLOCKED:
        return { bg: 'fill-red-100', border: 'stroke-red-500', text: 'text-red-700' };
      case TaskStatus.REVIEW_REQUIRED:
        return { bg: 'fill-amber-100', border: 'stroke-amber-500', text: 'text-amber-700' };
      default:
        return { bg: 'fill-gray-100', border: 'stroke-gray-400', text: 'text-gray-700' };
    }
  };

  const getPriorityIndicator = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.URGENT:
        return 'fill-red-500';
      case TaskPriority.HIGH:
        return 'fill-orange-500';
      case TaskPriority.MEDIUM:
        return 'fill-blue-500';
      default:
        return 'fill-gray-400';
    }
  };

  const getEdgeColor = (status: DependencyEdge['status']) => {
    switch (status) {
      case 'satisfied':
        return 'stroke-green-500';
      case 'blocked':
        return 'stroke-red-500';
      default:
        return 'stroke-gray-400';
    }
  };

  const renderEdge = (edge: DependencyEdge) => {
    const fromNode = graph.nodes.find(n => n.id === edge.from);
    const toNode = graph.nodes.find(n => n.id === edge.to);
    if (!fromNode || !toNode) return null;

    const x1 = fromNode.x + NODE_WIDTH;
    const y1 = fromNode.y + NODE_HEIGHT / 2;
    const x2 = toNode.x;
    const y2 = toNode.y + NODE_HEIGHT / 2;

    // Bezier curve control points
    const midX = (x1 + x2) / 2;
    const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;

    return (
      <g key={`${edge.from}-${edge.to}`}>
        <path
          d={path}
          fill="none"
          className={cn(getEdgeColor(edge.status), 'transition-colors')}
          strokeWidth={2}
          strokeDasharray={edge.status === 'blocked' ? '6 4' : undefined}
          markerEnd="url(#arrowhead)"
        />
      </g>
    );
  };

  const renderNode = (node: DependencyNode) => {
    const colors = getStatusColor(node.task.status);
    const isSelected = node.task.id === selectedTaskId;

    return (
      <g
        key={node.id}
        transform={`translate(${node.x}, ${node.y})`}
        className="cursor-pointer"
        onClick={() => onTaskClick?.(node.task)}
      >
        {/* Node background */}
        <rect
          width={NODE_WIDTH}
          height={NODE_HEIGHT}
          rx={8}
          className={cn(
            colors.bg,
            colors.border,
            'transition-all',
            isSelected && 'stroke-primary stroke-2'
          )}
          strokeWidth={isSelected ? 2 : 1}
        />
        
        {/* Priority indicator */}
        <circle
          cx={12}
          cy={12}
          r={5}
          className={getPriorityIndicator(node.task.priority)}
        />
        
        {/* Title */}
        <foreignObject x={8} y={20} width={NODE_WIDTH - 16} height={40}>
          <div className="h-full flex items-start">
            <p className={cn('text-xs font-medium line-clamp-2', colors.text)}>
              {node.task.title}
            </p>
          </div>
        </foreignObject>

        {/* Status badge */}
        <foreignObject x={8} y={NODE_HEIGHT - 20} width={NODE_WIDTH - 16} height={16}>
          <div className="flex items-center">
            <span className={cn('text-[10px] uppercase tracking-wide', colors.text)}>
              {node.task.status.replace('_', ' ')}
            </span>
          </div>
        </foreignObject>
      </g>
    );
  };

  const svgWidth = Math.max(
    (graph.maxDepth + 1) * (NODE_WIDTH + 80) + PADDING * 2,
    600
  );
  const svgHeight = Math.max(
    (graph.maxColumn + 1) * (NODE_HEIGHT + 40) + PADDING * 2,
    400
  );

  if (graph.nodes.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-64 bg-muted/30 rounded-lg border border-dashed border-border', className)}>
        <div className="text-center">
          <Move className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No task dependencies to display</p>
          <p className="text-xs text-muted-foreground mt-1">Add dependencies to tasks to see the graph</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden rounded-lg border border-border bg-background', className)}>
      {/* Controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-lg border border-border p-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleResetView}>
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-2 bg-background/80 backdrop-blur-sm rounded-lg border border-border p-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Blocked</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-gray-400" />
          <span>Not Started</span>
        </div>
      </div>

      {/* Graph */}
      <div
        ref={containerRef}
        className={cn('w-full h-[500px] overflow-hidden', isDragging && 'cursor-grabbing')}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
          className="transition-transform"
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                className="fill-gray-500"
              />
            </marker>
          </defs>
          
          <g transform={`translate(${PADDING}, ${PADDING})`}>
            {/* Edges first (behind nodes) */}
            {graph.edges.map(renderEdge)}
            
            {/* Nodes */}
            {graph.nodes.map(renderNode)}
          </g>
        </svg>
      </div>
    </div>
  );
}
