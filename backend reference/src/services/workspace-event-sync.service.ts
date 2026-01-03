import { PrismaClient, TaskStatus, TaskPriority, EventStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface EventMilestone {
  id: string;
  name: string;
  description: string;
  dueDate: Date;
  type: 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSE' | 'VENUE_BOOKING' | 'MARKETING_LAUNCH' | 'FINAL_PREPARATIONS' | 'EVENT_START' | 'EVENT_END' | 'POST_EVENT_CLEANUP';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dependencies?: string[];
}

export interface SyncConfiguration {
  autoCreateMilestoneTasks: boolean;
  escalationThresholds: {
    critical: number; // hours before deadline
    high: number;
    medium: number;
  };
  notificationSettings: {
    enableDeadlineAlerts: boolean;
    enableProgressUpdates: boolean;
    enableCriticalEscalation: boolean;
  };
}

export interface WorkspaceProgressIndicator {
  workspaceId: string;
  eventId: string;
  overallProgress: number; // 0-100
  milestoneProgress: Array<{
    milestoneId: string;
    milestoneName: string;
    progress: number;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
    relatedTasks: Array<{
      taskId: string;
      taskTitle: string;
      status: string;
      progress: number;
    }>;
  }>;
  criticalPath: Array<{
    taskId: string;
    taskTitle: string;
    dueDate: Date;
    dependencies: string[];
    slack: number; // days of buffer
  }>;
  riskFactors: Array<{
    type: 'OVERDUE_TASKS' | 'BLOCKED_CRITICAL' | 'RESOURCE_SHORTAGE' | 'DEPENDENCY_DELAY';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    impact: string;
    mitigation: string[];
  }>;
}

export class WorkspaceEventSyncService {
  /**
   * Synchronize workspace tasks with event milestones
   * Requirements: 9.1, 9.2
   */
  async synchronizeWithEventMilestones(
    workspaceId: string, 
    userId: string,
    config?: SyncConfiguration
  ): Promise<void> {
    // Verify user has permission to manage workspace
    await this.verifyWorkspacePermission(workspaceId, userId, 'MANAGE_WORKSPACE');

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        event: true,
        tasks: true,
      },
    });

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Generate event milestones based on event timeline
    const milestones = this.generateEventMilestones(workspace.event);

    // Apply default sync configuration if not provided
    const syncConfig: SyncConfiguration = config || {
      autoCreateMilestoneTasks: true,
      escalationThresholds: {
        critical: 24, // 24 hours
        high: 72, // 3 days
        medium: 168, // 1 week
      },
      notificationSettings: {
        enableDeadlineAlerts: true,
        enableProgressUpdates: true,
        enableCriticalEscalation: true,
      },
    };

    // Align existing tasks with milestones
    await this.alignTasksWithMilestones(workspaceId, milestones, workspace.tasks);

    // Create milestone tasks if configured
    if (syncConfig.autoCreateMilestoneTasks) {
      await this.createMilestoneTasks(workspaceId, milestones, workspace.tasks);
    }

    // Set up deadline escalation
    await this.setupDeadlineEscalation(workspaceId, syncConfig);

    // Update workspace progress indicators
    await this.updateWorkspaceProgressIndicators(workspaceId);
  }

  /**
   * Handle event updates and propagate changes to workspace
   * Requirements: 9.3
   */
  async handleEventUpdate(eventId: string, changes: any): Promise<void> {
    const workspaces = await prisma.workspace.findMany({
      where: { eventId },
      include: {
        tasks: true,
        teamMembers: {
          where: { status: 'ACTIVE' },
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    for (const workspace of workspaces) {
      await this.propagateEventChanges(workspace, changes);
    }
  }

  /**
   * Get workspace progress indicators for event dashboard
   * Requirements: 9.5
   */
  async getWorkspaceProgressIndicators(
    workspaceId: string, 
    userId: string
  ): Promise<WorkspaceProgressIndicator> {
    // Verify user has access to workspace
    await this.verifyWorkspaceAccess(workspaceId, userId);

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        event: true,
        tasks: {
          include: {
            assignee: {
              include: {
                user: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Generate event milestones
    const milestones = this.generateEventMilestones(workspace.event);

    // Calculate overall progress
    const totalTasks = workspace.tasks.length;
    const completedTasks = workspace.tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const overallProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate milestone progress
    const milestoneProgress = milestones.map(milestone => {
      const relatedTasks = this.getTasksForMilestone(workspace.tasks, milestone);
      const completedRelatedTasks = relatedTasks.filter(t => t.status === TaskStatus.COMPLETED);
      const progress = relatedTasks.length > 0 
        ? (completedRelatedTasks.length / relatedTasks.length) * 100 
        : 0;

      let status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
      if (progress === 100) {
        status = 'COMPLETED';
      } else if (progress > 0) {
        status = 'IN_PROGRESS';
      } else if (new Date() > milestone.dueDate) {
        status = 'OVERDUE';
      } else {
        status = 'NOT_STARTED';
      }

      return {
        milestoneId: milestone.id,
        milestoneName: milestone.name,
        progress,
        status,
        relatedTasks: relatedTasks.map(task => ({
          taskId: task.id,
          taskTitle: task.title,
          status: task.status,
          progress: task.progress,
        })),
      };
    });

    // Calculate critical path
    const criticalPath = this.calculateCriticalPath(workspace.tasks, milestones);

    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(workspace.tasks, milestones);

    return {
      workspaceId: workspace.id,
      eventId: workspace.eventId,
      overallProgress,
      milestoneProgress,
      criticalPath,
      riskFactors,
    };
  }

  /**
   * Escalate critical deadlines
   * Requirements: 9.4
   */
  async escalateCriticalDeadlines(workspaceId: string): Promise<void> {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        tasks: {
          include: {
            assignee: {
              include: {
                user: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
        },
        teamMembers: {
          where: { status: 'ACTIVE' },
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const now = new Date();
    const criticalThreshold = new Date();
    criticalThreshold.setHours(criticalThreshold.getHours() + 24); // 24 hours

    // Find tasks approaching critical deadlines
    const criticalTasks = workspace.tasks.filter(task => 
      task.dueDate &&
      new Date(task.dueDate) <= criticalThreshold &&
      task.status !== TaskStatus.COMPLETED &&
      (task.priority === TaskPriority.HIGH || task.priority === TaskPriority.URGENT)
    );

    // Send escalation notifications
    for (const task of criticalTasks) {
      await this.sendCriticalDeadlineNotification(workspace, task);
    }

    // Update task priorities if needed
    for (const task of criticalTasks) {
      if (task.priority !== TaskPriority.URGENT) {
        await prisma.workspaceTask.update({
          where: { id: task.id },
          data: { priority: TaskPriority.URGENT },
        });
      }
    }
  }

  /**
   * Generate event milestones based on event timeline
   */
  private generateEventMilestones(event: any): EventMilestone[] {
    const milestones: EventMilestone[] = [];
    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);

    // Registration milestones
    if (event.registrationDeadline) {
      const regDeadline = new Date(event.registrationDeadline);
      
      milestones.push({
        id: 'registration-open',
        name: 'Registration Opens',
        description: 'Event registration is live and accepting participants',
        dueDate: new Date(event.createdAt),
        type: 'REGISTRATION_OPEN',
        priority: 'HIGH',
      });

      milestones.push({
        id: 'registration-close',
        name: 'Registration Closes',
        description: 'Final deadline for event registration',
        dueDate: regDeadline,
        type: 'REGISTRATION_CLOSE',
        priority: 'CRITICAL',
        dependencies: ['registration-open'],
      });
    }

    // Pre-event milestones
    const marketingLaunch = new Date(eventStart);
    marketingLaunch.setDate(marketingLaunch.getDate() - 30); // 30 days before

    milestones.push({
      id: 'marketing-launch',
      name: 'Marketing Campaign Launch',
      description: 'Begin promotional activities and outreach',
      dueDate: marketingLaunch,
      type: 'MARKETING_LAUNCH',
      priority: 'HIGH',
    });

    const venueBooking = new Date(eventStart);
    venueBooking.setDate(venueBooking.getDate() - 14); // 2 weeks before

    milestones.push({
      id: 'venue-booking',
      name: 'Venue Confirmation',
      description: 'Finalize venue arrangements and logistics',
      dueDate: venueBooking,
      type: 'VENUE_BOOKING',
      priority: 'CRITICAL',
    });

    const finalPrep = new Date(eventStart);
    finalPrep.setDate(finalPrep.getDate() - 3); // 3 days before

    milestones.push({
      id: 'final-preparations',
      name: 'Final Preparations',
      description: 'Complete all remaining setup and preparation tasks',
      dueDate: finalPrep,
      type: 'FINAL_PREPARATIONS',
      priority: 'CRITICAL',
      dependencies: ['venue-booking', 'registration-close'],
    });

    // Event milestones
    milestones.push({
      id: 'event-start',
      name: 'Event Begins',
      description: 'Event officially starts',
      dueDate: eventStart,
      type: 'EVENT_START',
      priority: 'CRITICAL',
      dependencies: ['final-preparations'],
    });

    milestones.push({
      id: 'event-end',
      name: 'Event Concludes',
      description: 'Event officially ends',
      dueDate: eventEnd,
      type: 'EVENT_END',
      priority: 'CRITICAL',
      dependencies: ['event-start'],
    });

    // Post-event milestone
    const postEventCleanup = new Date(eventEnd);
    postEventCleanup.setDate(postEventCleanup.getDate() + 7); // 1 week after

    milestones.push({
      id: 'post-event-cleanup',
      name: 'Post-Event Activities',
      description: 'Complete follow-up activities and cleanup',
      dueDate: postEventCleanup,
      type: 'POST_EVENT_CLEANUP',
      priority: 'MEDIUM',
      dependencies: ['event-end'],
    });

    return milestones;
  }

  /**
   * Align existing tasks with event milestones
   */
  private async alignTasksWithMilestones(
    workspaceId: string,
    milestones: EventMilestone[],
    existingTasks: any[]
  ): Promise<void> {
    for (const task of existingTasks) {
      // Find the most appropriate milestone for this task
      const milestone = this.findBestMilestoneForTask(task, milestones);
      
      if (milestone && task.dueDate) {
        const taskDueDate = new Date(task.dueDate);
        const milestoneDueDate = new Date(milestone.dueDate);
        
        // If task is due after milestone, adjust the task deadline
        if (taskDueDate > milestoneDueDate) {
          const adjustedDueDate = new Date(milestoneDueDate);
          adjustedDueDate.setDate(adjustedDueDate.getDate() - 1); // 1 day buffer
          
          await prisma.workspaceTask.update({
            where: { id: task.id },
            data: { 
              dueDate: adjustedDueDate,
              metadata: {
                ...task.metadata,
                alignedMilestone: milestone.id,
                originalDueDate: task.dueDate,
              },
            },
          });
        }
      }
    }
  }

  /**
   * Create milestone tasks if they don't exist
   */
  private async createMilestoneTasks(
    workspaceId: string,
    milestones: EventMilestone[],
    existingTasks: any[]
  ): Promise<void> {
    // Get workspace owner to assign milestone tasks
    const workspaceOwner = await prisma.teamMember.findFirst({
      where: {
        workspaceId,
        role: 'WORKSPACE_OWNER',
        status: 'ACTIVE',
      },
    });

    if (!workspaceOwner) {
      return; // No owner to assign tasks to
    }

    for (const milestone of milestones) {
      // Check if a task already exists for this milestone
      const existingMilestoneTask = existingTasks.find(task => 
        task.metadata?.milestoneId === milestone.id
      );

      if (!existingMilestoneTask) {
        // Create a task for this milestone
        await prisma.workspaceTask.create({
          data: {
            workspaceId,
            title: milestone.name,
            description: milestone.description,
            assigneeId: workspaceOwner.id,
            creatorId: workspaceOwner.id,
            category: this.getCategoryForMilestoneType(milestone.type),
            priority: milestone.priority as TaskPriority,
            dueDate: milestone.dueDate,
            dependencies: milestone.dependencies || [],
            tags: ['milestone', milestone.type.toLowerCase()],
            metadata: {
              milestoneId: milestone.id,
              milestoneType: milestone.type,
              autoGenerated: true,
            },
          },
        });
      }
    }
  }

  /**
   * Set up deadline escalation monitoring
   */
  private async setupDeadlineEscalation(
    workspaceId: string,
    config: SyncConfiguration
  ): Promise<void> {
    // In a production system, this would set up scheduled jobs
    // For now, we'll just log the configuration
    console.log(`Deadline escalation configured for workspace ${workspaceId}:`, {
      thresholds: config.escalationThresholds,
      notifications: config.notificationSettings,
    });
  }

  /**
   * Update workspace progress indicators
   */
  private async updateWorkspaceProgressIndicators(workspaceId: string): Promise<void> {
    // This would update cached progress indicators
    // For now, we'll just log the update
    console.log(`Progress indicators updated for workspace ${workspaceId}`);
  }

  /**
   * Propagate event changes to workspace tasks
   */
  private async propagateEventChanges(workspace: any, changes: any): Promise<void> {
    const affectedTasks = [];

    // Handle event date changes
    if (changes.startDate || changes.endDate) {
      // Regenerate milestones with new dates
      const newMilestones = this.generateEventMilestones({
        ...workspace.event,
        ...changes,
      });

      // Update task deadlines based on new milestones
      for (const task of workspace.tasks) {
        if (task.metadata?.alignedMilestone) {
          const milestone = newMilestones.find(m => m.id === task.metadata.alignedMilestone);
          if (milestone) {
            const newDueDate = new Date(milestone.dueDate);
            newDueDate.setDate(newDueDate.getDate() - 1); // 1 day buffer

            await prisma.workspaceTask.update({
              where: { id: task.id },
              data: { dueDate: newDueDate },
            });

            affectedTasks.push(task);
          }
        }
      }
    }

    // Notify team members of changes
    if (affectedTasks.length > 0) {
      await this.notifyTeamOfEventChanges(workspace, changes, affectedTasks);
    }
  }

  /**
   * Find the best milestone for a task based on category and timing
   */
  private findBestMilestoneForTask(task: any, milestones: EventMilestone[]): EventMilestone | null {
    // Map task categories to milestone types
    const categoryMilestoneMap: Record<string, string[]> = {
      SETUP: ['VENUE_BOOKING', 'FINAL_PREPARATIONS'],
      MARKETING: ['MARKETING_LAUNCH', 'REGISTRATION_OPEN'],
      LOGISTICS: ['VENUE_BOOKING', 'FINAL_PREPARATIONS'],
      TECHNICAL: ['FINAL_PREPARATIONS', 'EVENT_START'],
      REGISTRATION: ['REGISTRATION_OPEN', 'REGISTRATION_CLOSE'],
      POST_EVENT: ['POST_EVENT_CLEANUP'],
    };

    const relevantMilestoneTypes = categoryMilestoneMap[task.category] || [];
    const relevantMilestones = milestones.filter(m => 
      relevantMilestoneTypes.includes(m.type)
    );

    if (relevantMilestones.length === 0) {
      return null;
    }

    // Return the milestone with the closest due date to the task
    if (task.dueDate) {
      const taskDueDate = new Date(task.dueDate);
      return relevantMilestones.reduce((closest, current) => {
        const closestDiff = Math.abs(new Date(closest.dueDate).getTime() - taskDueDate.getTime());
        const currentDiff = Math.abs(new Date(current.dueDate).getTime() - taskDueDate.getTime());
        return currentDiff < closestDiff ? current : closest;
      });
    }

    return relevantMilestones[0];
  }

  /**
   * Get task category for milestone type
   */
  private getCategoryForMilestoneType(type: string): string {
    const typeMap: Record<string, string> = {
      REGISTRATION_OPEN: 'REGISTRATION',
      REGISTRATION_CLOSE: 'REGISTRATION',
      VENUE_BOOKING: 'LOGISTICS',
      MARKETING_LAUNCH: 'MARKETING',
      FINAL_PREPARATIONS: 'SETUP',
      EVENT_START: 'LOGISTICS',
      EVENT_END: 'LOGISTICS',
      POST_EVENT_CLEANUP: 'POST_EVENT',
    };

    return typeMap[type] || 'SETUP';
  }

  /**
   * Get tasks related to a specific milestone
   */
  private getTasksForMilestone(tasks: any[], milestone: EventMilestone): any[] {
    return tasks.filter(task => {
      // Check if task is explicitly linked to milestone
      if (task.metadata?.milestoneId === milestone.id) {
        return true;
      }

      // Check if task category matches milestone type
      const category = task.category;
      const milestoneType = milestone.type;

      const categoryMatches: Record<string, string[]> = {
        REGISTRATION_OPEN: ['REGISTRATION', 'MARKETING'],
        REGISTRATION_CLOSE: ['REGISTRATION'],
        VENUE_BOOKING: ['LOGISTICS', 'SETUP'],
        MARKETING_LAUNCH: ['MARKETING'],
        FINAL_PREPARATIONS: ['SETUP', 'LOGISTICS', 'TECHNICAL'],
        EVENT_START: ['LOGISTICS'],
        EVENT_END: ['LOGISTICS'],
        POST_EVENT_CLEANUP: ['POST_EVENT'],
      };

      return categoryMatches[milestoneType]?.includes(category) || false;
    });
  }

  /**
   * Calculate critical path for project management
   */
  private calculateCriticalPath(tasks: any[], milestones: EventMilestone[]): Array<{
    taskId: string;
    taskTitle: string;
    dueDate: Date;
    dependencies: string[];
    slack: number;
  }> {
    // Simplified critical path calculation
    // In a full implementation, this would use proper CPM algorithms
    
    const criticalTasks = tasks
      .filter(task => 
        task.priority === TaskPriority.HIGH || 
        task.priority === TaskPriority.URGENT ||
        task.dependencies?.length > 0
      )
      .map(task => {
        const dueDate = task.dueDate ? new Date(task.dueDate) : new Date();
        const now = new Date();
        const slack = Math.max(0, Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

        return {
          taskId: task.id,
          taskTitle: task.title,
          dueDate,
          dependencies: task.dependencies as string[],
          slack,
        };
      })
      .sort((a, b) => a.slack - b.slack);

    return criticalTasks.slice(0, 10); // Return top 10 critical tasks
  }

  /**
   * Identify risk factors in the workspace
   */
  private identifyRiskFactors(tasks: any[], milestones: EventMilestone[]): Array<{
    type: 'OVERDUE_TASKS' | 'BLOCKED_CRITICAL' | 'RESOURCE_SHORTAGE' | 'DEPENDENCY_DELAY';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    impact: string;
    mitigation: string[];
  }> {
    const risks = [];
    const now = new Date();

    // Check for overdue tasks
    const overdueTasks = tasks.filter(task => 
      task.dueDate && 
      new Date(task.dueDate) < now && 
      task.status !== TaskStatus.COMPLETED
    );

    if (overdueTasks.length > 0) {
      const criticalOverdue = overdueTasks.filter(t => 
        t.priority === TaskPriority.HIGH || t.priority === TaskPriority.URGENT
      );

      risks.push({
        type: 'OVERDUE_TASKS',
        severity: criticalOverdue.length > 0 ? 'HIGH' : 'MEDIUM',
        description: `${overdueTasks.length} tasks are overdue (${criticalOverdue.length} critical)`,
        impact: 'May delay event milestones and affect overall timeline',
        mitigation: [
          'Reassign overdue tasks to available team members',
          'Extend deadlines for non-critical tasks',
          'Break down large overdue tasks into smaller chunks',
          'Implement daily progress check-ins',
        ],
      });
    }

    // Check for blocked critical tasks
    const blockedCritical = tasks.filter(task => 
      task.status === TaskStatus.BLOCKED && 
      (task.priority === TaskPriority.HIGH || task.priority === TaskPriority.URGENT)
    );

    if (blockedCritical.length > 0) {
      risks.push({
        type: 'BLOCKED_CRITICAL',
        severity: 'CRITICAL',
        description: `${blockedCritical.length} critical tasks are blocked`,
        impact: 'Critical path delays that could jeopardize event success',
        mitigation: [
          'Identify and resolve blocking issues immediately',
          'Find alternative approaches for blocked tasks',
          'Escalate to senior management if needed',
          'Prepare contingency plans',
        ],
      });
    }

    return risks;
  }

  /**
   * Send critical deadline notification
   */
  private async sendCriticalDeadlineNotification(workspace: any, task: any): Promise<void> {
    // In a real implementation, this would send actual notifications
    console.log(`Critical deadline notification for workspace ${workspace.id}:`, {
      taskId: task.id,
      taskTitle: task.title,
      dueDate: task.dueDate,
      assignee: task.assignee?.user?.name,
    });
  }

  /**
   * Notify team of event changes
   */
  private async notifyTeamOfEventChanges(
    workspace: any, 
    changes: any, 
    affectedTasks: any[]
  ): Promise<void> {
    // In a real implementation, this would send actual notifications
    console.log(`Event change notification for workspace ${workspace.id}:`, {
      changes,
      affectedTaskCount: affectedTasks.length,
      teamMemberCount: workspace.teamMembers.length,
    });
  }

  /**
   * Verify user has workspace permission
   */
  private async verifyWorkspacePermission(
    workspaceId: string,
    userId: string,
    permission: string
  ): Promise<void> {
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        workspaceId,
        userId,
        status: 'ACTIVE',
      },
    });

    if (!teamMember) {
      throw new Error('Access denied: User is not a member of this workspace');
    }

    const permissions = (teamMember.permissions as string[]) || this.getDefaultPermissions(teamMember.role);
    
    if (!permissions.includes(permission)) {
      throw new Error(`Access denied: User does not have ${permission} permission`);
    }
  }

  /**
   * Verify user has workspace access
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

  /**
   * Get default permissions for a role
   */
  private getDefaultPermissions(role: any): string[] {
    const permissions: Record<string, string[]> = {
      WORKSPACE_OWNER: [
        'MANAGE_WORKSPACE',
        'MANAGE_TEAM',
        'MANAGE_TASKS',
        'VIEW_ANALYTICS',
      ],
      TEAM_LEAD: [
        'MANAGE_TASKS',
        'VIEW_ANALYTICS',
      ],
      EVENT_COORDINATOR: [
        'MANAGE_TASKS',
        'VIEW_ANALYTICS',
      ],
      VOLUNTEER_MANAGER: [
        'MANAGE_TASKS',
      ],
      TECHNICAL_SPECIALIST: [
        'MANAGE_TASKS',
      ],
      MARKETING_LEAD: [
        'MANAGE_TASKS',
      ],
      GENERAL_VOLUNTEER: [
        'VIEW_TASKS',
      ],
    };

    return permissions[role] || [];
  }
}

export const workspaceEventSyncService = new WorkspaceEventSyncService();