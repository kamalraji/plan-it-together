import { PrismaClient, WorkspaceStatus, EventStatus } from '@prisma/client';
import { workspaceService } from './workspace.service';

const prisma = new PrismaClient();

export class WorkspaceLifecycleService {
  /**
   * Automatically provision workspace when event is created
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

      // Provision workspace automatically
      await workspaceService.provisionWorkspace(eventId, organizerId);
      
      console.log(`Workspace automatically provisioned for event ${eventId}`);
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
   */
  private async handleEventCompletion(workspaceId: string): Promise<void> {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
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
    }
  }

  /**
   * Handle event cancellation - immediate workspace dissolution
   */
  private async handleEventCancellation(workspaceId: string): Promise<void> {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
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
}

export const workspaceLifecycleService = new WorkspaceLifecycleService();