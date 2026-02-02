import { PrismaClient, TaskStatus, TaskPriority, TaskCategory } from '@prisma/client';
import { CreateTaskDTO, UpdateTaskDTO, TaskResponse, TaskAssignmentDTO, TaskProgressDTO } from '../types';

const prisma = new PrismaClient();

export class TaskService {
  /**
   * Create a new task
   */
  async createTask(
    workspaceId: string,
    creatorId: string,
    taskData: CreateTaskDTO
  ): Promise<TaskResponse> {
    // Verify creator has permission to create tasks
    await this.verifyTaskPermission(workspaceId, creatorId, 'CREATE_TASKS');

    // Validate assignee if provided
    if (taskData.assigneeId) {
      await this.verifyTeamMemberExists(workspaceId, taskData.assigneeId);
    }

    // Validate dependencies if provided
    if (taskData.dependencies && taskData.dependencies.length > 0) {
      await this.validateTaskDependencies(workspaceId, taskData.dependencies);
    }

    const task = await prisma.workspaceTask.create({
      data: {
        workspaceId,
        title: taskData.title,
        description: taskData.description,
        assigneeId: taskData.assigneeId,
        creatorId,
        category: taskData.category,
        priority: taskData.priority || TaskPriority.MEDIUM,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
        dependencies: taskData.dependencies || [],
        tags: taskData.tags || [],
        metadata: taskData.metadata || {},
      },
      include: {
        assignee: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        creator: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Send notification to assignee if task is assigned
    if (task.assigneeId) {
      await this.notifyTaskAssignment(task);
    }

    return this.mapTaskToResponse(task);
  }

  /**
   * Get task by ID
   */
  async getTask(taskId: string, userId: string): Promise<TaskResponse> {
    const task = await prisma.workspaceTask.findUnique({
      where: { id: taskId },
      include: {
        assignee: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        creator: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    // Verify user has access to workspace
    await this.verifyWorkspaceAccess(task.workspaceId, userId);

    return this.mapTaskToResponse(task);
  }

  /**
   * Get tasks for workspace
   */
  async getWorkspaceTasks(
    workspaceId: string,
    userId: string,
    filters?: {
      status?: TaskStatus;
      assigneeId?: string;
      category?: TaskCategory;
      priority?: TaskPriority;
    }
  ): Promise<TaskResponse[]> {
    // Verify user has access to workspace
    await this.verifyWorkspaceAccess(workspaceId, userId);

    const whereClause: any = { workspaceId };

    if (filters?.status) whereClause.status = filters.status;
    if (filters?.assigneeId) whereClause.assigneeId = filters.assigneeId;
    if (filters?.category) whereClause.category = filters.category;
    if (filters?.priority) whereClause.priority = filters.priority;

    const tasks = await prisma.workspaceTask.findMany({
      where: whereClause,
      include: {
        assignee: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        creator: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return tasks.map(task => this.mapTaskToResponse(task));
  }

  /**
   * Update task
   */
  async updateTask(
    taskId: string,
    userId: string,
    updates: UpdateTaskDTO
  ): Promise<TaskResponse> {
    const task = await prisma.workspaceTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    // Verify user has permission to manage tasks
    await this.verifyTaskPermission(task.workspaceId, userId, 'MANAGE_TASKS');

    // Validate assignee if being updated
    if (updates.assigneeId !== undefined) {
      if (updates.assigneeId) {
        await this.verifyTeamMemberExists(task.workspaceId, updates.assigneeId);
      }
    }

    // Validate dependencies if being updated
    if (updates.dependencies) {
      await this.validateTaskDependencies(task.workspaceId, updates.dependencies, taskId);
    }

    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.assigneeId !== undefined) updateData.assigneeId = updates.assigneeId;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.progress !== undefined) updateData.progress = updates.progress;
    if (updates.dueDate !== undefined) {
      updateData.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
    }
    if (updates.dependencies !== undefined) updateData.dependencies = updates.dependencies;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

    // Set completion timestamp if task is being completed
    if (updates.status === TaskStatus.COMPLETED && task.status !== TaskStatus.COMPLETED) {
      updateData.completedAt = new Date();
      updateData.progress = 100;
    }

    const updatedTask = await prisma.workspaceTask.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignee: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        creator: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Send notifications for status changes
    if (updates.status && updates.status !== task.status) {
      await this.notifyTaskStatusChange(updatedTask, task.status);
    }

    return this.mapTaskToResponse(updatedTask);
  }

  /**
   * Assign task to team member
   */
  async assignTask(
    taskId: string,
    userId: string,
    assignment: TaskAssignmentDTO
  ): Promise<TaskResponse> {
    const task = await prisma.workspaceTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    // Verify user has permission to manage tasks
    await this.verifyTaskPermission(task.workspaceId, userId, 'MANAGE_TASKS');

    // Verify assignee is a team member
    await this.verifyTeamMemberExists(task.workspaceId, assignment.assigneeId);

    const updatedTask = await prisma.workspaceTask.update({
      where: { id: taskId },
      data: { assigneeId: assignment.assigneeId },
      include: {
        assignee: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        creator: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Send notification to new assignee
    await this.notifyTaskAssignment(updatedTask);

    return this.mapTaskToResponse(updatedTask);
  }

  /**
   * Update task progress
   */
  async updateTaskProgress(
    taskId: string,
    userId: string,
    progressUpdate: TaskProgressDTO
  ): Promise<TaskResponse> {
    const task = await prisma.workspaceTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    // Verify user has permission to update progress (assignee or manager)
    const canUpdate = await this.canUpdateTaskProgress(task.workspaceId, userId, task.assigneeId);
    if (!canUpdate) {
      throw new Error('Access denied: User cannot update task progress');
    }

    const updateData: any = {
      status: progressUpdate.status,
      progress: progressUpdate.progress,
    };

    // Set completion timestamp if task is being completed
    if (progressUpdate.status === TaskStatus.COMPLETED && task.status !== TaskStatus.COMPLETED) {
      updateData.completedAt = new Date();
      updateData.progress = 100;
    }

    const updatedTask = await prisma.workspaceTask.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignee: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        creator: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Send notifications for status changes
    if (progressUpdate.status !== task.status) {
      await this.notifyTaskStatusChange(updatedTask, task.status);
    }

    return this.mapTaskToResponse(updatedTask);
  }

  /**
   * Delete task
   */
  async deleteTask(taskId: string, userId: string): Promise<void> {
    const task = await prisma.workspaceTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    // Verify user has permission to manage tasks
    await this.verifyTaskPermission(task.workspaceId, userId, 'MANAGE_TASKS');

    // Check if other tasks depend on this task
    const dependentTasks = await prisma.workspaceTask.findMany({
      where: {
        workspaceId: task.workspaceId,
        dependencies: {
          array_contains: taskId,
        },
      },
    });

    if (dependentTasks.length > 0) {
      throw new Error('Cannot delete task: Other tasks depend on this task');
    }

    await prisma.workspaceTask.delete({
      where: { id: taskId },
    });
  }

  /**
   * Get task dependencies
   */
  async getTaskDependencies(taskId: string, userId: string): Promise<TaskResponse[]> {
    const task = await prisma.workspaceTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    // Verify user has access to workspace
    await this.verifyWorkspaceAccess(task.workspaceId, userId);

    const dependencies = task.dependencies as string[];
    if (!dependencies || dependencies.length === 0) {
      return [];
    }

    const dependencyTasks = await prisma.workspaceTask.findMany({
      where: {
        id: { in: dependencies },
        workspaceId: task.workspaceId,
      },
      include: {
        assignee: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        creator: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return dependencyTasks.map(task => this.mapTaskToResponse(task));
  }

  /**
   * Verify user has task permission
   */
  private async verifyTaskPermission(
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

  /**
   * Verify team member exists in workspace
   */
  private async verifyTeamMemberExists(workspaceId: string, userId: string): Promise<void> {
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        workspaceId,
        userId,
        status: 'ACTIVE',
      },
    });

    if (!teamMember) {
      throw new Error('Assignee is not an active member of this workspace');
    }
  }

  /**
   * Validate task dependencies
   */
  private async validateTaskDependencies(
    workspaceId: string,
    dependencies: string[],
    excludeTaskId?: string
  ): Promise<void> {
    if (dependencies.length === 0) return;

    // Check if all dependency tasks exist in the workspace
    const dependencyTasks = await prisma.workspaceTask.findMany({
      where: {
        id: { in: dependencies },
        workspaceId,
      },
    });

    if (dependencyTasks.length !== dependencies.length) {
      throw new Error('One or more dependency tasks not found in workspace');
    }

    // Check for circular dependencies
    if (excludeTaskId) {
      await this.checkCircularDependencies(workspaceId, excludeTaskId, dependencies);
    }
  }

  /**
   * Check for circular dependencies
   */
  private async checkCircularDependencies(
    _workspaceId: string,
    taskId: string,
    newDependencies: string[]
  ): Promise<void> {
    // This is a simplified check - in a full implementation, you'd do a proper graph traversal
    for (const depId of newDependencies) {
      if (depId === taskId) {
        throw new Error('Circular dependency detected: Task cannot depend on itself');
      }

      // Check if the dependency task depends on the current task
      const depTask = await prisma.workspaceTask.findUnique({
        where: { id: depId },
      });

      if (depTask && depTask.dependencies) {
        const depDependencies = depTask.dependencies as string[];
        if (depDependencies.includes(taskId)) {
          throw new Error('Circular dependency detected');
        }
      }
    }
  }

  /**
   * Check if user can update task progress
   */
  private async canUpdateTaskProgress(
    workspaceId: string,
    userId: string,
    assigneeId: string | null
  ): Promise<boolean> {
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        workspaceId,
        userId,
        status: 'ACTIVE',
      },
    });

    if (!teamMember) {
      return false;
    }

    // Assignee can always update progress
    if (assigneeId && teamMember.userId === assigneeId) {
      return true;
    }

    // Check if user has manage tasks permission
    const permissions = (teamMember.permissions as string[]) || this.getDefaultPermissions(teamMember.role);
    return permissions.includes('MANAGE_TASKS') || permissions.includes('UPDATE_TASK_PROGRESS');
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
        'CREATE_TASKS',
        'UPDATE_TASK_PROGRESS',
      ],
      TEAM_LEAD: [
        'MANAGE_TASKS',
        'CREATE_TASKS',
        'UPDATE_TASK_PROGRESS',
      ],
      EVENT_COORDINATOR: [
        'MANAGE_TASKS',
        'CREATE_TASKS',
        'UPDATE_TASK_PROGRESS',
      ],
      VOLUNTEER_MANAGER: [
        'MANAGE_TASKS',
        'CREATE_TASKS',
        'UPDATE_TASK_PROGRESS',
      ],
      TECHNICAL_SPECIALIST: [
        'CREATE_TASKS',
        'MANAGE_TASKS',
        'UPDATE_TASK_PROGRESS',
      ],
      MARKETING_LEAD: [
        'CREATE_TASKS',
        'MANAGE_TASKS',
        'UPDATE_TASK_PROGRESS',
      ],
      GENERAL_VOLUNTEER: [
        'VIEW_TASKS',
        'UPDATE_TASK_PROGRESS',
      ],
    };

    return permissions[role] || [];
  }

  /**
   * Send task assignment notification
   */
  private async notifyTaskAssignment(task: any): Promise<void> {
    // In a real implementation, this would send notifications
    console.log(`Task "${task.title}" assigned to ${task.assignee?.user?.name}`);
  }

  /**
   * Send task status change notification
   */
  private async notifyTaskStatusChange(task: any, previousStatus: TaskStatus): Promise<void> {
    // In a real implementation, this would send notifications
    console.log(`Task "${task.title}" status changed from ${previousStatus} to ${task.status}`);
  }

  /**
   * Map task to response format
   */
  private mapTaskToResponse(task: any): TaskResponse {
    return {
      id: task.id,
      workspaceId: task.workspaceId,
      title: task.title,
      description: task.description,
      category: task.category,
      priority: task.priority,
      status: task.status,
      progress: task.progress,
      dueDate: task.dueDate,
      dependencies: task.dependencies as string[],
      tags: task.tags,
      metadata: task.metadata,
      assignee: task.assignee ? {
        id: task.assignee.id,
        userId: task.assignee.userId,
        role: task.assignee.role,
        user: task.assignee.user,
      } : null,
      creator: {
        id: task.creator.id,
        userId: task.creator.userId,
        role: task.creator.role,
        user: task.creator.user,
      },
      workspace: task.workspace ? {
        id: task.workspace.id,
        name: task.workspace.name,
      } : undefined,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      completedAt: task.completedAt,
    };
  }
}

export const taskService = new TaskService();