import { PrismaClient, TaskCategory, TaskPriority } from '@prisma/client';

const prisma = new PrismaClient();

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  estimatedDuration?: number; // in hours
  dependencies?: string[]; // template IDs
  tags: string[];
  isDefault: boolean;
}

export interface TaskTemplateSet {
  id: string;
  name: string;
  description: string;
  eventType: string;
  templates: TaskTemplate[];
}

export class TaskTemplateService {
  /**
   * Get default task templates for event categories
   */
  getDefaultTaskTemplates(): TaskTemplateSet[] {
    return [
      {
        id: 'conference-template',
        name: 'Conference Event Template',
        description: 'Standard task template for conference events',
        eventType: 'conference',
        templates: [
          // Setup Tasks
          {
            id: 'setup-venue-booking',
            name: 'Book Event Venue',
            description: 'Research and book appropriate venue for the conference',
            category: TaskCategory.SETUP,
            priority: TaskPriority.HIGH,
            estimatedDuration: 8,
            tags: ['venue', 'booking', 'logistics'],
            isDefault: true,
          },
          {
            id: 'setup-catering',
            name: 'Arrange Catering Services',
            description: 'Book catering services for meals and refreshments',
            category: TaskCategory.SETUP,
            priority: TaskPriority.MEDIUM,
            estimatedDuration: 4,
            dependencies: ['setup-venue-booking'],
            tags: ['catering', 'food', 'logistics'],
            isDefault: true,
          },
          {
            id: 'setup-av-equipment',
            name: 'Setup Audio/Visual Equipment',
            description: 'Arrange and test all AV equipment for presentations',
            category: TaskCategory.TECHNICAL,
            priority: TaskPriority.HIGH,
            estimatedDuration: 6,
            dependencies: ['setup-venue-booking'],
            tags: ['av', 'technical', 'equipment'],
            isDefault: true,
          },
          
          // Marketing Tasks
          {
            id: 'marketing-website',
            name: 'Create Event Website',
            description: 'Design and launch event website with registration',
            category: TaskCategory.MARKETING,
            priority: TaskPriority.HIGH,
            estimatedDuration: 16,
            tags: ['website', 'marketing', 'registration'],
            isDefault: true,
          },
          {
            id: 'marketing-social-media',
            name: 'Social Media Campaign',
            description: 'Create and execute social media marketing campaign',
            category: TaskCategory.MARKETING,
            priority: TaskPriority.MEDIUM,
            estimatedDuration: 12,
            dependencies: ['marketing-website'],
            tags: ['social-media', 'marketing', 'promotion'],
            isDefault: true,
          },
          {
            id: 'marketing-speakers',
            name: 'Recruit and Confirm Speakers',
            description: 'Identify, contact, and confirm keynote speakers',
            category: TaskCategory.MARKETING,
            priority: TaskPriority.HIGH,
            estimatedDuration: 20,
            tags: ['speakers', 'content', 'networking'],
            isDefault: true,
          },
          
          // Registration Tasks
          {
            id: 'registration-system',
            name: 'Setup Registration System',
            description: 'Configure online registration and payment processing',
            category: TaskCategory.REGISTRATION,
            priority: TaskPriority.HIGH,
            estimatedDuration: 8,
            dependencies: ['marketing-website'],
            tags: ['registration', 'payment', 'system'],
            isDefault: true,
          },
          {
            id: 'registration-early-bird',
            name: 'Launch Early Bird Registration',
            description: 'Open early bird registration with discounted pricing',
            category: TaskCategory.REGISTRATION,
            priority: TaskPriority.MEDIUM,
            estimatedDuration: 2,
            dependencies: ['registration-system'],
            tags: ['early-bird', 'pricing', 'promotion'],
            isDefault: true,
          },
          
          // Logistics Tasks
          {
            id: 'logistics-signage',
            name: 'Design and Print Event Signage',
            description: 'Create directional and informational signage',
            category: TaskCategory.LOGISTICS,
            priority: TaskPriority.MEDIUM,
            estimatedDuration: 6,
            tags: ['signage', 'design', 'printing'],
            isDefault: true,
          },
          {
            id: 'logistics-badges',
            name: 'Prepare Attendee Badges',
            description: 'Design and print attendee badges and lanyards',
            category: TaskCategory.LOGISTICS,
            priority: TaskPriority.MEDIUM,
            estimatedDuration: 4,
            dependencies: ['registration-system'],
            tags: ['badges', 'attendees', 'identification'],
            isDefault: true,
          },
          
          // Post-Event Tasks
          {
            id: 'post-event-survey',
            name: 'Send Post-Event Survey',
            description: 'Collect feedback from attendees and speakers',
            category: TaskCategory.POST_EVENT,
            priority: TaskPriority.MEDIUM,
            estimatedDuration: 3,
            tags: ['survey', 'feedback', 'analysis'],
            isDefault: true,
          },
          {
            id: 'post-event-thank-you',
            name: 'Send Thank You Messages',
            description: 'Send personalized thank you messages to speakers and sponsors',
            category: TaskCategory.POST_EVENT,
            priority: TaskPriority.LOW,
            estimatedDuration: 2,
            tags: ['thank-you', 'communication', 'relationships'],
            isDefault: true,
          },
        ],
      },
    ];
  }

