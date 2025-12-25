import { PrismaClient, TaskStatus, TaskPriority } from '@prisma/client';

let prisma: PrismaClient = new PrismaClient();

// Allow dependency injection for testing
export function setPrismaInstance(instance: PrismaClient) {
  prisma = instance;
}

export interface WorkspaceTaskStats {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  reviewRequired: number;
  blocked: number;
  overdue: number;
  completionRate: number;
}

export interface TeamActivityMetrics {
  totalMembers: number;
  activeMembers: number;
  membersByRole: Record<string, number>;
  taskAssignmentDistribution: Array<{
    memberId: string;
    memberName: string;
    role: string;
    assignedTasks: number;
    completedTasks: number;
    overdueTasks: number;
    completionRate: number;
  }>;
}

export interface WorkspaceHealthIndicators {
  overdueTasks: number;
  blockedTasks: number;
  unassignedTasks: number;
  criticalDeadlines: number; // Tasks due within 24 hours
  bottlenecks: Array<{
    type: 'MEMBER_OVERLOAD' | 'DEPENDENCY_CHAIN' | 'BLOCKED_CRITICAL';
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    affectedTasks: string[];
  }>;
  healthScore: number; // 0-100
}

export interface WorkloadDistribution {
  byMember: Array<{
    memberId: string;
    memberName: string;
    role: string;
    totalTasks: number;
    activeTasks: number;
    workloadPercentage: number;
    capacityStatus: 'UNDERUTILIZED' | 'OPTIMAL' | 'OVERLOADED';
  }>;
  byCategory: Array<{
    category: string;
    taskCount: number;
    completedCount: number;
    percentage: number;
  }>;
  byPriority: Array<{
    priority: string;
    taskCount: number;
    completedCount: number;
    percentage: number;
  }>;
}

export interface CollaborationPatterns {
  communicationFrequency: Array<{
    date: string;
    messageCount: number;
    activeMembers: number;
  }>;
  taskHandoffs: Array<{
    fromMember: string;
    toMember: string;
    taskCount: number;
  }>;
  crossFunctionalWork: Array<{
    category1: string;
    category2: string;
    collaborationCount: number;
  }>;
}

export interface WorkspaceAnalyticsReport {
  workspaceId: string;
  workspaceName: string;
  eventName: string;
  generatedAt: Date;
  reportPeriod: {
    startDate: Date;
    endDate: Date;
  };
  taskStats: WorkspaceTaskStats;
  teamActivity: TeamActivityMetrics;
  healthIndicators: WorkspaceHealthIndicators;
  workloadDistribution: WorkloadDistribution;
  collaborationPatterns: CollaborationPatterns;
  progressTrends: Array<{
    date: string;
    tasksCompleted: number;
    tasksCreated: number;
    cumulativeCompletion: number;
  }>;
  recommendations: Array<{
    type: 'WORKLOAD_BALANCE' | 'DEADLINE_MANAGEMENT' | 'COMMUNICATION' | 'PROCESS_IMPROVEMENT';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    title: string;
    description: string;
    actionItems: string[];
  }>;
}

