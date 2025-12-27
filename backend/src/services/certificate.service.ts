import { PrismaClient, CertificateType, Certificate } from '@prisma/client';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { randomBytes } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Certificate-related types
export interface CertificateMetadata {
  eventName: string;
  recipientName: string;
  recipientEmail: string;
  issueDate: Date;
  position?: number;
  score?: number;
  role?: string;
  customFields?: Record<string, any>;
}

export interface GenerateCertificateDTO {
  recipientId: string;
  eventId: string;
  type: CertificateType;
  metadata: CertificateMetadata;
}

export interface CertificateCriteria {
  type: CertificateType;
  conditions: {
    minScore?: number;
    maxRank?: number;
    requiresAttendance?: boolean;
    requiresRole?: string[];
  };
}

export interface DistributionResult {
  successful: number;
  failed: number;
  failures: Array<{
    certificateId: string;
    recipientEmail: string;
    error: string;
  }>;
}

export interface CertificateVerification {
  valid: boolean;
  certificate?: {
    certificateId: string;
    recipientName: string;
    eventName: string;
    type: CertificateType;
    issuedAt: Date;
  };
  error?: string;
}

class CertificateService {
  private certificatesDir: string;
  private qrCodesDir: string;

  constructor() {
    // Set up directories for storing certificates and QR codes
    this.certificatesDir = path.join(process.cwd(), 'storage', 'certificates');
    this.qrCodesDir = path.join(process.cwd(), 'storage', 'qr-codes');
    
    // Create directories if they don't exist
    this.ensureDirectoriesExist();
  }

  private ensureDirectoriesExist(): void {
    [this.certificatesDir, this.qrCodesDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Generate a unique certificate ID
   */
  private generateCertificateId(): string {
    // Generate a cryptographically secure random ID
    const randomPart = randomBytes(16).toString('hex');
    const timestamp = Date.now().toString(36);
    return `CERT-${timestamp}-${randomPart}`.toUpperCase();
  }

  /**
   * Generate QR code for certificate verification
   */
  private async generateQRCode(certificateId: string): Promise<string> {
    const verificationUrl = `${process.env.APP_URL || 'http://localhost:3000'}/verify/${certificateId}`;
    const qrCodePath = path.join(this.qrCodesDir, `${certificateId}.png`);
    
    await QRCode.toFile(qrCodePath, verificationUrl, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'H'
    });
    
    return qrCodePath;
  }

  /**
   * Generate certificate PDF
   */
  private async generateCertificatePDF(
    certificateId: string,
    type: CertificateType,
    metadata: CertificateMetadata,
    qrCodePath: string
  ): Promise<string> {
    const pdfPath = path.join(this.certificatesDir, `${certificateId}.pdf`);
    
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      // Certificate border
      doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
        .lineWidth(3)
        .stroke('#2563eb');

      // Certificate title
      doc.fontSize(40)
        .font('Helvetica-Bold')
        .fillColor('#1e40af')
        .text('CERTIFICATE', 0, 100, { align: 'center' });

      // Certificate type
      doc.fontSize(24)
        .font('Helvetica')
        .fillColor('#64748b')
        .text(`of ${type.toLowerCase()}`, 0, 160, { align: 'center' });

      // Recipient name
      doc.fontSize(32)
        .font('Helvetica-Bold')
        .fillColor('#0f172a')
        .text(metadata.recipientName, 0, 240, { align: 'center' });

      // Event details
      doc.fontSize(16)
        .font('Helvetica')
        .fillColor('#475569')
        .text(`for participation in`, 0, 300, { align: 'center' });

      doc.fontSize(20)
        .font('Helvetica-Bold')
        .fillColor('#1e40af')
        .text(metadata.eventName, 0, 330, { align: 'center' });

      // Additional details based on type
      let yPosition = 380;
      if (type === 'MERIT' && metadata.position) {
        doc.fontSize(16)
          .font('Helvetica')
          .fillColor('#475569')
          .text(`Rank: ${metadata.position}`, 0, yPosition, { align: 'center' });
        yPosition += 30;
      }

      if (type === 'MERIT' && metadata.score) {
        doc.fontSize(16)
          .font('Helvetica')
          .fillColor('#475569')
          .text(`Score: ${metadata.score}`, 0, yPosition, { align: 'center' });
        yPosition += 30;
      }

      if (type === 'APPRECIATION' && metadata.role) {
        doc.fontSize(16)
          .font('Helvetica')
          .fillColor('#475569')
          .text(`Role: ${metadata.role}`, 0, yPosition, { align: 'center' });
        yPosition += 30;
      }

      // Issue date
      const issueDate = new Date(metadata.issueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.fontSize(14)
        .font('Helvetica')
        .fillColor('#64748b')
        .text(`Issued on ${issueDate}`, 0, doc.page.height - 150, { align: 'center' });

      // Certificate ID
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#94a3b8')
        .text(`Certificate ID: ${certificateId}`, 0, doc.page.height - 120, { align: 'center' });

      // QR Code
      if (fs.existsSync(qrCodePath)) {
        doc.image(qrCodePath, doc.page.width - 150, doc.page.height - 150, {
          width: 100,
          height: 100
        });
      }

      // Verification text
      doc.fontSize(8)
        .font('Helvetica')
        .fillColor('#94a3b8')
        .text('Scan to verify', doc.page.width - 150, doc.page.height - 40, {
          width: 100,
          align: 'center'
        });

      doc.end();

      stream.on('finish', () => resolve(pdfPath));
      stream.on('error', reject);
    });
  }