  /**
   * Apply task template to workspace
   */
  async applyTaskTemplate(
    workspaceId: string,
    templateSetId: string,
    creatorId: string,
    customizations?: {
      startDate?: Date;
      eventDuration?: number; // in days
      skipTemplateIds?: string[];
    }
  ): Promise<void> {
    const templateSets = this.getDefaultTaskTemplates();
    const templateSet = templateSets.find(set => set.id === templateSetId);
    
    if (!templateSet) {
      throw new Error('Template set not found');
    }

    // Verify creator has permission to create tasks
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        workspaceId,
        userId: creatorId,
        status: 'ACTIVE',
      },
    });

    if (!teamMember) {
      throw new Error('Access denied: User is not a member of this workspace');
    }

    const permissions = (teamMember.permissions as string[]) || this.getDefaultPermissions(teamMember.role);
    if (!permissions.includes('CREATE_TASKS') && !permissions.includes('MANAGE_TASKS')) {
      throw new Error('Access denied: User does not have permission to create tasks');
    }

    // Calculate task dates based on customizations
    const baseDate = customizations?.startDate || new Date();
    const eventDuration = customizations?.eventDuration || 30; // default 30 days
    const skipTemplateIds = customizations?.skipTemplateIds || [];

    // Filter out skipped templates
    const templatesToApply = templateSet.templates.filter(
      template => !skipTemplateIds.includes(template.id)
    );

    // Create tasks from templates
    const createdTasks: Record<string, string> = {}; // templateId -> taskId mapping

    for (const template of templatesToApply) {
      // Calculate due date based on template and event timeline
      const dueDate = this.calculateTaskDueDate(template, baseDate, eventDuration);
      
      // Map template dependencies to actual task IDs
      const dependencies = template.dependencies
        ?.map(depTemplateId => createdTasks[depTemplateId])
        .filter(Boolean) || [];

      const task = await prisma.workspaceTask.create({
        data: {
          workspaceId,
          title: template.name,
          description: template.description,
          creatorId: teamMember.id,
          category: template.category,
          priority: template.priority,
          dueDate,
          dependencies,
          tags: template.tags,
          metadata: {
            templateId: template.id,
            estimatedDuration: template.estimatedDuration,
            isFromTemplate: true,
          },
        },
      });

      createdTasks[template.id] = task.id;
    }

    console.log(`Applied template set "${templateSet.name}" to workspace ${workspaceId}, created ${Object.keys(createdTasks).length} tasks`);
  }

  /**
   * Get available task template sets
   */
  getAvailableTemplateSets(): Array<{
    id: string;
    name: string;
    description: string;
    eventType: string;
    taskCount: number;
  }> {
    const templateSets = this.getDefaultTaskTemplates();
    
    return templateSets.map(set => ({
      id: set.id,
      name: set.name,
      description: set.description,
      eventType: set.eventType,
      taskCount: set.templates.length,
    }));
  }

  /**
   * Get template set details
   */
  getTemplateSetDetails(templateSetId: string): TaskTemplateSet | null {
    const templateSets = this.getDefaultTaskTemplates();
    return templateSets.find(set => set.id === templateSetId) || null;
  }

  /**
   * Calculate task due date based on template and event timeline
   */
  private calculateTaskDueDate(template: TaskTemplate, eventStartDate: Date, eventDurationDays: number): Date {
    const dueDate = new Date(eventStartDate);
    
    // Different categories have dations?.eventDuration ve to event
    switch (template.category) {
      case TaskCategory.SETUP:
        // Setup tasks should be completed well before the event
        dueDate.setDate(dueDate.getDate() - Math.floor(eventDurationDays * 0.7));
        break;
      case TaskCategory.MARKETING:
        // Marketing tasks should be completed before registration opens
        dueDate.setDate(dueDate.getDate() - Math.floor(eventDurationDays * 0.5));
        break;
      case TaskCategory.REGISTRATION:
        // Registration tasks should be completed before marketing
        dueDate.setDate(dueDate.getDate() - Math.floor(eventDurationDays * 0.6));
        break;
      case TaskCategory.LOGISTICS:
        // Logistics tasks closer to event date
        dueDate.setDate(dueDate.getDate() - Math.floor(eventDurationDays * 0.2));
        break;
      case TaskCategory.TECHNICAL:
        // Technical tasks need time for testing
        dueDate.setDate(dueDate.getDate() - Math.floor(eventDurationDays * 0.3));
        break;
      case TaskCategory.POST_EVENT:
        // Post-event tasks after the event
        dueDate.setDate(dueDate.getDate() + 7);
        break;
      default:
        // Default to middle of timeline
        dueDate.setDate(dueDate.getDate() - Math.floor(eventDurationDays * 0.5));
    }

    return dueDate;
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
      ],
      TEAM_LEAD: [
        'MANAGE_TASKS',
        'CREATE_TASKS',
      ],
      EVENT_COORDINATOR: [
        'MANAGE_TASKS',
        'CREATE_TASKS',
      ],
      VOLUNTEER_MANAGER: [
        'MANAGE_TASKS',
        'CREATE_TASKS',
      ],
      TECHNICAL_SPECIALIST: [
        'CREATE_TASKS',
        'MANAGE_TASKS',
      ],
      MARKETING_LEAD: [
        'CREATE_TASKS',
        'MANAGE_TASKS',
      ],
      GENERAL_VOLUNTEER: [
        'VIEW_TASKS',
      ],
    };

    return permissions[role] || [];
  }
}

export const taskTemplateService = new TaskTemplateService();