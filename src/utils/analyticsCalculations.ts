/**
 * Industrial-standard analytics calculation utilities
 * Used for computing completion time, collaboration scores, and health metrics
 */

interface TaskData {
  id: string;
  status: string;
  created_at: string;
  completed_at?: string | null;
  assigned_to?: string | null;
  due_date?: string | null;
  priority?: string;
}

interface TeamMemberData {
  user_id: string;
  name?: string;
  tasks_completed?: number;
  tasks_assigned?: number;
  comments_made?: number;
  mentions_received?: number;
}

/**
 * Calculate average task completion time in days
 * Only considers tasks that have been completed
 */
export function calculateAverageCompletionTime(tasks: TaskData[]): number {
  const completedTasks = tasks.filter(
    (t) => t.status === 'COMPLETED' && t.created_at && t.completed_at
  );

  if (completedTasks.length === 0) return 0;

  const totalDays = completedTasks.reduce((sum, task) => {
    const createdAt = new Date(task.created_at);
    const completedAt = new Date(task.completed_at!);
    const diffMs = completedAt.getTime() - createdAt.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return sum + Math.max(0, diffDays);
  }, 0);

  return Math.round((totalDays / completedTasks.length) * 10) / 10;
}

/**
 * Calculate completion time by priority
 * Returns breakdown by LOW, MEDIUM, HIGH, URGENT
 */
export function calculateCompletionTimeByPriority(tasks: TaskData[]): Record<string, number> {
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
  const result: Record<string, number> = {};

  priorities.forEach((priority) => {
    const priorityTasks = tasks.filter((t) => t.priority === priority);
    result[priority] = calculateAverageCompletionTime(priorityTasks);
  });

  return result;
}

/**
 * Calculate collaboration score based on team interactions
 * Score ranges from 0-100
 * 
 * Factors considered:
 * - Task distribution evenness (40%)
 * - Cross-assignment patterns (30%)
 * - Activity frequency (30%)
 */
export function calculateCollaborationScore(
  members: TeamMemberData[],
  tasks: TaskData[]
): number {
  if (members.length === 0) return 0;

  // 1. Task distribution evenness (0-40 points)
  const assignedCounts = members.map((m) => {
    return tasks.filter((t) => t.assigned_to === m.user_id).length;
  });
  
  const avgAssigned = assignedCounts.reduce((a, b) => a + b, 0) / members.length;
  const variance = assignedCounts.reduce(
    (sum, count) => sum + Math.pow(count - avgAssigned, 2),
    0
  ) / members.length;
  const stdDev = Math.sqrt(variance);
  const cvScore = avgAssigned > 0 ? Math.max(0, 1 - stdDev / avgAssigned) : 0;
  const distributionScore = cvScore * 40;

  // 2. Cross-assignment patterns (0-30 points)
  // Check how many unique assignees exist
  const uniqueAssignees = new Set(
    tasks.filter((t) => t.assigned_to).map((t) => t.assigned_to)
  ).size;
  const participationRate = members.length > 0 ? uniqueAssignees / members.length : 0;
  const crossAssignmentScore = participationRate * 30;

  // 3. Activity frequency (0-30 points)
  // Based on completion rate and activity patterns
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
  const completionRate = tasks.length > 0 ? completedTasks / tasks.length : 0;
  
  // Activity score considers both completion rate and task volume
  const hasGoodVolume = tasks.length >= members.length * 2;
  const activityMultiplier = hasGoodVolume ? 1 : 0.7;
  const activityScore = completionRate * 30 * activityMultiplier;

  const totalScore = Math.round(distributionScore + crossAssignmentScore + activityScore);
  return Math.min(100, Math.max(0, totalScore));
}

/**
 * Get collaboration score label
 */
export function getCollaborationLabel(score: number): {
  label: string;
  color: 'green' | 'blue' | 'yellow' | 'red';
} {
  if (score >= 80) return { label: 'Excellent', color: 'green' };
  if (score >= 60) return { label: 'Good', color: 'blue' };
  if (score >= 40) return { label: 'Needs Improvement', color: 'yellow' };
  return { label: 'Poor', color: 'red' };
}

/**
 * Calculate velocity trend (tasks completed per week)
 * Returns last 4 weeks of data
 */
export function calculateVelocityTrend(tasks: TaskData[]): Array<{
  week: string;
  completed: number;
  created: number;
}> {
  const now = new Date();
  const weeks: Array<{ week: string; completed: number; created: number }> = [];

  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - i * 7);

    const weekLabel = `Week ${4 - i}`;

    const completedInWeek = tasks.filter((t) => {
      if (!t.completed_at) return false;
      const completedDate = new Date(t.completed_at);
      return completedDate >= weekStart && completedDate < weekEnd;
    }).length;

    const createdInWeek = tasks.filter((t) => {
      const createdDate = new Date(t.created_at);
      return createdDate >= weekStart && createdDate < weekEnd;
    }).length;

    weeks.push({
      week: weekLabel,
      completed: completedInWeek,
      created: createdInWeek,
    });
  }

  return weeks;
}

/**
 * Calculate workload balance score for a team
 * Returns 0-100 where 100 is perfectly balanced
 */
export function calculateWorkloadBalance(
  members: TeamMemberData[],
  tasks: TaskData[]
): number {
  if (members.length <= 1) return 100;

  const workloads = members.map((m) => {
    const assigned = tasks.filter(
      (t) => t.assigned_to === m.user_id && t.status !== 'COMPLETED'
    ).length;
    return assigned;
  });

  const maxWorkload = Math.max(...workloads);
  const minWorkload = Math.min(...workloads);
  const avgWorkload = workloads.reduce((a, b) => a + b, 0) / workloads.length;

  if (maxWorkload === 0) return 100;

  // Score based on how close max is to min
  const spread = maxWorkload - minWorkload;
  const normalizedSpread = avgWorkload > 0 ? spread / avgWorkload : spread;
  const balanceScore = Math.max(0, 100 - normalizedSpread * 25);

  return Math.round(balanceScore);
}

/**
 * Identify team members who may be overloaded
 */
export function identifyOverloadedMembers(
  members: TeamMemberData[],
  tasks: TaskData[],
  threshold = 1.5 // 50% above average
): Array<{ memberId: string; name: string; taskCount: number; percentAboveAvg: number }> {
  const workloads = members.map((m) => ({
    member: m,
    tasks: tasks.filter(
      (t) => t.assigned_to === m.user_id && t.status !== 'COMPLETED'
    ).length,
  }));

  const avgWorkload =
    workloads.reduce((sum, w) => sum + w.tasks, 0) / members.length;

  if (avgWorkload === 0) return [];

  return workloads
    .filter((w) => w.tasks > avgWorkload * threshold)
    .map((w) => ({
      memberId: w.member.user_id,
      name: w.member.name || 'Unknown',
      taskCount: w.tasks,
      percentAboveAvg: Math.round(((w.tasks - avgWorkload) / avgWorkload) * 100),
    }));
}
