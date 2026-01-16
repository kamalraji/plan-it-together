import { WorkspaceTask, TaskStatus } from '@/types';

export interface DependencyNode {
  id: string;
  task: WorkspaceTask;
  x: number;
  y: number;
  depth: number;
  column: number;
}

export interface DependencyEdge {
  from: string;
  to: string;
  status: 'satisfied' | 'pending' | 'blocked';
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  maxDepth: number;
  maxColumn: number;
}

/**
 * Build adjacency lists for task dependencies
 */
export function buildAdjacencyList(tasks: WorkspaceTask[]): Map<string, string[]> {
  const adjacencyList = new Map<string, string[]>();
  
  tasks.forEach(task => {
    adjacencyList.set(task.id, task.dependencies || []);
  });
  
  return adjacencyList;
}

/**
 * Find all tasks that block a given task (its dependencies)
 */
export function findBlockingTasks(taskId: string, tasks: WorkspaceTask[]): WorkspaceTask[] {
  const task = tasks.find(t => t.id === taskId);
  if (!task || !task.dependencies?.length) return [];
  
  return tasks.filter(t => task.dependencies.includes(t.id));
}

/**
 * Find all tasks blocked by a given task (tasks that depend on it)
 */
export function findBlockedTasks(taskId: string, tasks: WorkspaceTask[]): WorkspaceTask[] {
  return tasks.filter(t => t.dependencies?.includes(taskId));
}

/**
 * Calculate task depth in dependency chain (0 = no dependencies)
 */
export function calculateTaskDepth(
  taskId: string,
  tasks: WorkspaceTask[],
  visited: Set<string> = new Set()
): number {
  if (visited.has(taskId)) return 0; // Circular dependency protection
  visited.add(taskId);
  
  const task = tasks.find(t => t.id === taskId);
  if (!task || !task.dependencies?.length) return 0;
  
  let maxDepth = 0;
  for (const depId of task.dependencies) {
    const depth = calculateTaskDepth(depId, tasks, new Set(visited));
    maxDepth = Math.max(maxDepth, depth + 1);
  }
  
  return maxDepth;
}

/**
 * Detect circular dependencies in the task graph
 */
export function detectCircularDependencies(tasks: WorkspaceTask[]): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];
  
  function dfs(taskId: string): boolean {
    visited.add(taskId);
    recursionStack.add(taskId);
    path.push(taskId);
    
    const task = tasks.find(t => t.id === taskId);
    if (task?.dependencies) {
      for (const depId of task.dependencies) {
        if (!visited.has(depId)) {
          if (dfs(depId)) return true;
        } else if (recursionStack.has(depId)) {
          // Found a cycle
          const cycleStart = path.indexOf(depId);
          cycles.push([...path.slice(cycleStart), depId]);
          return true;
        }
      }
    }
    
    path.pop();
    recursionStack.delete(taskId);
    return false;
  }
  
  for (const task of tasks) {
    if (!visited.has(task.id)) {
      dfs(task.id);
    }
  }
  
  return cycles;
}

/**
 * Find the critical path (longest dependency chain)
 */
export function findCriticalPath(tasks: WorkspaceTask[]): WorkspaceTask[] {
  const tasksWithDeps = tasks.filter(t => t.dependencies?.length || 
    tasks.some(other => other.dependencies?.includes(t.id)));
  
  if (!tasksWithDeps.length) return [];
  
  let longestPath: string[] = [];
  
  function findLongestPathFrom(taskId: string, currentPath: string[]): void {
    const blockedTasks = findBlockedTasks(taskId, tasks);
    
    if (!blockedTasks.length) {
      if (currentPath.length > longestPath.length) {
        longestPath = [...currentPath];
      }
      return;
    }
    
    for (const blocked of blockedTasks) {
      if (!currentPath.includes(blocked.id)) {
        findLongestPathFrom(blocked.id, [...currentPath, blocked.id]);
      }
    }
  }
  
  // Start from tasks with no dependencies
  const rootTasks = tasks.filter(t => !t.dependencies?.length);
  for (const root of rootTasks) {
    findLongestPathFrom(root.id, [root.id]);
  }
  
  return longestPath.map(id => tasks.find(t => t.id === id)!).filter(Boolean);
}