export class WorkspaceAnalyticsService {
  /**
   * Get comprehensive workspace analytics
   * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
   */
  async getWorkspaceAnalytics(workspaceId: string, userId: string): Promise<WorkspaceAnalyticsReport> {
    // Verify user has access to workspace
    await this.verifyWorkspaceAccess(workspaceId, userId);

    // Get workspace details
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        event: {
          select: {
            name: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const reportPeriod = {
      startDate: workspace.createdAt,
      endDate: new Date(),
    };

    // Calculate all analytics components
    const [
      taskStats,
      teamActivity,
      healthIndicators,
      workloadDistribution,
      collaborationPatterns,
      progressTrends,
    ] = await Promise.all([
      this.calculateTaskStats(workspaceId),
      this.calculateTeamActivity(workspaceId),
      this.calculateHealthIndicators(workspaceId),
      this.calculateWorkloadDistribution(workspaceId),
      this.calculateCollaborationPatterns(workspaceId, reportPeriod),
      this.calculateProgressTrends(workspaceId, reportPeriod),
    ]);

    // Generate recommendations based on analytics
    const recommendations = this.generateRecommendations({
      taskStats,
      teamActivity,
      healthIndicators,
      workloadDistribution,
    });

    return {
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      eventName: workspace.event.name,
      generatedAt: new Date(),
      reportPeriod,
      taskStats,
      teamActivity,
      healthIndicators,
      workloadDistribution,
      collaborationPatterns,
      progressTrends,
      recommendations,
    };
  }

  /**
   * Calculate task statistics
   * Requirements: 8.1
   */
  async calculateTaskStats(workspaceId: string): Promise<WorkspaceTaskStats> {
    const tasks = await prisma.workspaceTask.findMany({
      where: { workspaceId },
    });

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const notStarted = tasks.filter(t => t.status === TaskStatus.NOT_STARTED).length;
    const reviewRequired = tasks.filter(t => t.status === TaskStatus.REVIEW_REQUIRED).length;
    const blocked = tasks.filter(t => t.status === TaskStatus.BLOCKED).length;

    // Calculate overdue tasks
    const now = new Date();
    const overdue = tasks.filter(t => 
      t.dueDate && 
      new Date(t.dueDate) < now && 
      t.status !== TaskStatus.COMPLETED
    ).length;

    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      completed,
      inProgress,
      notStarted,
      reviewRequired,
      blocked,
      overdue,
      completionRate,
    };
  }

  /**
   * Calculate team activity metrics
   * Requirements: 8.2
   */
  async calculateTeamActivity(workspaceId: string): Promise<TeamActivityMetrics> {
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        workspaceId,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const totalMembers = teamMembers.length;
    
    // Calculate members by role
    const membersByRole: Record<string, number> = {};
    teamMembers.forEach(member => {
      membersByRole[member.role] = (membersByRole[member.role] || 0) + 1;
    });

    // Calculate task assignment distribution
    const taskAssignmentDistribution = await Promise.all(
      teamMembers.map(async (member) => {
        const assignedTasks = await prisma.workspaceTask.findMany({
          where: {
            workspaceId,
            assigneeId: member.id,
          },
        });

        const completedTasks = assignedTasks.filter(t => t.status === TaskStatus.COMPLETED);
        const overdueTasks = assignedTasks.filter(t => 
          t.dueDate && 
          new Date(t.dueDate) < new Date() && 
          t.status !== TaskStatus.COMPLETED
        );

        const completionRate = assignedTasks.length > 0 
          ? (completedTasks.length / assignedTasks.length) * 100 
          : 0;

        return {
          memberId: member.id,
          memberName: member.user.name,
          role: member.role,
          assignedTasks: assignedTasks.length,
          completedTasks: completedTasks.length,
          overdueTasks: overdueTasks.length,
          completionRate,
        };
      })
    );

    // Calculate active members (those with recent activity)
    const recentActivityThreshold = new Date();
    recentActivityThreshold.setDate(recentActivityThreshold.getDate() - 7);

    const recentTaskUpdates = await prisma.workspaceTask.findMany({
      where: {
        workspaceId,
        updatedAt: { gte: recentActivityThreshold },
      },
      select: { assigneeId: true },
    });

    const activeMemberIds = new Set(
      recentTaskUpdates
        .filter(t => t.assigneeId)
        .map(t => t.assigneeId!)
    );

    return {
      totalMembers,
      activeMembers: activeMemberIds.size,
      membersByRole,
      taskAssignmentDistribution,
    };
  }

  /**
   * Calculate workspace health indicators
   * Requirements: 8.3
   */
  async calculateHealthIndicators(workspaceId: string): Promise<WorkspaceHealthIndicators> {
    const tasks = await prisma.workspaceTask.findMany({
      where: { workspaceId },
      include: {
        assignee: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
    });

    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Calculate basic indicators
    const overdueTasks = tasks.filter(t => 
      t.dueDate && 
      new Date(t.dueDate) < now && 
      t.status !== TaskStatus.COMPLETED
    ).length;

    const blockedTasks = tasks.filter(t => t.status === TaskStatus.BLOCKED).length;
    const unassignedTasks = tasks.filter(t => !t.assigneeId).length;
    
    const criticalDeadlines = tasks.filter(t => 
      t.dueDate && 
      new Date(t.dueDate) <= tomorrow && 
      t.status !== TaskStatus.COMPLETED
    ).length;

    // Identify bottlenecks
    const bottlenecks = await this.identifyBottlenecks(workspaceId, tasks);

    // Calculate health score (0-100)
    const totalTasks = tasks.length;
    let healthScore = 100;

    if (totalTasks > 0) {
      // Deduct points for various issues
      healthScore -= (overdueTasks / totalTasks) * 30; // Max 30 points for overdue
      healthScore -= (blockedTasks / totalTasks) * 25; // Max 25 points for blocked
      healthScore -= (unassignedTasks / totalTasks) * 20; // Max 20 points for unassigned
      healthScore -= (criticalDeadlines / totalTasks) * 15; // Max 15 points for critical deadlines
      healthScore -= bottlenecks.length * 5; // 5 points per bottleneck
    }

    healthScore = Math.max(0, Math.round(healthScore));

    return {
      overdueTasks,
      blockedTasks,
      unassignedTasks,
      criticalDeadlines,
      bottlenecks,
      healthScore,
    };
  }

  /**
   * Calculate workload distribution
   * Requirements: 8.4
   */
  async calculateWorkloadDistribution(workspaceId: string): Promise<WorkloadDistribution> {
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        workspaceId,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    const tasks = await prisma.workspaceTask.findMany({
      where: { workspaceId },
    });

    // Calculate workload by member
    const byMember = teamMembers.map(member => {
      const memberTasks = tasks.filter(t => t.assigneeId === member.id);
      const activeTasks = memberTasks.filter(t => 
        t.status === TaskStatus.IN_PROGRESS || 
        t.status === TaskStatus.NOT_STARTED ||
        t.status === TaskStatus.REVIEW_REQUIRED
      );

      const totalTasks = memberTasks.length;
      const maxRecommendedTasks = 10; // Configurable threshold
      const workloadPercentage = (totalTasks / maxRecommendedTasks) * 100;

      let capacityStatus: 'UNDERUTILIZED' | 'OPTIMAL' | 'OVERLOADED';
      if (workloadPercentage < 50) {
        capacityStatus = 'UNDERUTILIZED';
      } else if (workloadPercentage <= 100) {
        capacityStatus = 'OPTIMAL';
      } else {
        capacityStatus = 'OVERLOADED';
      }

      return {
        memberId: member.id,
        memberName: member.user.name,
        role: member.role,
        totalTasks,
        activeTasks: activeTasks.length,
        workloadPercentage: Math.min(workloadPercentage, 200), // Cap at 200%
        capacityStatus,
      };
    });

    // Calculate distribution by category
    const categoryStats: Record<string, { total: number; completed: number }> = {};
    tasks.forEach(task => {
      if (!categoryStats[task.category]) {
        categoryStats[task.category] = { total: 0, completed: 0 };
      }
      categoryStats[task.category].total++;
      if (task.status === TaskStatus.COMPLETED) {
        categoryStats[task.category].completed++;
      }
    });

    const byCategory = Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      taskCount: stats.total,
      completedCount: stats.completed,
      percentage: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
    }));

