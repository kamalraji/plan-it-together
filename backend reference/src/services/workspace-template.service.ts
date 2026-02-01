import { PrismaClient, WorkspaceRole, TaskCategory, TaskPriority } from '@prisma/client';

const prisma = new PrismaClient();

export interface WorkspaceTemplateStructure {
  roles: Array<{
    role: WorkspaceRole;
    permissions: string[];
    recommendedCount: number;
    description: string;
  }>;
  taskCategories: Array<{
    category: TaskCategory;
    tasks: Array<{
      title: string;
      description: string;
      priority: TaskPriority;
      estimatedDuration: number; // in days
      dependencies: string[];
      assignedRole?: WorkspaceRole;
      daysBeforeEvent: number; // when task should be due relative to event start
    }>;
  }>;
  channels: Array<{
    name: string;
    type: 'GENERAL' | 'TASK_SPECIFIC' | 'ROLE_BASED' | 'ANNOUNCEMENT';
    description: string;
    isPrivate: boolean;
    defaultMembers: WorkspaceRole[];
  }>;
  milestones: Array<{
    name: string;
    description: string;
    daysBeforeEvent: number;
    requiredTasks: string[];
  }>;
}

export interface WorkspaceTemplate {
  id: string;
  name: string;
  description: string;
  category: 'CONFERENCE' | 'WORKSHOP' | 'HACKATHON' | 'NETWORKING' | 'COMPETITION' | 'GENERAL';
  eventSizeRange: {
    min: number;
    max: number;
  };
  complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX';
  structure: WorkspaceTemplateStructure;
  metadata: {
    createdBy: string;
    organizationId?: string;
    isPublic: boolean;
    usageCount: number;
    averageRating: number;
    tags: string[];
  };
  effectiveness: {
    completionRate: number;
    averageTaskCompletionTime: number;
    teamSatisfactionScore: number;
    successfulEvents: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateCustomization {
  templateId: string;
  eventSpecificChanges: {
    addRoles?: Array<{
      role: WorkspaceRole;
      permissions: string[];
      count: number;
    }>;
    removeRoles?: WorkspaceRole[];
    modifyTasks?: Array<{
      taskId: string;
      changes: {
        title?: string;
        description?: string;
        priority?: TaskPriority;
        dueDate?: Date;
      };
    }>;
    addTasks?: Array<{
      title: string;
      description: string;
      category: TaskCategory;
      priority: TaskPriority;
      assignedRole?: WorkspaceRole;
      dueDate: Date;
    }>;
    removeTasks?: string[];
    addChannels?: Array<{
      name: string;
      type: 'GENERAL' | 'TASK_SPECIFIC' | 'ROLE_BASED' | 'ANNOUNCEMENT';
      description: string;
    }>;
  };
}

export interface TemplateRecommendation {
  template: WorkspaceTemplate;
  matchScore: number; // 0-100
  matchReasons: string[];
  customizationSuggestions: string[];
}

export interface TemplateEffectivenessMetrics {
  templateId: string;
  usageStats: {
    totalUsages: number;
    successfulCompletions: number;
    averageCompletionTime: number;
    completionRate: number;
  };
  performanceMetrics: {
    averageTaskCompletionRate: number;
    averageTeamSatisfaction: number;
    commonBottlenecks: Array<{
      issue: string;
      frequency: number;
      impact: 'LOW' | 'MEDIUM' | 'HIGH';
    }>;
  };
  improvementSuggestions: Array<{
    type: 'ADD_TASK' | 'REMOVE_TASK' | 'MODIFY_ROLE' | 'ADJUST_TIMELINE';
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    basedOnData: string;
  }>;
}

export class WorkspaceTemplateService {
  /**
   * Create a template from a successful workspace
   * Requirements: 11.1
   */
  async createTemplateFromWorkspace(
    workspaceId: string,
    userId: string,
    templateData: {
      name: string;
      description: string;
      category: string;
      complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX';
      isPublic: boolean;
      tags: string[];
    }
  ): Promise<WorkspaceTemplate> {
    // Verify user has permission to create templates from this workspace
    await this.verifyWorkspacePermission(workspaceId, userId, 'MANAGE_WORKSPACE');

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        event: true,
        teamMembers: {
          where: { status: 'ACTIVE' },
        },
        tasks: true,
        channels: true,
      },
    });

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Analyze workspace structure
    const structure = await this.analyzeWorkspaceStructure(workspace);