/**
 * Get edge status based on the source task's status
 */
export function getEdgeStatus(fromTask: WorkspaceTask, toTask: WorkspaceTask): DependencyEdge['status'] {
  if (fromTask.status === TaskStatus.COMPLETED) {
    return 'satisfied';
  }
  if (toTask.status === TaskStatus.BLOCKED) {
    return 'blocked';
  }
  return 'pending';
}

/**
 * Calculate graph layout using hierarchical positioning
 */
export function calculateGraphLayout(tasks: WorkspaceTask[]): DependencyGraph {
  const NODE_WIDTH = 200;
  const NODE_HEIGHT = 80;
  const HORIZONTAL_GAP = 80;
  const VERTICAL_GAP = 40;
  
  // Filter to only tasks with dependencies
  const relevantTasks = tasks.filter(t => 
    t.dependencies?.length || tasks.some(other => other.dependencies?.includes(t.id))
  );
  
  if (!relevantTasks.length) {
    return { nodes: [], edges: [], maxDepth: 0, maxColumn: 0 };
  }
  
  // Calculate depths
  const depths = new Map<string, number>();
  relevantTasks.forEach(task => {
    depths.set(task.id, calculateTaskDepth(task.id, tasks));
  });
  
  // Group by depth
  const depthGroups = new Map<number, WorkspaceTask[]>();
  relevantTasks.forEach(task => {
    const depth = depths.get(task.id) || 0;
    if (!depthGroups.has(depth)) {
      depthGroups.set(depth, []);
    }
    depthGroups.get(depth)!.push(task);
  });
  
  const maxDepth = Math.max(...depths.values(), 0);
  let maxColumn = 0;
  
  // Create nodes with positions
  const nodes: DependencyNode[] = [];
  depthGroups.forEach((tasksAtDepth, depth) => {
    maxColumn = Math.max(maxColumn, tasksAtDepth.length - 1);
    tasksAtDepth.forEach((task, column) => {
      nodes.push({
        id: task.id,
        task,
        x: depth * (NODE_WIDTH + HORIZONTAL_GAP),
        y: column * (NODE_HEIGHT + VERTICAL_GAP),
        depth,
        column,
      });
    });
  });
  
  // Create edges
  const edges: DependencyEdge[] = [];
  relevantTasks.forEach(task => {
    if (task.dependencies?.length) {
      task.dependencies.forEach(depId => {
        const fromTask = tasks.find(t => t.id === depId);
        if (fromTask) {
          edges.push({
            from: depId,
            to: task.id,
            status: getEdgeStatus(fromTask, task),
          });
        }
      });
    }
  });
  
  return { nodes, edges, maxDepth, maxColumn };
}

/**
 * Check if a task is blocked by incomplete dependencies
 */
export function isTaskBlocked(task: WorkspaceTask, tasks: WorkspaceTask[]): boolean {
  if (!task.dependencies?.length) return false;
  
  const blockingTasks = findBlockingTasks(task.id, tasks);
  return blockingTasks.some(t => t.status !== TaskStatus.COMPLETED);
}

/**
 * Get blocking status summary for a task
 */
export function getBlockingStatus(task: WorkspaceTask, tasks: WorkspaceTask[]): {
  blockedBy: number;
  blocking: number;
  isBlocked: boolean;
  blockedByCompleted: number;
} {
  const blockingTasks = findBlockingTasks(task.id, tasks);
  const blockedTasks = findBlockedTasks(task.id, tasks);
  const blockedByCompleted = blockingTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  
  return {
    blockedBy: blockingTasks.length,
    blocking: blockedTasks.length,
    isBlocked: blockingTasks.some(t => t.status !== TaskStatus.COMPLETED),
    blockedByCompleted,
  };
}
