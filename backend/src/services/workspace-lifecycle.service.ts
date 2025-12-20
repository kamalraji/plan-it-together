import { PrismaClient, WorkspaceStatus, EventStatus } from '@prisma/client';
import { workspaceService } from './workspace.service';

const prisma = new PrismaClient();

export class WorkspaceLifecycleService {
  /**
   * Automatically provision workspace when event is created
   * Requirements: 1.1, 1.2, 1.3, 1.4
   */
  async onEventCreated(eventId: string, organizerId: string): Promise<void> {
    try {
      // Check if workspace already exists
      const existingWorkspace = await prisma.workspace.findUnique({
        where: { eventId },
      });

      if (existingWorkspace) {
        console.log(`Workspace already exists for event ${eventId}`);
        return;
      }

      // Set workspace status to provisioning during creation
      console.log(`Starting workspace provisioning for event ${eventId}`);
      
      // Provision workspace automatically with full owner privileges
      const workspace = await workspaceService.provisionWorkspace(eventId, organizerId);
      
      console.log(`Workspace automatically provisioned for event ${eventId} with owner ${organizerId}`);
      
      // Log the provisioning for audit purposes
      await this.logWorkspaceLifecycleEvent(workspace.id, organizerId, 'WORKSPACE_PROVISIONED', {
        eventId,
        organizerId,
        timestamp: new Date().toISOString(),
      });
      
    } catch (error) {
      console.error(`Failed to auto-provision workspace for event ${eventId}:`, error);
      // Don't throw error to avoid breaking event creation
    }
  }

  /**
   * Handle event status changes that affect workspace lifecycle
   */
  async onEventStatusChanged(eventId: string, newStatus: EventStatus, oldStatus: EventStatus): Promise<void> {
    try {
      const workspace = await prisma.workspace.findUnique({
        where: { eventId },
      });

      if (!workspace) {
        console.log(`No workspace found for event ${eventId}`);
        return;
      }

      // Handle event completion
      if (newStatus === EventStatus.COMPLETED && oldStatus !== EventStatus.COMPLETED) {
        await this.handleEventCompletion(workspace.id);
      }

      // Handle event cancellation
      if (newStatus === EventStatus.CANCELLED) {
        await this.handleEventCancellation(workspace.id);
      }

      // Handle event reactivation (from cancelled to active)
      if (oldStatus === EventStatus.CANCELLED && newStatus !== EventStatus.CANCELLED) {
        await this.handleEventReactivation(workspace.id);
      }
    } catch (error) {
      console.error(`Failed to handle event status change for event ${eventId}:`, error);
    }
  }