    // Calculate distribution by priority
    const priorityStats: Record<string, { total: number; completed: number }> = {};
    tasks.forEach(task => {
      if (!priorityStats[task.priority]) {
        priorityStats[task.priority] = { total: 0, completed: 0 };
      }
      priorityStats[task.priority].total++;
      if (task.status === TaskStatus.COMPLETED) {
        priorityStats[task.priority].completed++;
      }
    });

    const byPriority = Object.entries(priorityStats).map(([priority, stats]) => ({
      priority,
      taskCount: stats.total,
      completedCount: stats.completed,
      percentage: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
    }));

    return {
      byMember,
      byCategory,
      byPriority,
    };
  }

  /**
   * Calculate collaboration patterns
   * Requirements: 8.2
   */
  async calculateCollaborationPatterns(
    workspaceId: string, 
    reportPeriod: { startDate: Date; endDate: Date }
  ): Promise<CollaborationPatterns> {
    // Get communication frequency (placeholder - would need message data)
    const communicationFrequency = await this.calculateCommunicationFrequency(workspaceId, reportPeriod);

    // Calculate task handoffs (tasks reassigned between members)
    const taskHandoffs = await this.calculateTaskHandoffs(workspaceId);

    // Calculate cross-functional work (tasks involving multiple categories)
    const crossFunctionalWork = await this.calculateCrossFunctionalWork(workspaceId);

    return {
      communicationFrequency,
      taskHandoffs,
      crossFunctionalWork,
    };
  }

  /**
   * Calculate progress trends over time
   * Requirements: 8.1
   */
  async calculateProgressTrends(
    workspaceId: string,
    reportPeriod: { startDate: Date; endDate: Date }
  ): Promise<Array<{
    date: string;
    tasksCompleted: number;
    tasksCreated: number;
    cumulativeCompletion: number;
  }>> {
    const tasks = await prisma.workspaceTask.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'asc' },
    });

    // Group tasks by date
    const dateMap = new Map<string, { created: number; completed: number }>();
    
    // Initialize date range
    const currentDate = new Date(reportPeriod.startDate);
    while (currentDate <= reportPeriod.endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dateMap.set(dateStr, { created: 0, completed: 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Count task creation and completion by date
    tasks.forEach(task => {
      const createdDate = task.createdAt.toISOString().split('T')[0];
      if (dateMap.has(createdDate)) {
        dateMap.get(createdDate)!.created++;
      }

      if (task.completedAt) {
        const completedDate = task.completedAt.toISOString().split('T')[0];
        if (dateMap.has(completedDate)) {
          dateMap.get(completedDate)!.completed++;
        }
      }
    });

    // Convert to array with cumulative completion
    let cumulativeCompletion = 0;
    return Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => {
        cumulativeCompletion += stats.completed;
        return {
          date,
          tasksCompleted: stats.completed,
          tasksCreated: stats.created,
          cumulativeCompletion,
        };
      });
  }

  /**
   * Generate recommendations based on analytics
   * Requirements: 8.5
   */
  private generateRecommendations(analytics: {
    taskStats: WorkspaceTaskStats;
    teamActivity: TeamActivityMetrics;
    healthIndicators: WorkspaceHealthIndicators;
    workloadDistribution: WorkloadDistribution;
  }): Array<{
    type: 'WORKLOAD_BALANCE' | 'DEADLINE_MANAGEMENT' | 'COMMUNICATION' | 'PROCESS_IMPROVEMENT';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    title: string;
    description: string;
    actionItems: string[];
  }> {
    const recommendations = [];

    // Workload balance recommendations
    const overloadedMembers = analytics.workloadDistribution.byMember.filter(
      m => m.capacityStatus === 'OVERLOADED'
    );
    // Check for underutilized members (could be used for future recommendations)
    // const underutilizedMembers = analytics.workloadDistribution.byMember.filter(
    //   m => m.capacityStatus === 'UNDERUTILIZED'
    // );

    if (overloadedMembers.length > 0) {
      recommendations.push({
        type: 'WORKLOAD_BALANCE' as const,
        priority: 'HIGH' as const,
        title: 'Address Team Member Overload',
        description: `${overloadedMembers.length} team members are overloaded with tasks`,
        actionItems: [
          'Redistribute tasks from overloaded members',
          'Consider extending deadlines for non-critical tasks',
          'Recruit additional team members if needed',
          'Prioritize tasks and defer lower-priority items',
        ],
      });
    }

    // Deadline management recommendations
    if (analytics.healthIndicators.overdueTasks > 0) {
      recommendations.push({
        type: 'DEADLINE_MANAGEMENT' as const,
        priority: 'HIGH' as const,
        title: 'Address Overdue Tasks',
        description: `${analytics.healthIndicators.overdueTasks} tasks are overdue`,
        actionItems: [
          'Review and update overdue task deadlines',
          'Reassign tasks if current assignees are unavailable',
          'Break down large overdue tasks into smaller chunks',
          'Implement daily standup meetings for accountability',
        ],
      });
    }

    // Communication recommendations
    if (analytics.teamActivity.activeMembers / analytics.teamActivity.totalMembers < 0.7) {
      recommendations.push({
        type: 'COMMUNICATION' as const,
        priority: 'MEDIUM' as const,
        title: 'Improve Team Engagement',
        description: 'Less than 70% of team members are actively participating',
        actionItems: [
          'Schedule regular team check-ins',
          'Create more engaging communication channels',
          'Recognize and celebrate team contributions',
          'Provide clear task assignments and expectations',
        ],
      });
    }

    // Process improvement recommendations
    if (analytics.taskStats.completionRate < 50) {
      recommendations.push({
        type: 'PROCESS_IMPROVEMENT' as const,
        priority: 'MEDIUM' as const,
        title: 'Improve Task Completion Rate',
        description: `Task completion rate is ${analytics.taskStats.completionRate.toFixed(1)}%`,
        actionItems: [
          'Review task complexity and break down large tasks',
          'Provide better task descriptions and acceptance criteria',
          'Implement task templates for common activities',
          'Set up automated deadline reminders',
        ],
      });
    }

    return recommendations;
  }

  /**
   * Identify bottlenecks in the workspace
   */
  private async identifyBottlenecks(_workspaceId: string, tasks: any[]): Promise<Array<{
    type: 'MEMBER_OVERLOAD' | 'DEPENDENCY_CHAIN' | 'BLOCKED_CRITICAL';
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    affectedTasks: string[];
  }>> {
    const bottlenecks: Array<{
      type: 'MEMBER_OVERLOAD' | 'DEPENDENCY_CHAIN' | 'BLOCKED_CRITICAL';
      description: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH';
      affectedTasks: string[];
    }> = [];

    // Check for member overload
    const tasksByAssignee = new Map<string, any[]>();
    tasks.forEach(task => {
      if (task.assigneeId) {
        if (!tasksByAssignee.has(task.assigneeId)) {
          tasksByAssignee.set(task.assigneeId, []);
        }
        tasksByAssignee.get(task.assigneeId)!.push(task);
      }
    });

    for (const [_assigneeId, assigneeTasks] of tasksByAssignee.entries()) {
      const activeTasks = assigneeTasks.filter(t => 
        t.status !== TaskStatus.COMPLETED
      );
      
      if (activeTasks.length > 8) { // Threshold for overload
        const memberName = assigneeTasks[0]?.assignee?.user?.name || 'Unknown';
        const severity: 'LOW' | 'MEDIUM' | 'HIGH' = activeTasks.length > 12 ? 'HIGH' : 'MEDIUM';
        bottlenecks.push({
          type: 'MEMBER_OVERLOAD' as const,
          description: `${memberName} has ${activeTasks.length} active tasks`,
          severity,
          affectedTasks: activeTasks.map(t => t.id),
        });
      }
    }

    // Check for blocked critical tasks
    const blockedCriticalTasks = tasks.filter(t => 
      t.status === TaskStatus.BLOCKED && 
      (t.priority === TaskPriority.HIGH || t.priority === TaskPriority.URGENT)
    );

    if (blockedCriticalTasks.length > 0) {
      bottlenecks.push({
        type: 'BLOCKED_CRITICAL' as const,
        description: `${blockedCriticalTasks.length} high-priority tasks are blocked`,
        severity: 'HIGH' as const,
        affectedTasks: blockedCriticalTasks.map(t => t.id),
      });
    }

    return bottlenecks;
  }

  /**
   * Calculate communication frequency (placeholder implementation)
   */
  private async calculateCommunicationFrequency(
    _workspaceId: string,
    reportPeriod: { startDate: Date; endDate: Date }
  ): Promise<Array<{ date: string; messageCount: number; activeMembers: number }>> {
    // This would integrate with the communication service
    // For now, return placeholder data
    const days = Math.ceil(
      (reportPeriod.endDate.getTime() - reportPeriod.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return Array.from({ length: Math.min(days, 30) }, (_, i) => {
      const date = new Date(reportPeriod.startDate);
      date.setDate(date.getDate() + i);
      
      return {
        date: date.toISOString().split('T')[0],
        messageCount: Math.floor(Math.random() * 20), // Placeholder
        activeMembers: Math.floor(Math.random() * 5) + 1, // Placeholder
      };
    });
  }

  /**
   * Calculate task handoffs between team members
   */
  private async calculateTaskHandoffs(_workspaceId: string): Promise<Array<{
    fromMember: string;
    toMember: string;
    taskCount: number;
  }>> {
    // This would require tracking task assignment history
    // For now, return empty array as this feature would need additional database schema
    return [];
  }

  /**
   * Calculate cross-functional work patterns
   */
  private async calculateCrossFunctionalWork(_workspaceId: string): Promise<Array<{
    category1: string;
    category2: string;
    collaborationCount: number;
  }>> {
    // This would analyze tasks that span multiple categories or involve multiple team members
    // For now, return placeholder data
    return [
      { category1: 'TECHNICAL', category2: 'MARKETING', collaborationCount: 3 },
      { category1: 'LOGISTICS', category2: 'REGISTRATION', collaborationCount: 5 },
    ];
  }

  /**
   * Verify user has access to workspace
   */
  private async verifyWorkspaceAccess(workspaceId: string, userId: string): Promise<void> {
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        workspaceId,
        userId,
      },
    });

    if (!teamMember) {
      throw new Error('Access denied: User is not a member of this workspace');
    }
  }
}

export const workspaceAnalyticsService = new WorkspaceAnalyticsService();