  /**
   * Store certificate criteria for an event
   */
  async storeCertificateCriteria(
    eventId: string,
    criteria: CertificateCriteria[]
  ): Promise<void> {
    // Store criteria in event metadata
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { branding: true }
    });

    const currentBranding = event?.branding as any || {};
    
    await prisma.event.update({
      where: { id: eventId },
      data: {
        branding: {
          ...currentBranding,
          certificateCriteria: criteria
        }
      }
    });
  }

  /**
   * Retrieve certificate criteria for an event
   */
  async getCertificateCriteria(eventId: string): Promise<CertificateCriteria[]> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { branding: true }
    });

    if (!event || !event.branding) {
      return [];
    }

    const branding = event.branding as any;
    return branding.certificateCriteria || [];
  }

  /**
   * Generate a single certificate
   */
  async generateCertificate(data: GenerateCertificateDTO): Promise<Certificate> {
    // Generate unique certificate ID
    const certificateId = this.generateCertificateId();

    // Generate QR code
    const qrCodePath = await this.generateQRCode(certificateId);
    const qrCodeUrl = `/storage/qr-codes/${certificateId}.png`;

    // Generate PDF
    await this.generateCertificatePDF(
      certificateId,
      data.type,
      data.metadata,
      qrCodePath
    );
    const pdfUrl = `/storage/certificates/${certificateId}.pdf`;

    // Store certificate in database
    const certificate = await prisma.certificate.create({
      data: {
        certificateId,
        recipientId: data.recipientId,
        eventId: data.eventId,
        type: data.type,
        pdfUrl,
        qrCodeUrl,
        metadata: data.metadata as any,
        issuedAt: new Date()
      }
    });

    return certificate;
  }

  /**
   * Batch generate certificates for an event
   */
  async batchGenerateCertificates(eventId: string): Promise<Certificate[]> {
    const criteria = await this.getCertificateCriteria(eventId);
    
    if (criteria.length === 0) {
      throw new Error('No certificate criteria defined for this event');
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        registrations: {
          include: {
            user: true,
            attendance: true
          }
        }
      }
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const certificates: Certificate[] = [];

    // Process each registration
    for (const registration of event.registrations) {
      for (const criterion of criteria) {
        let shouldGenerate = true;

        // Check attendance requirement
        if (criterion.conditions.requiresAttendance && registration.attendance.length === 0) {
          shouldGenerate = false;
        }

        // Check role requirement
        if (criterion.conditions.requiresRole && 
            !criterion.conditions.requiresRole.includes(registration.user.role)) {
          shouldGenerate = false;
        }

        if (shouldGenerate) {
          const metadata: CertificateMetadata = {
            eventName: event.name,
            recipientName: registration.user.name,
            recipientEmail: registration.user.email,
            issueDate: new Date(),
            role: registration.user.role
          };

          const certificate = await this.generateCertificate({
            recipientId: registration.userId,
            eventId: event.id,
            type: criterion.type,
            metadata
          });

          certificates.push(certificate);
        }
      }
    }

    return certificates;
  }

  /**
   * Verify a certificate by ID
   */
  async verifyCertificate(certificateId: string): Promise<CertificateVerification> {
    const certificate = await prisma.certificate.findUnique({
      where: { certificateId },
      include: {
        recipient: {
          select: { name: true }
        },
        event: {
          select: { name: true }
        }
      }
    });

    if (!certificate) {
      return {
        valid: false,
        error: 'Certificate not found or invalid'
      };
    }

    return {
      valid: true,
      certificate: {
        certificateId: certificate.certificateId,
        recipientName: certificate.recipient.name,
        eventName: certificate.event.name,
        type: certificate.type,
        issuedAt: certificate.issuedAt
      }
    };
  }

  /**
   * Distribute certificates via email
   * Note: This is a placeholder - actual email sending would require email service integration
   */
  async distributeCertificates(certificateIds: string[]): Promise<DistributionResult> {
    const result: DistributionResult = {
      successful: 0,
      failed: 0,
      failures: []
    };

    for (const certId of certificateIds) {
      try {
        const certificate = await prisma.certificate.findUnique({
          where: { id: certId },
          include: {
            recipient: true
          }
        });

        if (!certificate) {
          result.failed++;
          result.failures.push({
            certificateId: certId,
            recipientEmail: 'unknown',
            error: 'Certificate not found'
          });
          continue;
        }

        // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
        // For now, just mark as distributed
        await prisma.certificate.update({
          where: { id: certId },
          data: { distributedAt: new Date() }
        });

        result.successful++;
      } catch (error) {
        result.failed++;
        result.failures.push({
          certificateId: certId,
          recipientEmail: 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return result;
  }

  /**
   * Get certificate by ID (internal use)
   */
  async getCertificateById(certificateId: string): Promise<Certificate | null> {
    return prisma.certificate.findUnique({
      where: { certificateId }
    });
  }

  /**
   * Get certificates for a user
   */
  async getUserCertificates(userId: string): Promise<Certificate[]> {
    return prisma.certificate.findMany({
      where: { recipientId: userId },
      include: {
        event: {
          select: {
            name: true,
            startDate: true,
            endDate: true
          }
        }
      },
      orderBy: { issuedAt: 'desc' }
    });
  }

  /**
   * Get certificates for an event
   */
  async getEventCertificates(eventId: string): Promise<Certificate[]> {
    return prisma.certificate.findMany({
      where: { eventId },
      include: {
        recipient: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { issuedAt: 'desc' }
    });
  }
}

export default new CertificateService();