  /**
   * Handle event completion - initiate workspace wind-down
   * Requirements: 10.1, 10.2
   */
  private async handleEventCompletion(workspaceId: string): Promise<void> {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { event: true },
    });

    if (!workspace) {
      return;
    }

    // Only initiate wind-down if workspace is currently active
    if (workspace.status === WorkspaceStatus.ACTIVE) {
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          status: WorkspaceStatus.WINDING_DOWN,
        },
      });

      console.log(`Workspace ${workspaceId} moved to winding down after event completion`);
      
      // Log the wind-down initiation
      await this.logWorkspaceLifecycleEvent(workspaceId, workspace.event.organizerId, 'WORKSPACE_WIND_DOWN_INITIATED', {
        reason: 'EVENT_COMPLETED',
        eventId: workspace.eventId,
        timestamp: new Date().toISOString(),
      });

      // Schedule automatic dissolution based on retention period
      await this.scheduleAutomaticDissolution(workspaceId);
    }
  }

  /**
   * Handle event cancellation - immediate workspace dissolution
   * Requirements: 10.3
   */
  private async handleEventCancellation(workspaceId: string): Promise<void> {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { event: true },
    });

    if (!workspace) {
      return;
    }

    // Immediately dissolve workspace for cancelled events
    if (workspace.status !== WorkspaceStatus.DISSOLVED) {
      // Revoke all team member access
      await prisma.teamMember.updateMany({
        where: { workspaceId },
        data: { status: 'INACTIVE', leftAt: new Date() },
      });

      // Mark workspace as dissolved
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          status: WorkspaceStatus.DISSOLVED,
          dissolvedAt: new Date(),
        },
      });

      console.log(`Workspace ${workspaceId} dissolved due to event cancellation`);
      
      // Log the dissolution
      await this.logWorkspaceLifecycleEvent(workspaceId, workspace.event.organizerId, 'WORKSPACE_DISSOLVED', {
        reason: 'EVENT_CANCELLED',
        eventId: workspace.eventId,
        timestamp: new Date().toISOString(),
        teamMembersRevoked: true,
      });
    }
  }

  /**
   * Handle event reactivation - restore workspace if possible
   */
  private async handleEventReactivation(workspaceId: string): Promise<void> {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { event: true },
    });

    if (!workspace) {
      return;
    }

    // Only reactivate if workspace was dissolved due to cancellation (not natural expiration)
    if (workspace.status === WorkspaceStatus.DISSOLVED && !workspace.dissolvedAt) {
      // Reactivate workspace
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          status: WorkspaceStatus.ACTIVE,
          dissolvedAt: null,
        },
      });

      // Reactivate team members who were active before cancellation
      await prisma.teamMember.updateMany({
        where: {
          workspaceId,
          status: 'INACTIVE',
          leftAt: { not: null },
        },
        data: {
          status: 'ACTIVE',
          leftAt: null,
        },
      });

      console.log(`Workspace ${workspaceId} reactivated after event reactivation`);
    }
  }

  /**
   * Process scheduled workspace dissolutions
   */
  async processScheduledDissolutions(): Promise<void> {
    try {
      await workspaceService.processAutomaticDissolution();
    } catch (error) {
      console.error('Failed to process scheduled dissolutions:', error);
    }
  }

  /**
   * Get workspace lifecycle status for an event
   */
  async getWorkspaceLifecycleStatus(eventId: string): Promise<{
    hasWorkspace: boolean;
    workspaceStatus?: WorkspaceStatus;
    canProvision: boolean;
    canWindDown: boolean;
    canDissolve: boolean;
    scheduledDissolution?: Date;
  }> {
    const workspace = await prisma.workspace.findUnique({
      where: { eventId },
      include: { event: true },
    });

    if (!workspace) {
      return {
        hasWorkspace: false,
        canProvision: true,
        canWindDown: false,
        canDissolve: false,
      };
    }

    const settings = workspace.settings as any;
    const retentionPeriod = settings?.retentionPeriodDays || 30;
    
    let scheduledDissolution: Date | undefined;
    if (workspace.status === WorkspaceStatus.WINDING_DOWN) {
      scheduledDissolution = new Date(workspace.event.endDate);
      scheduledDissolution.setDate(scheduledDissolution.getDate() + retentionPeriod);
    }

    return {
      hasWorkspace: true,
      workspaceStatus: workspace.status,
      canProvision: false,
      canWindDown: workspace.status === WorkspaceStatus.ACTIVE,
      canDissolve: workspace.status === WorkspaceStatus.ACTIVE || workspace.status === WorkspaceStatus.WINDING_DOWN,
      scheduledDissolution,
    };
  }

  /**
   * Validate workspace lifecycle transition
   */
  async validateLifecycleTransition(
    workspaceId: string,
    fromStatus: WorkspaceStatus,
    toStatus: WorkspaceStatus
  ): Promise<{ valid: boolean; reason?: string }> {
    // Define valid transitions
    const validTransitions: Record<WorkspaceStatus, WorkspaceStatus[]> = {
      [WorkspaceStatus.PROVISIONING]: [WorkspaceStatus.ACTIVE],
      [WorkspaceStatus.ACTIVE]: [WorkspaceStatus.WINDING_DOWN, WorkspaceStatus.DISSOLVED],
      [WorkspaceStatus.WINDING_DOWN]: [WorkspaceStatus.DISSOLVED, WorkspaceStatus.ACTIVE],
      [WorkspaceStatus.DISSOLVED]: [], // No transitions from dissolved state
    };

    const allowedTransitions = validTransitions[fromStatus] || [];
    
    if (!allowedTransitions.includes(toStatus)) {
      return {
        valid: false,
        reason: `Invalid transition from ${fromStatus} to ${toStatus}`,
      };
    }

    // Additional validation for specific transitions
    if (toStatus === WorkspaceStatus.DISSOLVED) {
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: { event: true },
      });

      if (!workspace) {
        return { valid: false, reason: 'Workspace not found' };
      }

      // Check if event has ended or is completed
      const now = new Date();
      const eventEnded = workspace.event.endDate < now;
      const eventCompleted = workspace.event.status === EventStatus.COMPLETED;
      const eventCancelled = workspace.event.status === EventStatus.CANCELLED;

      if (!eventEnded && !eventCompleted && !eventCancelled) {
        return {
          valid: false,
          reason: 'Cannot dissolve workspace before event completion or cancellation',
        };
      }
    }

    return { valid: true };
  }

  /**
   * Schedule automatic dissolution based on configurable retention period
   * Requirements: 10.2, 10.3
   */
  private async scheduleAutomaticDissolution(workspaceId: string): Promise<void> {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { event: true },
    });

    if (!workspace) {
      return;
    }

    const settings = workspace.settings as any;
    const retentionPeriodDays = settings?.retentionPeriodDays || 30;
    
    // Calculate dissolution date based on event end date + retention period
    const dissolutionDate = new Date(workspace.event.endDate);
    dissolutionDate.setDate(dissolutionDate.getDate() + retentionPeriodDays);

    console.log(`Workspace ${workspaceId} scheduled for automatic dissolution on ${dissolutionDate.toISOString()}`);
    
    // Log the scheduling
    await this.logWorkspaceLifecycleEvent(workspaceId, workspace.event.organizerId, 'DISSOLUTION_SCHEDULED', {
      scheduledDate: dissolutionDate.toISOString(),
      retentionPeriodDays,
      eventEndDate: workspace.event.endDate.toISOString(),
    });

    // In a production system, this would integrate with a job scheduler
    // For now, we rely on the processScheduledDissolutions method being called periodically
  }

  /**
   * Manually initiate workspace dissolution with configurable retention
   * Requirements: 10.2, 10.3
   */
  async initiateWorkspaceDissolution(
    workspaceId: string, 
    userId: string, 
    retentionPeriodDays?: number
  ): Promise<void> {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { event: true },
    });

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Validate transition
    const validation = await this.validateLifecycleTransition(
      workspaceId,
      workspace.status,
      WorkspaceStatus.WINDING_DOWN
    );

    if (!validation.valid) {
      throw new Error(validation.reason);
    }

    // Update retention period if provided
    if (retentionPeriodDays !== undefined) {
      const currentSettings = workspace.settings as any || {};
      const updatedSettings = {
        ...currentSettings,
        retentionPeriodDays,
      };

      await prisma.workspace.update({
        where: { id: workspaceId },
        data: { settings: updatedSettings },
      });
    }

    // Move to winding down status
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { status: WorkspaceStatus.WINDING_DOWN },
    });

    // Schedule dissolution
    await this.scheduleAutomaticDissolution(workspaceId);

    // Log the manual initiation
    await this.logWorkspaceLifecycleEvent(workspaceId, userId, 'DISSOLUTION_INITIATED_MANUALLY', {
      retentionPeriodDays: retentionPeriodDays || (workspace.settings as any)?.retentionPeriodDays || 30,
      initiatedBy: userId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Update workspace status with validation and audit logging
   * Requirements: 1.1, 1.2, 1.3, 1.4
   */
  async updateWorkspaceStatus(
    workspaceId: string,
    newStatus: WorkspaceStatus,
    userId: string,
    reason?: string
  ): Promise<void> {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Validate the status transition
    const validation = await this.validateLifecycleTransition(
      workspaceId,
      workspace.status,
      newStatus
    );

    if (!validation.valid) {
      throw new Error(validation.reason);
    }

    // Update the workspace status
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { 
        status: newStatus,
        ...(newStatus === WorkspaceStatus.DISSOLVED && { dissolvedAt: new Date() }),
      },
    });

    // Log the status change
    await this.logWorkspaceLifecycleEvent(workspaceId, userId, 'STATUS_CHANGED', {
      fromStatus: workspace.status,
      toStatus: newStatus,
      reason,
      changedBy: userId,
      timestamp: new Date().toISOString(),
    });

    console.log(`Workspace ${workspaceId} status changed from ${workspace.status} to ${newStatus} by ${userId}`);
  }

  /**
   * Log workspace lifecycle events for audit purposes
   * Requirements: 10.1, 10.2, 10.3
   */
  private async logWorkspaceLifecycleEvent(
    workspaceId: string,
    userId: string,
    action: string,
    details: Record<string, any>
  ): Promise<void> {
    try {
      await prisma.workspaceAuditLog.create({
        data: {
          workspaceId,
          userId,
          action,
          resource: 'WORKSPACE_LIFECYCLE',
          resourceId: workspaceId,
          details,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to log workspace lifecycle event:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }
}

export const workspaceLifecycleService = new WorkspaceLifecycleService();