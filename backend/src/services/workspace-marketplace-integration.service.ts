import { PrismaClient, ServiceCategory, WorkspaceRole } from '@prisma/client';
import { marketplaceService } from './marketplace.service';
import { workspaceService } from './workspace.service';
import { teamService } from './team.service';
import {
  ServiceListingResponse,
  TeamMemberServiceRecommendationDTO,
  WorkspaceMarketplaceIntegrationResponse,
} from '../types';

const prisma = new PrismaClient();

/**
 * Service for integrating marketplace team member services with workspace functionality
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5
 */
export class WorkspaceMarketplaceIntegrationService {
  /**
   * Get marketplace vendor recommendations for team member services
   * Requirements: 14.1
   */
  async getTeamMemberServiceRecommendations(
    workspaceId: string,
    userId: string,
    options?: TeamMemberServiceRecommendationDTO
  ): Promise<ServiceListingResponse[]> {
    // Verify user has access to workspace
    const workspace = await workspaceService.getWorkspace(workspaceId, userId);
    
    // Get event details to inform recommendations
    const event = await prisma.event.findUnique({
      where: { id: workspace.event!.id },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    // Define team member service categories
    const teamServiceCategories: ServiceCategory[] = [
      ServiceCategory.EVENT_COORDINATION,
      ServiceCategory.MARKETING,
      ServiceCategory.TECHNICAL_SUPPORT,
      ServiceCategory.VOLUNTEER_MANAGEMENT,
      ServiceCategory.LOGISTICS,
    ];

    // Build search criteria for team member services
    const searchCriteria = {
      category: options?.preferredCategories?.[0] || undefined,
      location: options?.location,
      budgetRange: options?.budgetRange,
      verifiedOnly: options?.verifiedOnly || true,
      limit: options?.limit || 10,
      offset: 0,
    };

    // Get base service recommendations
    let recommendations = await marketplaceService.searchServices(searchCriteria);
    
    // Filter for team member services only
    const teamServiceRecommendations = recommendations.services.filter(service => 
      teamServiceCategories.includes(service.category as ServiceCategory)
    );

    // Analyze current team composition to identify gaps
    const teamGaps = await this.analyzeTeamComposition(workspaceId);
    
    // Enhance recommendations based on team gaps
    const enhancedRecommendations = teamServiceRecommendations.map(service => {
      let recommendationScore = 0;
      let recommendationReason = 'Professional team member service';

      // Boost services that fill identified team gaps
      const serviceRole = this.mapServiceCategoryToWorkspaceRole(service.category as ServiceCategory);
      if (teamGaps.missingRoles.includes(serviceRole)) {
        recommendationScore += 30;
        recommendationReason = `Fills missing ${serviceRole.toLowerCase().replace('_', ' ')} role`;
      }

      // Boost services for understaffed areas
      if (teamGaps.understaffedAreas.includes(service.category as ServiceCategory)) {
        recommendationScore += 20;
        recommendationReason += ' in understaffed area';
      }

      // Boost verified vendors
      if (service.vendor?.verificationStatus === 'VERIFIED') {
        recommendationScore += 15;
      }

      // Boost highly rated vendors
      if (service.vendor?.rating && service.vendor.rating >= 4.5) {
        recommendationScore += 10;
      }

      // Boost vendors with high completion rates
      if (service.vendor?.completionRate && service.vendor.completionRate >= 95) {
        recommendationScore += 5;
      }

      return {
        ...service,
        recommendationScore,
        recommendationReason,
        suggestedRole: serviceRole,
        teamGapFilled: teamGaps.missingRoles.includes(serviceRole),
      };
    });

    // Sort by recommendation score and return top results
    return enhancedRecommendations
      .sort((a, b) => (b as any).recommendationScore - (a as any).recommendationScore)
      .slice(0, options?.limit || 10);
  }

  /**
   * Automatically integrate hired specialists into workspace with appropriate roles
   * Requirements: 14.2
   */
  async integrateHiredSpecialistIntoWorkspace(
    workspaceId: string,
    bookingId: string,
    userId: string,
    integrationOptions?: {
      customRole?: WorkspaceRole;
      permissions?: string[];
      accessLevel?: 'FULL' | 'LIMITED' | 'TASK_SPECIFIC';
    }
  ): Promise<WorkspaceMarketplaceIntegrationResponse> {
    // Verify user has permission to manage workspace
    await this.verifyWorkspaceManagementPermission(workspaceId, userId);

    // Get booking details
    const booking = await prisma.bookingRequest.findUnique({
      where: { id: bookingId },
      include: {
        serviceListing: {
          include: {
            vendor: {
              include: {
                user: true,
              },
            },
          },
        },
        event: true,
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.event.id !== (await workspaceService.getWorkspace(workspaceId, userId)).event!.id) {
      throw new Error('Booking is not for the same event as the workspace');
    }

    if (booking.status !== 'CONFIRMED') {
      throw new Error('Can only integrate confirmed bookings');
    }

    // Determine appropriate workspace role based on service category
    const suggestedRole = integrationOptions?.customRole || 
      this.mapServiceCategoryToWorkspaceRole(booking.serviceListing.category as ServiceCategory);

    // Create team member invitation for the vendor
    const invitation = await teamService.inviteTeamMember(
      workspaceId,
      userId,
      {
        email: booking.serviceListing.vendor.user.email,
        role: suggestedRole,
        customMessage: `You've been invited to join the workspace for ${booking.event.name} as a hired specialist for ${booking.serviceListing.title}.`,
        externalMember: true,
        bookingId: bookingId,
        accessLevel: integrationOptions?.accessLevel || 'LIMITED',
      }
    );

    // Create marketplace integration record
    await prisma.workspaceMarketplaceIntegration.create({
      data: {
        workspaceId,
        bookingId,
        vendorId: booking.vendorId,
        teamMemberId: null, // Will be updated when invitation is accepted
        integrationType: 'HIRED_SPECIALIST',
        accessLevel: integrationOptions?.accessLevel || 'LIMITED',
        integrationStatus: 'PENDING_ACCEPTANCE',
        integratedBy: userId,
      },
    });

    // Set up task-specific access if specified
    if (integrationOptions?.accessLevel === 'TASK_SPECIFIC') {
      await this.setupTaskSpecificAccess(workspaceId, bookingId, booking.serviceListing.category as ServiceCategory);
    }

    return {
      success: true,
      message: `Successfully invited ${booking.serviceListing.vendor.businessName} to join the workspace`,
      data: {
        invitationId: invitation.id,
        suggestedRole,
        accessLevel: integrationOptions?.accessLevel || 'LIMITED',
        vendorInfo: {
          businessName: booking.serviceListing.vendor.businessName,
          email: booking.serviceListing.vendor.user.email,
          serviceCategory: booking.serviceListing.category,
        },
      },
    };
  }

  /**
   * Provide integrated communication tools for external team members
   * Requirements: 14.3
   */
  async setupIntegratedCommunicationForExternalMembers(
    workspaceId: string,
    userId: string
  ): Promise<WorkspaceMarketplaceIntegrationResponse> {
    // Verify user has permission to manage workspace
    await this.verifyWorkspaceManagementPermission(workspaceId, userId);

    // Get all marketplace integrations for this workspace
    const integrations = await prisma.workspaceMarketplaceIntegration.findMany({
      where: { workspaceId },
      include: {
        booking: {
          include: {
            serviceListing: {
              include: {
                vendor: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
        teamMember: {
          include: {
            user: true,
          },
        },
      },
    });

    const communicationSetup = [];

    for (const integration of integrations) {
      if (integration.teamMember) {
        // Create dedicated communication channel for external member if needed
        const channelName = `vendor-${integration.booking.serviceListing.vendor.businessName.toLowerCase().replace(/\s+/g, '-')}`;
        
        try {
          const channel = await prisma.workspaceChannel.create({
            data: {
              workspaceId,
              name: channelName,
              type: 'VENDOR_SPECIFIC',
              description: `Communication channel for ${integration.booking.serviceListing.vendor.businessName}`,
              isPrivate: true,
              members: [userId, integration.teamMember.userId], // Organizer and vendor
            },
          });

          communicationSetup.push({
            integrationType: 'DEDICATED_CHANNEL',
            vendorName: integration.booking.serviceListing.vendor.businessName,
            channelId: channel.id,
            channelName: channel.name,
          });
        } catch (error) {
          // Channel might already exist, skip
          console.log(`Channel ${channelName} might already exist`);
        }

        // Set up task-specific communication threads
        const vendorTasks = await prisma.workspaceTask.findMany({
          where: {
            workspaceId,
            assigneeId: integration.teamMemberId,
          },
        });

        for (const task of vendorTasks) {
          // Enable task-specific communication
          await prisma.workspaceTask.update({
            where: { id: task.id },
            data: {
              allowExternalComments: true,
              externalCollaborators: [integration.teamMember.userId],
            },
          });
        }

        communicationSetup.push({
          integrationType: 'TASK_COMMUNICATION',
          vendorName: integration.booking.serviceListing.vendor.businessName,
          taskCount: vendorTasks.length,
        });
      }
    }

    return {
      success: true,
      message: `Successfully set up integrated communication for ${integrations.length} external team members`,
      data: {
        communicationSetup,
        totalExternalMembers: integrations.filter(i => i.teamMember).length,
      },
    };
  }

  /**
   * Support mixed teams of volunteers and hired professionals with different access levels
   * Requirements: 14.4
   */
  async manageMixedTeamAccess(
    workspaceId: string,
    userId: string
  ): Promise<WorkspaceMarketplaceIntegrationResponse> {
    // Verify user has permission to manage workspace
    await this.verifyWorkspaceManagementPermission(workspaceId, userId);

    // Get all team members with their integration status
    const teamMembers = await prisma.teamMember.findMany({
      where: { workspaceId },
      include: {
        user: true,
        marketplaceIntegration: {
          include: {
            booking: {
              include: {
                serviceListing: true,
              },
            },
          },
        },
      },
    });

    // Categorize team members
    const volunteerMembers = teamMembers.filter(member => !member.marketplaceIntegration);
    const hiredMembers = teamMembers.filter(member => member.marketplaceIntegration);

    // Set up differentiated access levels
    const accessConfiguration = {
      volunteers: {
        count: volunteerMembers.length,
        defaultPermissions: ['VIEW_TASKS', 'UPDATE_TASK_PROGRESS', 'PARTICIPATE_IN_CHANNELS'],
        accessLevel: 'STANDARD',
        compensationTracking: false,
      },
      hiredProfessionals: {
        count: hiredMembers.length,
        defaultPermissions: ['VIEW_TASKS', 'UPDATE_TASK_PROGRESS', 'PARTICIPATE_IN_CHANNELS', 'ACCESS_VENDOR_RESOURCES'],
        accessLevel: 'PROFESSIONAL',
        compensationTracking: true,
        services: hiredMembers.map(member => ({
          memberId: member.id,
          businessName: member.marketplaceIntegration?.booking.serviceListing.vendor.businessName,
          serviceCategory: member.marketplaceIntegration?.booking.serviceListing.category,
          accessLevel: member.marketplaceIntegration?.accessLevel,
          bookingValue: member.marketplaceIntegration?.booking.finalPrice,
        })),
      },
    };

    // Update permissions for hired professionals to include compensation tracking
    for (const hiredMember of hiredMembers) {
      const enhancedPermissions = [
        ...hiredMember.permissions as string[],
        'ACCESS_COMPENSATION_INFO',
        'VIEW_SERVICE_AGREEMENT',
        'SUBMIT_DELIVERABLES',
      ];

      await prisma.teamMember.update({
        where: { id: hiredMember.id },
        data: {
          permissions: enhancedPermissions,
          memberType: 'HIRED_PROFESSIONAL',
        },
      });
    }

    // Ensure volunteers don't have access to compensation information
    for (const volunteerMember of volunteerMembers) {
      const volunteerPermissions = (volunteerMember.permissions as string[])
        .filter(permission => !permission.includes('COMPENSATION') && !permission.includes('SERVICE_AGREEMENT'));

      await prisma.teamMember.update({
        where: { id: volunteerMember.id },
        data: {
          permissions: volunteerPermissions,
          memberType: 'VOLUNTEER',
        },
      });
    }

    return {
      success: true,
      message: `Successfully configured mixed team access for ${teamMembers.length} team members`,
      data: accessConfiguration,
    };
  }

  /**
   * Maintain separation between volunteer and paid services while enabling collaboration
   * Requirements: 14.5
   */
  async maintainServiceSeparationWithCollaboration(
    workspaceId: string,
    userId: string
  ): Promise<WorkspaceMarketplaceIntegrationResponse> {
    // Verify user has permission to manage workspace
    await this.verifyWorkspaceManagementPermission(workspaceId, userId);

    // Create separate channels for different member types
    const channels = await this.setupSeparatedChannels(workspaceId);

    // Set up collaboration rules
    const collaborationRules = await this.setupCollaborationRules(workspaceId);

    // Create task assignment guidelines
    const taskGuidelines = await this.setupTaskAssignmentGuidelines(workspaceId);

    // Set up reporting separation
    const reportingSeparation = await this.setupReportingSeparation(workspaceId);

    return {
      success: true,
      message: 'Successfully set up service separation with collaboration capabilities',
      data: {
        channels,
        collaborationRules,
        taskGuidelines,
        reportingSeparation,
      },
    };
  }

  /**
   * Analyze current team composition to identify gaps
   */
  private async analyzeTeamComposition(workspaceId: string): Promise<{
    missingRoles: WorkspaceRole[];
    understaffedAreas: ServiceCategory[];
    teamSize: number;
    roleDistribution: Record<WorkspaceRole, number>;
  }> {
    const teamMembers = await prisma.teamMember.findMany({
      where: { workspaceId, status: 'ACTIVE' },
    });

    const roleDistribution: Record<WorkspaceRole, number> = {} as any;
    
    // Count current roles
    teamMembers.forEach(member => {
      roleDistribution[member.role] = (roleDistribution[member.role] || 0) + 1;
    });

    // Define ideal team composition based on workspace size
    const teamSize = teamMembers.length;
    const idealRoles: WorkspaceRole[] = [
      WorkspaceRole.EVENT_COORDINATOR,
      WorkspaceRole.MARKETING_LEAD,
      WorkspaceRole.VOLUNTEER_MANAGER,
    ];

    if (teamSize > 5) {
      idealRoles.push(WorkspaceRole.TECHNICAL_SPECIALIST);
    }

    // Identify missing roles
    const missingRoles = idealRoles.filter(role => !roleDistribution[role]);

    // Identify understaffed areas (categories with high task load but few team members)
    const tasksByCategory = await prisma.workspaceTask.groupBy({
      by: ['category'],
      where: { workspaceId },
      _count: { category: true },
    });

    const understaffedAreas: ServiceCategory[] = [];
    for (const taskGroup of tasksByCategory) {
      const categoryRole = this.mapTaskCategoryToServiceCategory(taskGroup.category);
      const workspaceRole = this.mapServiceCategoryToWorkspaceRole(categoryRole);
      
      if (taskGroup._count.category > 5 && (roleDistribution[workspaceRole] || 0) < 2) {
        understaffedAreas.push(categoryRole);
      }
    }

    return {
      missingRoles,
      understaffedAreas,
      teamSize,
      roleDistribution,
    };
  }

  /**
   * Map service category to workspace role
   */
  private mapServiceCategoryToWorkspaceRole(category: ServiceCategory): WorkspaceRole {
    const mapping: Record<ServiceCategory, WorkspaceRole> = {
      [ServiceCategory.EVENT_COORDINATION]: WorkspaceRole.EVENT_COORDINATOR,
      [ServiceCategory.MARKETING]: WorkspaceRole.MARKETING_LEAD,
      [ServiceCategory.TECHNICAL_SUPPORT]: WorkspaceRole.TECHNICAL_SPECIALIST,
      [ServiceCategory.VOLUNTEER_MANAGEMENT]: WorkspaceRole.VOLUNTEER_MANAGER,
      [ServiceCategory.LOGISTICS]: WorkspaceRole.EVENT_COORDINATOR,
      // Default mappings for other categories
      [ServiceCategory.CATERING]: WorkspaceRole.GENERAL_VOLUNTEER,
      [ServiceCategory.PHOTOGRAPHY]: WorkspaceRole.GENERAL_VOLUNTEER,
      [ServiceCategory.AUDIO_VISUAL]: WorkspaceRole.TECHNICAL_SPECIALIST,
      [ServiceCategory.VENUE]: WorkspaceRole.EVENT_COORDINATOR,
      [ServiceCategory.DECORATION]: WorkspaceRole.GENERAL_VOLUNTEER,
      [ServiceCategory.TRANSPORTATION]: WorkspaceRole.GENERAL_VOLUNTEER,
      [ServiceCategory.SECURITY]: WorkspaceRole.GENERAL_VOLUNTEER,
      [ServiceCategory.CLEANING]: WorkspaceRole.GENERAL_VOLUNTEER,
      [ServiceCategory.OTHER]: WorkspaceRole.GENERAL_VOLUNTEER,
    };

    return mapping[category] || WorkspaceRole.GENERAL_VOLUNTEER;
  }

  /**
   * Map task category to service category
   */
  private mapTaskCategoryToServiceCategory(taskCategory: string): ServiceCategory {
    const mapping: Record<string, ServiceCategory> = {
      'MARKETING': ServiceCategory.MARKETING,
      'TECHNICAL': ServiceCategory.TECHNICAL_SUPPORT,
      'LOGISTICS': ServiceCategory.LOGISTICS,
      'SETUP': ServiceCategory.EVENT_COORDINATION,
      'REGISTRATION': ServiceCategory.EVENT_COORDINATION,
      'POST_EVENT': ServiceCategory.EVENT_COORDINATION,
    };

    return mapping[taskCategory] || ServiceCategory.OTHER;
  }

  /**
   * Set up task-specific access for hired specialists
   */
  private async setupTaskSpecificAccess(
    workspaceId: string,
    bookingId: string,
    serviceCategory: ServiceCategory
  ): Promise<void> {
    // Create tasks specific to the hired service
    const taskCategory = this.mapServiceCategoryToTaskCategory(serviceCategory);
    
    // Find existing tasks in this category that could be assigned to the specialist
    const relevantTasks = await prisma.workspaceTask.findMany({
      where: {
        workspaceId,
        category: taskCategory,
        assigneeId: null, // Unassigned tasks
      },
    });

    // Mark these tasks as available for the specialist
    for (const task of relevantTasks) {
      await prisma.workspaceTask.update({
        where: { id: task.id },
        data: {
          availableForExternalAssignment: true,
          externalAssignmentBookingId: bookingId,
        },
      });
    }
  }

  /**
   * Map service category to task category
   */
  private mapServiceCategoryToTaskCategory(serviceCategory: ServiceCategory): string {
    const mapping: Record<ServiceCategory, string> = {
      [ServiceCategory.EVENT_COORDINATION]: 'SETUP',
      [ServiceCategory.MARKETING]: 'MARKETING',
      [ServiceCategory.TECHNICAL_SUPPORT]: 'TECHNICAL',
      [ServiceCategory.VOLUNTEER_MANAGEMENT]: 'SETUP',
      [ServiceCategory.LOGISTICS]: 'LOGISTICS',
    };

    return mapping[serviceCategory] || 'SETUP';
  }

  /**
   * Set up separated channels for different member types
   */
  private async setupSeparatedChannels(workspaceId: string): Promise<any> {
    const channels = [];

    // Create volunteer-only channel
    try {
      const volunteerChannel = await prisma.workspaceChannel.create({
        data: {
          workspaceId,
          name: 'volunteers-only',
          type: 'ROLE_BASED',
          description: 'Private channel for volunteer team members',
          isPrivate: true,
          memberTypes: ['VOLUNTEER'],
        },
      });
      channels.push({ type: 'VOLUNTEER_ONLY', channelId: volunteerChannel.id });
    } catch (error) {
      // Channel might already exist
    }

    // Create professional services channel
    try {
      const professionalChannel = await prisma.workspaceChannel.create({
        data: {
          workspaceId,
          name: 'professional-services',
          type: 'ROLE_BASED',
          description: 'Channel for hired professional services coordination',
          isPrivate: true,
          memberTypes: ['HIRED_PROFESSIONAL'],
        },
      });
      channels.push({ type: 'PROFESSIONAL_ONLY', channelId: professionalChannel.id });
    } catch (error) {
      // Channel might already exist
    }

    // Keep general channel for mixed collaboration
    channels.push({ type: 'MIXED_COLLABORATION', note: 'General channel remains for mixed team collaboration' });

    return channels;
  }

  /**
   * Set up collaboration rules
   */
  private async setupCollaborationRules(workspaceId: string): Promise<any> {
    const rules = {
      taskCollaboration: {
        volunteers: 'Can collaborate on all general tasks',
        professionals: 'Can collaborate on tasks within their service scope',
        mixed: 'Both can collaborate on shared deliverables',
      },
      informationSharing: {
        volunteers: 'Access to general event information and volunteer-specific resources',
        professionals: 'Access to service-specific information and professional resources',
        restricted: 'Compensation and contract details remain separate',
      },
      communication: {
        general: 'Mixed communication in general channels',
        specific: 'Separate channels for member-type specific discussions',
        taskBased: 'Task-specific communication includes relevant members regardless of type',
      },
    };

    // Store rules in workspace settings
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        settings: {
          collaborationRules: rules,
        },
      },
    });

    return rules;
  }

  /**
   * Set up task assignment guidelines
   */
  private async setupTaskAssignmentGuidelines(workspaceId: string): Promise<any> {
    const guidelines = {
      volunteers: {
        eligibleTasks: ['SETUP', 'REGISTRATION', 'POST_EVENT', 'GENERAL'],
        restrictions: ['Cannot access paid service deliverables', 'Cannot view compensation information'],
      },
      professionals: {
        eligibleTasks: ['Service-specific tasks', 'Professional deliverables', 'Contracted work'],
        restrictions: ['Limited to contracted scope', 'Cannot access volunteer coordination'],
      },
      mixed: {
        eligibleTasks: ['Collaborative tasks', 'Cross-functional deliverables'],
        guidelines: ['Both types can contribute', 'Clear role definitions maintained'],
      },
    };

    return guidelines;
  }

  /**
   * Set up reporting separation
   */
  private async setupReportingSeparation(workspaceId: string): Promise<any> {
    const separation = {
      volunteerReports: {
        includes: ['Task completion', 'Volunteer hours', 'Team collaboration metrics'],
        excludes: ['Service costs', 'Professional deliverables', 'Contract details'],
      },
      professionalReports: {
        includes: ['Service deliverables', 'Contract milestones', 'Professional performance'],
        excludes: ['Volunteer personal information', 'Internal team discussions'],
      },
      combinedReports: {
        includes: ['Overall project progress', 'Mixed team collaboration', 'Event success metrics'],
        note: 'Aggregated data without sensitive details',
      },
    };

    return separation;
  }

  /**
   * Verify user has workspace management permission
   */
  private async verifyWorkspaceManagementPermission(workspaceId: string, userId: string): Promise<void> {
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

    const permissions = teamMember.permissions as string[];
    if (!permissions.includes('MANAGE_WORKSPACE') && !permissions.includes('MANAGE_TEAM')) {
      throw new Error('Access denied: User does not have workspace management permissions');
    }
  }
}

export const workspaceMarketplaceIntegrationService = new WorkspaceMarketplaceIntegrationService();