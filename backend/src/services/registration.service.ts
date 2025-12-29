import { PrismaClient, RegistrationStatus } from '@prisma/client';
import {
  RegistrationDTO,
  RegistrationResponse,
  WaitlistEntry,
} from '../types';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

export class RegistrationService {
  /**
   * Register a participant for an event
   */
  async registerParticipant(
    registrationData: RegistrationDTO
  ): Promise<RegistrationResponse> {
    const { eventId, userId, formResponses } = registrationData;

    // Validate required fields
    this.validateRegistrationData(formResponses);

    // Get event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        registrations: {
          where: {
            status: RegistrationStatus.CONFIRMED,
          },
        },
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    // Check if user is already registered
    const existingRegistration = await prisma.registration.findFirst({
      where: {
        eventId,
        userId,
        status: {
          not: RegistrationStatus.CANCELLED,
        },
      },
    });

    if (existingRegistration) {
      throw new Error('User is already registered for this event');
    }

    // Determine registration status based on capacity
    let status: RegistrationStatus = RegistrationStatus.CONFIRMED;
    if (event.capacity) {
      const confirmedCount = event.registrations.length;
      if (confirmedCount >= event.capacity) {
        status = RegistrationStatus.WAITLISTED;
      }
    }

    // Generate unique QR code
    const qrCode = await this.generateUniqueQRCode();

    // Create registration
    const registration = await prisma.registration.create({
      data: {
        eventId,
        userId,
        status,
        formResponses: formResponses as any,
        qrCode,
      },
    });

    return this.mapRegistrationToResponse(registration);
  }

  /**
   * Update registration status
   */
  async updateRegistrationStatus(
    registrationId: string,
    status: RegistrationStatus
  ): Promise<RegistrationResponse> {
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
    });

    if (!registration) {
      throw new Error('Registration not found');
    }

    const updated = await prisma.registration.update({
      where: { id: registrationId },
      data: { status },
    });

    return this.mapRegistrationToResponse(updated);
  }

  /**
   * Get waitlist for an event
   */
  async getWaitlist(eventId: string): Promise<WaitlistEntry[]> {
    const waitlistedRegistrations = await prisma.registration.findMany({
      where: {
        eventId,
        status: RegistrationStatus.WAITLISTED,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        registeredAt: 'asc',
      },
    });

    return waitlistedRegistrations.map((reg, index) => ({
      id: reg.id,
      userId: reg.userId,
      userName: reg.user.name,
      userEmail: reg.user.email,
      registeredAt: reg.registeredAt,
      position: index + 1,
    }));
  }

  /**
   * Approve a waitlisted participant
   */
  async approveWaitlistEntry(registrationId: string): Promise<RegistrationResponse> {
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        event: {
          include: {
            registrations: {
              where: {
                status: RegistrationStatus.CONFIRMED,
              },
            },
          },
        },
      },
    });

    if (!registration) {
      throw new Error('Registration not found');
    }

    if (registration.status !== RegistrationStatus.WAITLISTED) {
      throw new Error('Registration is not on the waitlist');
    }

    // Check if there's capacity available
    const event = registration.event;
    if (event.capacity) {
      const confirmedCount = event.registrations.length;
      if (confirmedCount >= event.capacity) {
        throw new Error('Event is at full capacity');
      }
    }

    // Update status to confirmed
    const updated = await prisma.registration.update({
      where: { id: registrationId },
      data: { status: RegistrationStatus.CONFIRMED },
    });

    return this.mapRegistrationToResponse(updated);
  }

  /**
   * Get registration by ID
   */
  async getRegistration(registrationId: string): Promise<RegistrationResponse> {
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
    });

    if (!registration) {
      throw new Error('Registration not found');
    }

    return this.mapRegistrationToResponse(registration);
  }

  /**
   * Get registrations for an event
   */
  async getEventRegistrations(
    eventId: string,
    status?: RegistrationStatus
  ): Promise<RegistrationResponse[]> {
    const where: any = { eventId };
    if (status) {
      where.status = status;
    }

    const registrations = await prisma.registration.findMany({
      where,
      orderBy: { registeredAt: 'desc' },
    });

    return registrations.map((reg) => this.mapRegistrationToResponse(reg));
  }

  /**
   * Get user's registrations
   */
  async getUserRegistrations(userId: string): Promise<RegistrationResponse[]> {
    const registrations = await prisma.registration.findMany({
      where: { userId },
      orderBy: { registeredAt: 'desc' },
    });

    return registrations.map((reg) => this.mapRegistrationToResponse(reg));
  }

  /**
   * Cancel a registration
   */
  async cancelRegistration(registrationId: string): Promise<RegistrationResponse> {
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
    });

    if (!registration) {
      throw new Error('Registration not found');
    }

    const updated = await prisma.registration.update({
      where: { id: registrationId },
      data: { status: RegistrationStatus.CANCELLED },
    });

    return this.mapRegistrationToResponse(updated);
  }

  /**
   * Validate registration form data
   */
  private validateRegistrationData(formResponses: Record<string, any>): void {
    if (!formResponses || Object.keys(formResponses).length === 0) {
      throw new Error('Form responses are required');
    }

    // Check for required fields (this would be customizable per event in a real implementation)
    // For now, we just ensure formResponses is not empty
  }

  /**
   * Generate a unique QR code
   */
  private async generateUniqueQRCode(): Promise<string> {
    let qrCode: string;
    let isUnique = false;

    while (!isUnique) {
      // Generate a random 32-character hex string
      qrCode = randomBytes(16).toString('hex');

      // Check if it's unique
      const existing = await prisma.registration.findUnique({
        where: { qrCode },
      });

      if (!existing) {
        isUnique = true;
        return qrCode;
      }
    }

    throw new Error('Failed to generate unique QR code');
  }

  /**
   * Map database registration to response format
   */
  private mapRegistrationToResponse(registration: any): RegistrationResponse {
    return {
      id: registration.id,
      eventId: registration.eventId,
      userId: registration.userId,
      status: registration.status,
      formResponses: registration.formResponses as Record<string, any>,
      qrCode: registration.qrCode,
      registeredAt: registration.registeredAt,
      updatedAt: registration.updatedAt,
    };
  }
}

export const registrationService = new RegistrationService();