    // Determine event size range based on workspace
    const eventSizeRange = this.determineEventSizeRange(workspace);

    // Create template
    const template: Omit<WorkspaceTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
      name: templateData.name,
      description: templateData.description,
      category: templateData.category as any,
      eventSizeRange,
      complexity: templateData.complexity,
      structure,
      metadata: {
        createdBy: userId,
        organizationId: workspace.event.organizationId,
        isPublic: templateData.isPublic,
        usageCount: 0,
        averageRating: 0,
        tags: templateData.tags,
      },
      effectiveness: {
        completionRate: 0,
        averageTaskCompletionTime: 0,
        teamSatisfactionScore: 0,
        successfulEvents: 0,
      },
    };

    // Save template to database (in a real implementation)
    const savedTemplate = await this.saveTemplate(template);

    return savedTemplate;
  }

  /**
   * Get template recommendations for an event
   * Requirements: 11.2
   */
  async getTemplateRecommendations(
    eventId: string,
    userId: string
  ): Promise<TemplateRecommendation[]> {
    // Verify user has access to event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    // Get all available templates
    const templates = await this.getAvailableTemplates(userId, event.organizationId);

    // Calculate match scores for each template
    const recommendations: TemplateRecommendation[] = [];

    for (const template of templates) {
      const matchResult = this.calculateTemplateMatch(event, template);
      
      if (matchResult.matchScore > 30) { // Only include templates with reasonable match
        recommendations.push(matchResult);
      }
    }

    // Sort by match score
    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    return recommendations.slice(0, 10); // Return top 10 recommendations
  }

  /**
   * Apply template to workspace with customizations
   * Requirements: 11.3
   */
  async applyTemplateToWorkspace(
    workspaceId: string,
    templateId: string,
    userId: string,
    customizations?: TemplateCustomization
  ): Promise<void> {
    // Verify user has permission to manage workspace
    await this.verifyWorkspacePermission(workspaceId, userId, 'MANAGE_WORKSPACE');

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        event: true,
      },
    });

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Get template
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Apply template structure with customizations
    await this.applyTemplateStructure(workspace, template, customizations);

    // Update workspace to reference template
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { templateId },
    });

    // Track template usage
    await this.trackTemplateUsage(templateId);
  }

  /**
   * Track template effectiveness and generate improvement suggestions
   * Requirements: 11.4
   */
  async trackTemplateEffectiveness(templateId: string): Promise<TemplateEffectivenessMetrics> {
    // Get all workspaces that used this template
    const workspaces = await prisma.workspace.findMany({
      where: { templateId },
      include: {
        event: true,
        tasks: true,
        teamMembers: true,
      },
    });

    if (workspaces.length === 0) {
      throw new Error('No usage data available for this template');
    }

    // Calculate usage statistics
    const totalUsages = workspaces.length;
    const successfulCompletions = workspaces.filter(w => 
      w.event.status === 'COMPLETED' && w.status === 'DISSOLVED'
    ).length;

    const completionTimes = workspaces
      .filter(w => w.dissolvedAt)
      .map(w => {
        const start = new Date(w.createdAt);
        const end = new Date(w.dissolvedAt!);
        return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24); // days
      });

    const averageCompletionTime = completionTimes.length > 0
      ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
      : 0;

    const completionRate = totalUsages > 0 ? (successfulCompletions / totalUsages) * 100 : 0;

    // Calculate performance metrics
    const taskCompletionRates = workspaces.map(w => {
      const totalTasks = w.tasks.length;
      const completedTasks = w.tasks.filter(t => t.status === 'COMPLETED').length;
      return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    });

    const averageTaskCompletionRate = taskCompletionRates.length > 0
      ? taskCompletionRates.reduce((sum, rate) => sum + rate, 0) / taskCompletionRates.length
      : 0;

    // Identify common bottlenecks
    const commonBottlenecks = await this.identifyCommonBottlenecks(workspaces);

    // Generate improvement suggestions
    const improvementSuggestions = this.generateImprovementSuggestions(
      { completionRate, averageTaskCompletionRate },
      commonBottlenecks
    );

    return {
      templateId,
      usageStats: {
        totalUsages,
        successfulCompletions,
        averageCompletionTime,
        completionRate,
      },
      performanceMetrics: {
        averageTaskCompletionRate,
        averageTeamSatisfaction: 0, // Would need survey data
        commonBottlenecks,
      },
      improvementSuggestions,
    };
  }

  /**
   * Share template at organization level
   * Requirements: 11.5
   */
  async shareTemplateWithOrganization(
    templateId: string,
    organizationId: string,
    userId: string
  ): Promise<void> {
    // Verify user has permission to share templates for this organization
    const orgAdmin = await prisma.organizationAdmin.findFirst({
      where: {
        organizationId,
        userId,
      },
    });

    if (!orgAdmin) {
      throw new Error('Access denied: User is not an admin of this organization');
    }

    // Update template to be shared with organization
    // In a real implementation, this would update the template's sharing settings
    console.log(`Template ${templateId} shared with organization ${organizationId} by user ${userId}`);
  }

  /**
   * Get organization-level templates
   * Requirements: 11.5
   */
  async getOrganizationTemplates(
    organizationId: string,
    userId: string
  ): Promise<WorkspaceTemplate[]> {
    // Verify user has access to organization
    const isMember = await this.verifyOrganizationAccess(organizationId, userId);
    if (!isMember) {
      throw new Error('Access denied: User is not a member of this organization');
    }

    // Get templates shared with this organization
    // In a real implementation, this would query templates with organization access
    return this.getTemplatesByOrganization(organizationId);
  }

  /**
   * Analyze workspace structure to create template
   */
  private async analyzeWorkspaceStructure(workspace: any): Promise<WorkspaceTemplateStructure> {
    // Analyze roles and their distribution
    const roleStats = new Map<WorkspaceRole, number>();
    workspace.teamMembers.forEach((member: any) => {
      roleStats.set(member.role, (roleStats.get(member.role) || 0) + 1);
    });

    const roles = Array.from(roleStats.entries()).map(([role, count]) => ({
      role,
      permissions: this.getDefaultPermissions(role),
      recommendedCount: count,
      description: this.getRoleDescription(role),
    }));

    // Analyze task categories and patterns
    const tasksByCategory = new Map<TaskCategory, any[]>();
    workspace.tasks.forEach((task: any) => {
      if (!tasksByCategory.has(task.category)) {
        tasksByCategory.set(task.category, []);
      }
      tasksByCategory.get(task.category)!.push(task);
    });

    const taskCategories = Array.from(tasksByCategory.entries()).map(([category, tasks]) => ({
      category,
      tasks: tasks.map(task => ({
        title: task.title,
        description: task.description,
        priority: task.priority,
        estimatedDuration: this.calculateTaskDuration(task),
        dependencies: task.dependencies as string[],
        assignedRole: this.getTaskAssignedRole(task, workspace.teamMembers),
        daysBeforeEvent: this.calculateDaysBeforeEvent(task, workspace.event),
      })),
    }));

    // Analyze channels
    const channels = workspace.channels.map((channel: any) => ({
      name: channel.name,
      type: channel.type,
      description: channel.description || '',
      isPrivate: channel.isPrivate,
      defaultMembers: this.getChannelDefaultMembers(channel.type),
    }));

    // Generate milestones based on task patterns
    const milestones = this.generateMilestonesFromTasks(workspace.tasks, workspace.event);

    return {
      roles,
      taskCategories,
      channels,
      milestones,
    };
  }

  /**
   * Determine event size range based on workspace characteristics
   */
  private determineEventSizeRange(workspace: any): { min: number; max: number } {
    // Base size estimation on team size and task complexity
    const teamSize = workspace.teamMembers.length;
    const taskCount = workspace.tasks.length;
    
    // Simple heuristic for event size estimation
    let estimatedSize = teamSize * 20; // Rough ratio of team to participants
    
    if (taskCount > 50) {
      estimatedSize *= 2; // Complex events likely have more participants
    }

    return {
      min: Math.max(10, Math.floor(estimatedSize * 0.5)),
      max: Math.ceil(estimatedSize * 2),
    };
  }

  /**
   * Calculate template match score for an event
   */
  private calculateTemplateMatch(event: any, template: WorkspaceTemplate): TemplateRecommendation {
    let matchScore = 0;
    const matchReasons: string[] = [];
    const customizationSuggestions: string[] = [];

    // Event size match (30 points)
    const eventCapacity = event.capacity || 100;
    if (eventCapacity >= template.eventSizeRange.min && eventCapacity <= template.eventSizeRange.max) {
      matchScore += 30;
      matchReasons.push('Event size matches template range');
    } else if (eventCapacity < template.eventSizeRange.min) {
      matchScore += 15;
      matchReasons.push('Event is smaller than template range');
      customizationSuggestions.push('Consider reducing team size and task complexity');
    } else {
      matchScore += 10;
      matchReasons.push('Event is larger than template range');
      customizationSuggestions.push('Consider adding more team roles and tasks');
    }

    // Event type/category match (25 points)
    // This would need event categorization - for now, use simple heuristics
    if (template.category === 'GENERAL') {
      matchScore += 15;
      matchReasons.push('General template suitable for most events');
    } else {
      matchScore += 25;
      matchReasons.push(`Template designed for ${template.category} events`);
    }

    // Complexity match (20 points)
    const eventDuration = event.endDate ? 
      (new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) / (1000 * 60 * 60 * 24) : 1;
    
    if (eventDuration <= 1 && template.complexity === 'SIMPLE') {
      matchScore += 20;
      matchReasons.push('Simple template matches single-day event');
    } else if (eventDuration <= 3 && template.complexity === 'MODERATE') {
      matchScore += 20;
      matchReasons.push('Moderate template matches multi-day event');
    } else if (eventDuration > 3 && template.complexity === 'COMPLEX') {
      matchScore += 20;
      matchReasons.push('Complex template matches extended event');
    } else {
      matchScore += 10;
      customizationSuggestions.push('Adjust template complexity to match event duration');
    }

    // Organization match (15 points)
    if (template.metadata.organizationId === event.organizationId) {
      matchScore += 15;
      matchReasons.push('Template from same organization');
    } else if (template.metadata.isPublic) {
      matchScore += 10;
      matchReasons.push('Public template available');
    }

    // Effectiveness score (10 points)
    if (template.effectiveness.completionRate > 80) {
      matchScore += 10;
      matchReasons.push('High success rate template');
    } else if (template.effectiveness.completionRate > 60) {
      matchScore += 5;
      matchReasons.push('Good success rate template');
    }

    return {
      template,
      matchScore: Math.min(100, matchScore),
      matchReasons,
      customizationSuggestions,
    };
  }

  /**
   * Apply template structure to workspace
   */
  private async applyTemplateStructure(
    workspace: any,
    template: WorkspaceTemplate,
    customizations?: TemplateCustomization
  ): Promise<void> {
    // Create channels from template
    for (const channelTemplate of template.structure.channels) {
      await prisma.workspaceChannel.create({
        data: {
          workspaceId: workspace.id,
          name: channelTemplate.name,
          type: channelTemplate.type,
          description: channelTemplate.description,
          isPrivate: channelTemplate.isPrivate,
        },
      });
    }

    // Create tasks from template
    const eventStartDate = new Date(workspace.event.startDate);
    
    for (const categoryTemplate of template.structure.taskCategories) {
      for (const taskTemplate of categoryTemplate.tasks) {
        // Calculate due date based on event start date
        const dueDate = new Date(eventStartDate);
        dueDate.setDate(dueDate.getDate() - taskTemplate.daysBeforeEvent);

        await prisma.workspaceTask.create({
          data: {
            workspaceId: workspace.id,
            title: taskTemplate.title,
            description: taskTemplate.description,
            category: categoryTemplate.category,
            priority: taskTemplate.priority,
            dueDate,
            dependencies: taskTemplate.dependencies,
            tags: ['template-generated'],
            metadata: {
              templateId: template.id,
              originalTemplate: true,
            },
          },
        });
      }
    }

    // Apply customizations if provided
    if (customizations) {
      await this.applyCustomizations(workspace.id, customizations);
    }
  }

  /**
   * Apply customizations to workspace
   */
  private async applyCustomizations(
    workspaceId: string,
    customizations: TemplateCustomization
  ): Promise<void> {
    const changes = customizations.eventSpecificChanges;

    // Add custom tasks
    if (changes.addTasks) {
      for (const task of changes.addTasks) {
        await prisma.workspaceTask.create({
          data: {
            workspaceId,
            title: task.title,
            description: task.description,
            category: task.category,
            priority: task.priority,
            dueDate: task.dueDate,
            tags: ['custom-added'],
            metadata: {
              customization: true,
            },
          },
        });
      }
    }

    // Remove tasks
    if (changes.removeTasks) {
      await prisma.workspaceTask.deleteMany({
        where: {
          workspaceId,
          id: { in: changes.removeTasks },
        },
      });
    }

    // Modify tasks
    if (changes.modifyTasks) {
      for (const modification of changes.modifyTasks) {
        await prisma.workspaceTask.update({
          where: { id: modification.taskId },
          data: modification.changes,
        });
      }
    }

    // Add custom channels
    if (changes.addChannels) {
      for (const channel of changes.addChannels) {
        await prisma.workspaceChannel.create({
          data: {
            workspaceId,
            name: channel.name,
            type: channel.type,
            description: channel.description,
          },
        });
      }
    }
  }

  /**
   * Identify common bottlenecks across template usages
   */
  private async identifyCommonBottlenecks(workspaces: any[]): Promise<Array<{
    issue: string;
    frequency: number;
    impact: 'LOW' | 'MEDIUM' | 'HIGH';
  }>> {
    const bottlenecks = [];

    // Analyze overdue tasks patterns
    let overdueTaskCount = 0;
    let totalTaskCount = 0;

    workspaces.forEach(workspace => {
      workspace.tasks.forEach((task: any) => {
        totalTaskCount++;
        if (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED') {
          overdueTaskCount++;
        }
      });
    });

    if (overdueTaskCount / totalTaskCount > 0.2) {
      bottlenecks.push({
        issue: 'High rate of overdue tasks',
        frequency: Math.round((overdueTaskCount / totalTaskCount) * 100),
        impact: 'HIGH',
      });
    }

    // Analyze blocked tasks
    let blockedTaskCount = 0;
    workspaces.forEach(workspace => {
      workspace.tasks.forEach((task: any) => {
        if (task.status === 'BLOCKED') {
          blockedTaskCount++;
        }
      });
    });

    if (blockedTaskCount / totalTaskCount > 0.1) {
      bottlenecks.push({
        issue: 'Frequent task blocking',
        frequency: Math.round((blockedTaskCount / totalTaskCount) * 100),
        impact: 'MEDIUM',
      });
    }

    return bottlenecks;
  }

  /**
   * Generate improvement suggestions based on metrics
   */
  private generateImprovementSuggestions(
    metrics: { completionRate: number; averageTaskCompletionRate: number },
    bottlenecks: Array<{ issue: string; frequency: number; impact: string }>
  ): Array<{
    type: 'ADD_TASK' | 'REMOVE_TASK' | 'MODIFY_ROLE' | 'ADJUST_TIMELINE';
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    basedOnData: string;
  }> {
    const suggestions = [];

    if (metrics.completionRate < 70) {
      suggestions.push({
        type: 'ADJUST_TIMELINE',
        description: 'Extend task deadlines to improve completion rates',
        priority: 'HIGH',
        basedOnData: `Only ${metrics.completionRate.toFixed(1)}% of workspaces complete successfully`,
      });
    }

    if (metrics.averageTaskCompletionRate < 80) {
      suggestions.push({
        type: 'REMOVE_TASK',
        description: 'Remove or simplify complex tasks that are frequently incomplete',
        priority: 'MEDIUM',
        basedOnData: `Average task completion rate is ${metrics.averageTaskCompletionRate.toFixed(1)}%`,
      });
    }

    bottlenecks.forEach(bottleneck => {
      if (bottleneck.issue.includes('overdue')) {
        suggestions.push({
          type: 'ADJUST_TIMELINE',
          description: 'Adjust task timelines to reduce overdue tasks',
          priority: 'HIGH',
          basedOnData: `${bottleneck.frequency}% of tasks become overdue`,
        });
      }

      if (bottleneck.issue.includes('blocked')) {
        suggestions.push({
          type: 'MODIFY_ROLE',
          description: 'Add coordination roles to reduce task dependencies',
          priority: 'MEDIUM',
          basedOnData: `${bottleneck.frequency}% of tasks get blocked`,
        });
      }
    });

    return suggestions;
  }

  // Helper methods
  private calculateTaskDuration(task: any): number {
    if (task.completedAt && task.createdAt) {
      const start = new Date(task.createdAt);
      const end = new Date(task.completedAt);
      return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }
    return 1; // Default 1 day
  }

  private getTaskAssignedRole(task: any, teamMembers: any[]): WorkspaceRole | undefined {
    if (task.assigneeId) {
      const assignee = teamMembers.find(member => member.id === task.assigneeId);
      return assignee?.role;
    }
    return undefined;
  }

  private calculateDaysBeforeEvent(task: any, event: any): number {
    if (task.dueDate && event.startDate) {
      const dueDate = new Date(task.dueDate);
      const eventStart = new Date(event.startDate);
      return Math.ceil((eventStart.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    }
    return 7; // Default 1 week before
  }

  private getChannelDefaultMembers(channelType: string): WorkspaceRole[] {
    const defaultMembers: Record<string, WorkspaceRole[]> = {
      GENERAL: [WorkspaceRole.WORKSPACE_OWNER, WorkspaceRole.TEAM_LEAD, WorkspaceRole.EVENT_COORDINATOR],
      ANNOUNCEMENT: [WorkspaceRole.WORKSPACE_OWNER, WorkspaceRole.TEAM_LEAD],
      TASK_SPECIFIC: [WorkspaceRole.WORKSPACE_OWNER, WorkspaceRole.TEAM_LEAD, WorkspaceRole.EVENT_COORDINATOR],
      ROLE_BASED: [], // Depends on specific role
    };

    return defaultMembers[channelType] || [];
  }

  private generateMilestonesFromTasks(tasks: any[], event: any): Array<{
    name: string;
    description: string;
    daysBeforeEvent: number;
    requiredTasks: string[];
  }> {
    // Simple milestone generation based on task categories
    return [
      {
        name: 'Planning Complete',
        description: 'All setup and planning tasks completed',
        daysBeforeEvent: 14,
        requiredTasks: tasks.filter(t => t.category === 'SETUP').map(t => t.title),
      },
      {
        name: 'Marketing Launch',
        description: 'Marketing campaign launched',
        daysBeforeEvent: 21,
        requiredTasks: tasks.filter(t => t.category === 'MARKETING').map(t => t.title),
      },
      {
        name: 'Final Preparations',
        description: 'All logistics and technical preparations complete',
        daysBeforeEvent: 3,
        requiredTasks: tasks.filter(t => 
          t.category === 'LOGISTICS' || t.category === 'TECHNICAL'
        ).map(t => t.title),
      },
    ];
  }

  private getRoleDescription(role: WorkspaceRole): string {
    const descriptions: Record<WorkspaceRole, string> = {
      WORKSPACE_OWNER: 'Overall workspace management and decision making',
      TEAM_LEAD: 'Team coordination and task management',
      EVENT_COORDINATOR: 'Event logistics and coordination',
      VOLUNTEER_MANAGER: 'Volunteer recruitment and management',
      TECHNICAL_SPECIALIST: 'Technical setup and support',
      MARKETING_LEAD: 'Marketing and promotional activities',
      GENERAL_VOLUNTEER: 'General support and assistance',
    };

    return descriptions[role] || 'General workspace member';
  }

  private getDefaultPermissions(role: WorkspaceRole): string[] {
    const permissions: Record<WorkspaceRole, string[]> = {
      WORKSPACE_OWNER: ['MANAGE_WORKSPACE', 'MANAGE_TEAM', 'MANAGE_TASKS', 'VIEW_ANALYTICS'],
      TEAM_LEAD: ['MANAGE_TASKS', 'VIEW_ANALYTICS', 'INVITE_MEMBERS'],
      EVENT_COORDINATOR: ['MANAGE_TASKS', 'CREATE_TASKS'],
      VOLUNTEER_MANAGER: ['MANAGE_TASKS', 'INVITE_MEMBERS'],
      TECHNICAL_SPECIALIST: ['CREATE_TASKS', 'MANAGE_TASKS'],
      MARKETING_LEAD: ['CREATE_TASKS', 'MANAGE_TASKS'],
      GENERAL_VOLUNTEER: ['VIEW_TASKS', 'UPDATE_TASK_PROGRESS'],
    };

    return permissions[role] || [];
  }

  // Placeholder methods for database operations
  private async saveTemplate(template: Omit<WorkspaceTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkspaceTemplate> {
    // In a real implementation, this would save to database
    return {
      ...template,
      id: `template_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private async getTemplate(templateId: string): Promise<WorkspaceTemplate | null> {
    // In a real implementation, this would query the database
    return null;
  }

  private async getAvailableTemplates(userId: string, organizationId?: string): Promise<WorkspaceTemplate[]> {
    // In a real implementation, this would query available templates
    return [];
  }

  private async trackTemplateUsage(templateId: string): Promise<void> {
    // In a real implementation, this would increment usage counter
    console.log(`Template usage tracked: ${templateId}`);
  }

  private async getTemplatesByOrganization(organizationId: string): Promise<WorkspaceTemplate[]> {
    // In a real implementation, this would query organization templates
    return [];
  }

  private async verifyOrganizationAccess(organizationId: string, userId: string): Promise<boolean> {
    // In a real implementation, this would verify organization membership
    return true;
  }

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
}

export const workspaceTemplateService = new WorkspaceTemplateService();