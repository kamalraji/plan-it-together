import { PrismaClient, UserRole, RegistrationStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

export interface SendEmailDTO {
  to: string[];
  subject: string;
  body: string;
  templateId?: string;
  variables?: Record<string, string>;
}

export interface BulkEmailDTO {
  eventId: string;
  subject: string;
  body: string;
  templateId?: string;
  segmentCriteria: SegmentCriteria;
}

export interface SegmentCriteria {
  roles?: UserRole[];
  registrationStatus?: RegistrationStatus[];
  attendanceStatus?: 'ATTENDED' | 'NOT_ATTENDED';
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface BulkEmailResult {
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  communicationLogId: string;
}

class CommunicationService {
  // In-memory email templates (in production, these would be in database)
  private templates: Map<string, EmailTemplate> = new Map([
    [
      'welcome',
      {
        id: 'welcome',
        name: 'Welcome Email',
        subject: 'Welcome to {{eventName}}',
        body: 'Hello {{userName}},\n\nWelcome to {{eventName}}! We are excited to have you join us.\n\nBest regards,\nThe Team',
        variables: ['eventName', 'userName'],
      },
    ],
    [
      'reminder',
      {
        id: 'reminder',
        name: 'Event Reminder',
        subject: 'Reminder: {{eventName}} is coming up!',
        body: 'Hello {{userName}},\n\nThis is a reminder that {{eventName}} is scheduled for {{eventDate}}.\n\nSee you there!\n\nBest regards,\nThe Team',
        variables: ['eventName', 'userName', 'eventDate'],
      },
    ],
    [
      'certificate',
      {
        id: 'certificate',
        name: 'Certificate Notification',
        subject: 'Your certificate for {{eventName}}',
        body: 'Hello {{userName}},\n\nCongratulations! Your certificate for {{eventName}} is ready.\n\nPlease find it attached to this email.\n\nBest regards,\nThe Team',
        variables: ['eventName', 'userName'],
      },
    ],
  ]);

  /**
   * Send a single email
   * In production, this would integrate with SendGrid or AWS SES
   */
  async sendEmail(emailData: SendEmailDTO): Promise<EmailResult> {
    try {
      let { subject, body } = emailData;

      // If template is specified, use it
      if (emailData.templateId) {
        const template = this.templates.get(emailData.templateId);
        if (template) {
          subject = template.subject;
          body = template.body;

          // Replace variables
          if (emailData.variables) {
            Object.entries(emailData.variables).forEach(([key, value]) => {
              subject = subject.replace(`{{${key}}}`, value);
              body = body.replace(new RegExp(`{{${key}}}`, 'g'), value);
            });
          }
        }
      }

      // Simulate email sending (in production, use SendGrid/SES)
      console.log('Sending email:', {
        to: emailData.to,
        subject,
        body: body.substring(0, 100) + '...',
      });

      // Simulate success
      return {
        success: true,
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send bulk email to segmented recipients
   */
  async sendBulkEmail(bulkEmailData: BulkEmailDTO): Promise<BulkEmailResult> {
    const { eventId, subject, body, segmentCriteria } = bulkEmailData;

    // Get segmented recipients
    const recipients = await this.segmentRecipients(eventId, segmentCriteria);

    let successCount = 0;
    let failureCount = 0;

    // Send email to each recipient
    for (const recipient of recipients) {
      const result = await this.sendEmail({
        to: [recipient.email],
        subject,
        body,
        templateId: bulkEmailData.templateId,
        variables: {
          userName: recipient.name,
          userEmail: recipient.email,
        },
      });

      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    // Log the communication
    const communicationLog = await this.logCommunication(
      eventId,
      recipients[0]?.id || 'system', // In production, get from authenticated user
      recipients.length,
      subject,
      failureCount === 0 ? 'SENT' : failureCount === recipients.length ? 'FAILED' : 'PARTIAL'
    );

    return {
      totalRecipients: recipients.length,
      successCount,
      failureCount,
      communicationLogId: communicationLog.id,
    };
  }

  /**
   * Segment recipients based on criteria
   */
  async segmentRecipients(
    eventId: string,
    criteria: SegmentCriteria
  ): Promise<Array<{ id: string; email: string; name: string }>> {
    const { roles, registrationStatus, attendanceStatus } = criteria;

    // Build query conditions
    const where: any = {
      registrations: {
        some: {
          eventId,
        },
      },
    };

    // Filter by roles
    if (roles && roles.length > 0) {
      where.role = {
        in: roles,
      };
    }

    // Get users with registrations
    const users = await prisma.user.findMany({
      where,
      include: {
        registrations: {
          where: {
            eventId,
            ...(registrationStatus && registrationStatus.length > 0
              ? { status: { in: registrationStatus } }
              : {}),
          },
          include: {
            attendance: true,
          },
        },
      },
    });

    // Filter by attendance status if specified
    let filteredUsers = users;
    if (attendanceStatus) {
      filteredUsers = users.filter((user) => {
        const hasAttendance = user.registrations.some(
          (reg) => reg.attendance.length > 0
        );
        return attendanceStatus === 'ATTENDED' ? hasAttendance : !hasAttendance;
      });
    }

    // Filter by registration status
    if (registrationStatus && registrationStatus.length > 0) {
      filteredUsers = filteredUsers.filter((user) =>
        user.registrations.some((reg) =>
          registrationStatus.includes(reg.status)
        )
      );
    }

    return filteredUsers.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
    }));
  }

  /**
   * Log communication
   */
  async logCommunication(
    eventId: string,
    senderId: string,
    recipientCount: number,
    subject: string,
    status: 'SENT' | 'FAILED' | 'PARTIAL'
  ): Promise<{ id: string }> {
    const log = await prisma.communicationLog.create({
      data: {
        eventId,
        senderId,
        recipientCount,
        subject,
        status,
      },
    });

    return { id: log.id };
  }

  /**
   * Get email templates for an event
   */
  async getEmailTemplates(eventId: string): Promise<EmailTemplate[]> {
    // In production, fetch from database filtered by event
    // For now, return all templates
    return Array.from(this.templates.values());
  }

  /**
   * Get communication logs for an event
   */
  async getCommunicationLogs(eventId: string): Promise<any[]> {
    const logs = await prisma.communicationLog.findMany({
      where: { eventId },
      include: {
        sender: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { sentAt: 'desc' },
    });

    return logs;
  }

  /**
   * Get communication log by ID
   */
  async getCommunicationLog(logId: string): Promise<any> {
    const log = await prisma.communicationLog.findUnique({
      where: { id: logId },
      include: {
        sender: {
          select: {
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            name: true,
          },
        },
      },
    });

    return log;
  }
}

export const communicationService = new CommunicationService();
