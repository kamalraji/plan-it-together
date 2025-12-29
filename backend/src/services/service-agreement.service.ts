import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface Deliverable {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  completedAt?: Date;
}

export interface PaymentMilestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  dueDate: Date;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  paidAt?: Date;
}

export interface ServiceAgreementTemplate {
  id: string;
  name: string;
  category: string;
  terms: string;
  deliverableTemplates: Omit<Deliverable, 'id' | 'status' | 'completedAt'>[];
  paymentScheduleTemplate: Omit<PaymentMilestone, 'id' | 'status' | 'paidAt'>[];
  cancellationPolicy: string;
}

export interface CreateServiceAgreementDTO {
  bookingId: string;
  templateId?: string;
  customTerms?: string;
  deliverables: Omit<Deliverable, 'id' | 'status' | 'completedAt'>[];
  paymentSchedule: Omit<PaymentMilestone, 'id' | 'status' | 'paidAt'>[];
  cancellationPolicy?: string;
}

export interface ServiceAgreementResponse {
  id: string;
  bookingId: string;
  terms: string;
  deliverables: Deliverable[];
  paymentSchedule: PaymentMilestone[];
  cancellationPolicy: string;
  signedAt?: Date;
  organizerSignature?: string;
  vendorSignature?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DigitalSignatureDTO {
  agreementId: string;
  signatureType: 'ORGANIZER' | 'VENDOR';
  signature: string; // Base64 encoded signature or signature ID from e-signature provider
  ipAddress?: string;
  userAgent?: string;
}

export class ServiceAgreementService {
  /**
   * Get default agreement templates
   */
  async getAgreementTemplates(): Promise<ServiceAgreementTemplate[]> {
    // In production, these would be stored in the database
    return [
      {
        id: 'catering-template',
        name: 'Catering Service Agreement',
        category: 'CATERING',
        terms: `
CATERING SERVICE AGREEMENT

This agreement is entered into between the Event Organizer and the Catering Service Provider for the provision of catering services.

1. SCOPE OF SERVICES
The Vendor agrees to provide catering services as specified in the booking request, including but not limited to:
- Food preparation and service
- Setup and cleanup
- Service staff as required
- All necessary equipment and supplies

2. QUALITY STANDARDS
All food and beverages shall be prepared in accordance with local health regulations and industry standards. The Vendor warrants that all food will be fresh, properly prepared, and safe for consumption.

3. CANCELLATION AND CHANGES
Changes to the order must be made at least 48 hours in advance. Cancellations made less than 72 hours before the event may be subject to cancellation fees.

4. LIABILITY
The Vendor maintains appropriate insurance coverage and agrees to indemnify the Organizer against claims arising from the provision of services.

5. FORCE MAJEURE
Neither party shall be liable for delays or failures in performance resulting from circumstances beyond their reasonable control.
        `.trim(),
        deliverableTemplates: [
          {
            title: 'Menu Finalization',
            description: 'Finalize menu selections and dietary requirements',
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
          },
          {
            title: 'Equipment Setup',
            description: 'Setup all catering equipment and stations',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          },
          {
            title: 'Food Service',
            description: 'Provide catering service during the event',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Event date
          },
          {
            title: 'Cleanup',
            description: 'Complete cleanup and equipment removal',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // After event
          },
        ],
        paymentScheduleTemplate: [
          {
            title: 'Deposit',
            description: '50% deposit upon agreement signing',
            amount: 0, // Will be calculated based on total
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          },
          {
            title: 'Final Payment',
            description: 'Remaining balance due after service completion',
            amount: 0, // Will be calculated based on total
            dueDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000), // 2 days after event
          },
        ],
        cancellationPolicy: `
CANCELLATION POLICY

- Cancellations made more than 30 days before the event: Full refund minus 10% processing fee
- Cancellations made 15-30 days before the event: 50% refund
- Cancellations made 7-14 days before the event: 25% refund
- Cancellations made less than 7 days before the event: No refund

Changes to guest count:
- Increases can be accommodated up to 48 hours before the event (subject to availability)
- Decreases of more than 10% made less than 72 hours before the event may incur charges
        `.trim(),
      },
      {
        id: 'photography-template',
        name: 'Photography Service Agreement',
        category: 'PHOTOGRAPHY',
        terms: `
PHOTOGRAPHY SERVICE AGREEMENT

This agreement is entered into between the Event Organizer and the Photography Service Provider for the provision of photography services.

1. SCOPE OF SERVICES
The Photographer agrees to provide photography services including:
- Event coverage as specified in the booking
- Professional editing and post-processing
- Digital delivery of final images
- Usage rights as specified

2. DELIVERABLES
- High-resolution edited images
- Online gallery for viewing and downloading
- Print release for personal use
- Delivery within specified timeframe

3. COPYRIGHT AND USAGE
The Photographer retains copyright to all images. The Client receives usage rights for personal and promotional use as specified in this agreement.

4. CANCELLATION POLICY
Cancellation terms and refund policies are outlined in the attached schedule.

5. LIABILITY
The Photographer's liability is limited to the amount paid for services. The Photographer is not responsible for missed shots due to circumstances beyond their control.
        `.trim(),
        deliverableTemplates: [
          {
            title: 'Pre-Event Consultation',
            description: 'Discuss shot list and event timeline',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
          {
            title: 'Event Photography',
            description: 'Provide photography coverage during the event',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          {
            title: 'Image Editing',
            description: 'Professional editing and post-processing of selected images',
            dueDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000),
          },
          {
            title: 'Final Delivery',
            description: 'Deliver final edited images via online gallery',
            dueDate: new Date(Date.now() + 44 * 24 * 60 * 60 * 1000),
          },
        ],
        paymentScheduleTemplate: [
          {
            title: 'Booking Deposit',
            description: '30% deposit to secure booking',
            amount: 0,
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          },
          {
            title: 'Pre-Event Payment',
            description: '50% payment due 7 days before event',
            amount: 0,
            dueDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
          },
          {
            title: 'Final Payment',
            description: 'Final 20% payment due upon delivery',
            amount: 0,
            dueDate: new Date(Date.now() + 44 * 24 * 60 * 60 * 1000),
          },
        ],
        cancellationPolicy: `
PHOTOGRAPHY CANCELLATION POLICY

- Cancellations made more than 60 days before the event: Full refund minus $100 processing fee
- Cancellations made 30-60 days before the event: 75% refund
- Cancellations made 14-29 days before the event: 50% refund
- Cancellations made 7-13 days before the event: 25% refund
- Cancellations made less than 7 days before the event: No refund

Weather Policy:
- For outdoor events, alternative indoor locations or rescheduling options will be discussed
- No additional charges for reasonable weather-related adjustments
        `.trim(),
      },
      {
        id: 'venue-template',
        name: 'Venue Rental Agreement',
        category: 'VENUE',
        terms: `
VENUE RENTAL AGREEMENT

This agreement is entered into between the Event Organizer and the Venue Provider for the rental of event space.

1. VENUE USAGE
The Venue agrees to provide the specified space for the agreed-upon date and time, including:
- Access to the rental space
- Basic utilities (electricity, water, heating/cooling)
- Parking facilities as available
- Security as specified

2. RESTRICTIONS
The Client agrees to comply with all venue policies including:
- Occupancy limits
- Noise restrictions
- Decoration guidelines
- Catering restrictions
- Alcohol policies

3. DAMAGE AND LIABILITY
The Client is responsible for any damage to the venue beyond normal wear and tear. A security deposit may be required.

4. SETUP AND BREAKDOWN
Setup and breakdown times are specified in the booking details. Additional time may be available for an additional fee.

5. FORCE MAJEURE
The Venue is not liable for circumstances beyond its control that may affect the event.
        `.trim(),
        deliverableTemplates: [
          {
            title: 'Venue Walkthrough',
            description: 'Conduct pre-event venue walkthrough and planning session',
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
          {
            title: 'Venue Preparation',
            description: 'Prepare venue space according to event requirements',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          {
            title: 'Event Day Support',
            description: 'Provide on-site support during the event',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          {
            title: 'Post-Event Inspection',
            description: 'Conduct post-event inspection and damage assessment',
            dueDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
          },
        ],
        paymentScheduleTemplate: [
          {
            title: 'Security Deposit',
            description: 'Refundable security deposit',
            amount: 0,
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          },
          {
            title: 'Rental Payment',
            description: 'Full rental payment',
            amount: 0,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        ],
        cancellationPolicy: `
VENUE CANCELLATION POLICY

- Cancellations made more than 90 days before the event: Full refund minus $200 processing fee
- Cancellations made 60-90 days before the event: 80% refund
- Cancellations made 30-59 days before the event: 60% refund
- Cancellations made 14-29 days before the event: 40% refund
- Cancellations made less than 14 days before the event: No refund

Security Deposit:
- Refunded within 14 days after the event if no damage occurs
- Partial refund if minor damage occurs
- May be forfeited for significant damage or policy violations
        `.trim(),
      },
    ];
  }

  /**
   * Generate service agreement for a booking
   */
  async generateServiceAgreement(
    bookingId: string,
    agreementData: CreateServiceAgreementDTO
  ): Promise<ServiceAgreementResponse> {
    // Verify booking exists and get details
    const booking = await prisma.bookingRequest.findUnique({
      where: { id: bookingId },
      include: {
        event: true,
        serviceListing: true,
        organizer: true,
        vendor: { include: { user: true } },
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status !== 'QUOTE_ACCEPTED') {
      throw new Error('Service agreement can only be generated for accepted quotes');
    }

    // Check if agreement already exists
    const existingAgreement = await prisma.serviceAgreement.findUnique({
      where: { bookingId },
    });

    if (existingAgreement) {
      throw new Error('Service agreement already exists for this booking');
    }

    let terms = agreementData.customTerms || '';
    let deliverables = agreementData.deliverables;
    let paymentSchedule = agreementData.paymentSchedule;
    let cancellationPolicy = agreementData.cancellationPolicy || '';

    // If using a template, merge template data
    if (agreementData.templateId) {
      const templates = await this.getAgreementTemplates();
      const template = templates.find(t => t.id === agreementData.templateId);
      
      if (template) {
        terms = agreementData.customTerms || template.terms;
        cancellationPolicy = agreementData.cancellationPolicy || template.cancellationPolicy;
        
        // Merge deliverables (custom ones override template)
        if (agreementData.deliverables.length === 0) {
          deliverables = template.deliverableTemplates.map(d => ({
            ...d,
            dueDate: this.adjustDateForEvent(d.dueDate, booking.serviceDate),
          }));
        }
        
        // Merge payment schedule (custom ones override template)
        if (agreementData.paymentSchedule.length === 0) {
          const totalAmount = booking.finalPrice || booking.quotedPrice || 0;
          paymentSchedule = template.paymentScheduleTemplate.map((p) => ({
            ...p,
            amount: this.calculateMilestoneAmount(p, totalAmount, template.paymentScheduleTemplate),
            dueDate: this.adjustDateForEvent(p.dueDate, booking.serviceDate),
          }));
        }
      }
    }

    // Add unique IDs to deliverables and payment milestones
    const deliverablesWithIds: Deliverable[] = deliverables.map(d => ({
      ...d,
      id: `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'PENDING' as const,
    }));

    const paymentScheduleWithIds: PaymentMilestone[] = paymentSchedule.map(p => ({
      ...p,
      id: `mil_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'PENDING' as const,
    }));

    // Personalize the agreement with booking details
    const personalizedTerms = this.personalizeAgreementTerms(terms, booking);

    // Create the service agreement
    const agreement = await prisma.serviceAgreement.create({
      data: {
        bookingId,
        terms: personalizedTerms,
        deliverables: deliverablesWithIds as any,
        paymentSchedule: paymentScheduleWithIds as any,
        cancellationPolicy,
      },
    });

    return this.mapAgreementToResponse(agreement);
  }

  /**
   * Get service agreement by booking ID
   */
  async getServiceAgreement(bookingId: string): Promise<ServiceAgreementResponse> {
    const agreement = await prisma.serviceAgreement.findUnique({
      where: { bookingId },
    });

    if (!agreement) {
      throw new Error('Service agreement not found');
    }

    return this.mapAgreementToResponse(agreement);
  }

  /**
   * Update service agreement
   */
  async updateServiceAgreement(
    agreementId: string,
    updates: Partial<CreateServiceAgreementDTO>
  ): Promise<ServiceAgreementResponse> {
    const agreement = await prisma.serviceAgreement.findUnique({
      where: { id: agreementId },
    });

    if (!agreement) {
      throw new Error('Service agreement not found');
    }

    if (agreement.signedAt) {
      throw new Error('Cannot update a signed agreement');
    }

    const updateData: any = {};
    
    if (updates.customTerms) {
      updateData.terms = updates.customTerms;
    }
    
    if (updates.deliverables) {
      const deliverablesWithIds = updates.deliverables.map(d => ({
        ...d,
        id: `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'PENDING' as const,
      }));
      updateData.deliverables = deliverablesWithIds;
    }
    
    if (updates.paymentSchedule) {
      const paymentScheduleWithIds = updates.paymentSchedule.map(p => ({
        ...p,
        id: `mil_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'PENDING' as const,
      }));
      updateData.paymentSchedule = paymentScheduleWithIds;
    }
    
    if (updates.cancellationPolicy) {
      updateData.cancellationPolicy = updates.cancellationPolicy;
    }

    const updated = await prisma.serviceAgreement.update({
      where: { id: agreementId },
      data: updateData,
    });

    return this.mapAgreementToResponse(updated);
  }

  /**
   * Sign service agreement digitally
   */
  async signAgreement(signatureData: DigitalSignatureDTO): Promise<ServiceAgreementResponse> {
    const agreement = await prisma.serviceAgreement.findUnique({
      where: { id: signatureData.agreementId },
      include: {
        booking: {
          include: {
            organizer: true,
            vendor: { include: { user: true } },
          },
        },
      },
    });

    if (!agreement) {
      throw new Error('Service agreement not found');
    }

    if (agreement.signedAt) {
      throw new Error('Agreement is already fully signed');
    }

    const updateData: any = {};

    if (signatureData.signatureType === 'ORGANIZER') {
      if (agreement.organizerSignature) {
        throw new Error('Organizer has already signed this agreement');
      }
      updateData.organizerSignature = signatureData.signature;
    } else if (signatureData.signatureType === 'VENDOR') {
      if (agreement.vendorSignature) {
        throw new Error('Vendor has already signed this agreement');
      }
      updateData.vendorSignature = signatureData.signature;
    }

    // If both parties have now signed, mark as fully signed
    const organizerSigned = signatureData.signatureType === 'ORGANIZER' || agreement.organizerSignature;
    const vendorSigned = signatureData.signatureType === 'VENDOR' || agreement.vendorSignature;

    if (organizerSigned && vendorSigned) {
      updateData.signedAt = new Date();
    }

    const updated = await prisma.serviceAgreement.update({
      where: { id: signatureData.agreementId },
      data: updateData,
    });

    // If agreement is now fully signed, update booking status
    if (updated.signedAt) {
      await prisma.bookingRequest.update({
        where: { id: agreement.bookingId },
        data: { status: 'CONFIRMED' },
      });
    }

    return this.mapAgreementToResponse(updated);
  }

  /**
   * Update deliverable status
   */
  async updateDeliverableStatus(
    agreementId: string,
    deliverableId: string,
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE'
  ): Promise<ServiceAgreementResponse> {
    const agreement = await prisma.serviceAgreement.findUnique({
      where: { id: agreementId },
    });

    if (!agreement) {
      throw new Error('Service agreement not found');
    }

    const deliverables = agreement.deliverables as unknown as Deliverable[];
    const deliverableIndex = deliverables.findIndex(d => d.id === deliverableId);

    if (deliverableIndex === -1) {
      throw new Error('Deliverable not found');
    }

    deliverables[deliverableIndex].status = status;
    if (status === 'COMPLETED') {
      deliverables[deliverableIndex].completedAt = new Date();
    }

    const updated = await prisma.serviceAgreement.update({
      where: { id: agreementId },
      data: { deliverables: deliverables as any },
    });

    return this.mapAgreementToResponse(updated);
  }

  /**
   * Update payment milestone status
   */
  async updateMilestoneStatus(
    agreementId: string,
    milestoneId: string,
    status: 'PENDING' | 'PAID' | 'OVERDUE'
  ): Promise<ServiceAgreementResponse> {
    const agreement = await prisma.serviceAgreement.findUnique({
      where: { id: agreementId },
    });

    if (!agreement) {
      throw new Error('Service agreement not found');
    }

    const paymentSchedule = agreement.paymentSchedule as unknown as PaymentMilestone[];
    const milestoneIndex = paymentSchedule.findIndex(m => m.id === milestoneId);

    if (milestoneIndex === -1) {
      throw new Error('Payment milestone not found');
    }

    paymentSchedule[milestoneIndex].status = status;
    if (status === 'PAID') {
      paymentSchedule[milestoneIndex].paidAt = new Date();
    }

    const updated = await prisma.serviceAgreement.update({
      where: { id: agreementId },
      data: { paymentSchedule: paymentSchedule as any },
    });

    return this.mapAgreementToResponse(updated);
  }

  /**
   * Get agreement progress summary
   */
  async getAgreementProgress(agreementId: string): Promise<any> {
    const agreement = await prisma.serviceAgreement.findUnique({
      where: { id: agreementId },
    });

    if (!agreement) {
      throw new Error('Service agreement not found');
    }

    const deliverables = agreement.deliverables as unknown as Deliverable[];
    const paymentSchedule = agreement.paymentSchedule as unknown as PaymentMilestone[];

    const deliverableProgress = {
      total: deliverables.length,
      completed: deliverables.filter(d => d.status === 'COMPLETED').length,
      inProgress: deliverables.filter(d => d.status === 'IN_PROGRESS').length,
      overdue: deliverables.filter(d => d.status === 'OVERDUE').length,
    };

    const paymentProgress = {
      total: paymentSchedule.length,
      paid: paymentSchedule.filter(m => m.status === 'PAID').length,
      overdue: paymentSchedule.filter(m => m.status === 'OVERDUE').length,
      totalAmount: paymentSchedule.reduce((sum, m) => sum + m.amount, 0),
      paidAmount: paymentSchedule.filter(m => m.status === 'PAID').reduce((sum, m) => sum + m.amount, 0),
    };

    return {
      agreementId,
      isSigned: !!agreement.signedAt,
      organizerSigned: !!agreement.organizerSignature,
      vendorSigned: !!agreement.vendorSignature,
      deliverableProgress,
      paymentProgress,
      overallProgress: {
        deliverablesComplete: deliverableProgress.total > 0 ? (deliverableProgress.completed / deliverableProgress.total) * 100 : 100,
        paymentsComplete: paymentProgress.total > 0 ? (paymentProgress.paid / paymentProgress.total) * 100 : 100,
      },
    };
  }

  /**
   * Helper: Adjust template dates based on event date
   */
  private adjustDateForEvent(templateDate: Date, eventDate: Date): Date {
    const now = new Date();
    const daysUntilEvent = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const templateDaysFromNow = Math.ceil((templateDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // If template date is after event date, adjust it to be before event
    if (templateDaysFromNow > daysUntilEvent) {
      const adjustedDays = Math.max(1, Math.floor(daysUntilEvent * 0.8)); // 80% of time until event
      return new Date(now.getTime() + adjustedDays * 24 * 60 * 60 * 1000);
    }
    
    return templateDate;
  }

  /**
   * Helper: Calculate milestone amount based on template percentages
   */
  private calculateMilestoneAmount(
    milestone: Omit<PaymentMilestone, 'id' | 'status' | 'paidAt'>,
    totalAmount: number,
    allMilestones: Omit<PaymentMilestone, 'id' | 'status' | 'paidAt'>[]
  ): number {
    // Simple percentage-based calculation
    // In a real implementation, you might have more sophisticated logic
    const milestoneCount = allMilestones.length;
    const isDeposit = milestone.title.toLowerCase().includes('deposit');
    const isFinal = milestone.title.toLowerCase().includes('final');
    
    if (isDeposit) {
      return totalAmount * 0.5; // 50% deposit
    } else if (isFinal) {
      return totalAmount * 0.5; // 50% final payment
    } else {
      // Distribute evenly among other milestones
      return totalAmount / milestoneCount;
    }
  }

  /**
   * Helper: Personalize agreement terms with booking details
   */
  private personalizeAgreementTerms(terms: string, booking: any): string {
    return terms
      .replace(/\[EVENT_NAME\]/g, booking.event.name)
      .replace(/\[EVENT_DATE\]/g, booking.serviceDate.toLocaleDateString())
      .replace(/\[ORGANIZER_NAME\]/g, booking.organizer.name)
      .replace(/\[VENDOR_NAME\]/g, booking.vendor.businessName)
      .replace(/\[SERVICE_NAME\]/g, booking.serviceListing.title)
      .replace(/\[TOTAL_AMOUNT\]/g, `$${(booking.finalPrice || booking.quotedPrice || 0).toFixed(2)}`);
  }

  /**
   * Helper: Map database agreement to response format
   */
  private mapAgreementToResponse(agreement: any): ServiceAgreementResponse {
    return {
      id: agreement.id,
      bookingId: agreement.bookingId,
      terms: agreement.terms,
      deliverables: agreement.deliverables as unknown as Deliverable[],
      paymentSchedule: agreement.paymentSchedule as unknown as PaymentMilestone[],
      cancellationPolicy: agreement.cancellationPolicy,
      signedAt: agreement.signedAt,
      organizerSignature: agreement.organizerSignature,
      vendorSignature: agreement.vendorSignature,
      createdAt: agreement.createdAt,
      updatedAt: agreement.updatedAt,
    };
  }
}

export const serviceAgreementService = new ServiceAgreementService();