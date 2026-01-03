import certificateService from '../certificate.service';
import { PrismaClient, CertificateType } from '@prisma/client';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    certificate: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    event: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
    CertificateType: {
      MERIT: 'MERIT',
      COMPLETION: 'COMPLETION',
      APPRECIATION: 'APPRECIATION',
    },
  };
});

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  createWriteStream: jest.fn(() => ({
    on: jest.fn((event, callback) => {
      if (event === 'finish') {
        setTimeout(callback, 0);
      }
      return this;
    }),
  })),
}));

// Mock QRCode
jest.mock('qrcode', () => ({
  toFile: jest.fn(() => Promise.resolve()),
}));

// Mock PDFKit
jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => ({
    rect: jest.fn().mockReturnThis(),
    lineWidth: jest.fn().mockReturnThis(),
    stroke: jest.fn().mockReturnThis(),
    fontSize: jest.fn().mockReturnThis(),
    font: jest.fn().mockReturnThis(),
    fillColor: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    image: jest.fn().mockReturnThis(),
    end: jest.fn(),
    pipe: jest.fn(),
    page: {
      width: 842,
      height: 595,
    },
  }));
});

describe('CertificateService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateCertificate', () => {
    it('should generate a certificate with unique ID', async () => {
      const mockCertificate = {
        id: 'cert-123',
        certificateId: 'CERT-ABC123',
        recipientId: 'user-123',
        eventId: 'event-123',
        type: CertificateType.COMPLETION,
        pdfUrl: '/storage/certificates/CERT-ABC123.pdf',
        qrCodeUrl: '/storage/qr-codes/CERT-ABC123.png',
        metadata: {
          eventName: 'Test Event',
          recipientName: 'John Doe',
          recipientEmail: 'john@example.com',
          issueDate: new Date(),
        },
        issuedAt: new Date(),
        distributedAt: null,
      };

      const prisma = new PrismaClient();
      (prisma.certificate.create as jest.Mock).mockResolvedValue(mockCertificate);

      const result = await certificateService.generateCertificate({
        recipientId: 'user-123',
        eventId: 'event-123',
        type: CertificateType.COMPLETION,
        metadata: {
          eventName: 'Test Event',
          recipientName: 'John Doe',
          recipientEmail: 'john@example.com',
          issueDate: new Date(),
        },
      });

      expect(result).toBeDefined();
      expect(result.certificateId).toBeDefined();
      expect(result.type).toBe(CertificateType.COMPLETION);
    });

    it('should generate certificates of different types', async () => {
      const types: CertificateType[] = [
        CertificateType.MERIT,
        CertificateType.COMPLETION,
        CertificateType.APPRECIATION,
      ];

      const prisma = new PrismaClient();

      for (const type of types) {
        const mockCertificate = {
          id: `cert-${type}`,
          certificateId: `CERT-${type}`,
          recipientId: 'user-123',
          eventId: 'event-123',
          type,
          pdfUrl: `/storage/certificates/CERT-${type}.pdf`,
          qrCodeUrl: `/storage/qr-codes/CERT-${type}.png`,
          metadata: {
            eventName: 'Test Event',
            recipientName: 'John Doe',
            recipientEmail: 'john@example.com',
            issueDate: new Date(),
          },
          issuedAt: new Date(),
          distributedAt: null,
        };

        (prisma.certificate.create as jest.Mock).mockResolvedValue(mockCertificate);

        const result = await certificateService.generateCertificate({
          recipientId: 'user-123',
          eventId: 'event-123',
          type,
          metadata: {
            eventName: 'Test Event',
            recipientName: 'John Doe',
            recipientEmail: 'john@example.com',
            issueDate: new Date(),
          },
        });

        expect(result.type).toBe(type);
      }
    });
  });

  describe('verifyCertificate', () => {
    it('should return valid certificate details for valid ID', async () => {
      const mockCertificate = {
        id: 'cert-123',
        certificateId: 'CERT-ABC123',
        recipientId: 'user-123',
        eventId: 'event-123',
        type: CertificateType.COMPLETION,
        pdfUrl: '/storage/certificates/CERT-ABC123.pdf',
        qrCodeUrl: '/storage/qr-codes/CERT-ABC123.png',
        metadata: {},
        issuedAt: new Date('2024-01-01'),
        distributedAt: null,
        recipient: {
          name: 'John Doe',
        },
        event: {
          name: 'Test Event',
        },
      };

      const prisma = new PrismaClient();
      (prisma.certificate.findUnique as jest.Mock).mockResolvedValue(mockCertificate);

      const result = await certificateService.verifyCertificate('CERT-ABC123');

      expect(result.valid).toBe(true);
      expect(result.certificate).toBeDefined();
      expect(result.certificate?.certificateId).toBe('CERT-ABC123');
      expect(result.certificate?.recipientName).toBe('John Doe');
      expect(result.certificate?.eventName).toBe('Test Event');
    });

    it('should return invalid for non-existent certificate', async () => {
      const prisma = new PrismaClient();
      (prisma.certificate.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await certificateService.verifyCertificate('INVALID-ID');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.certificate).toBeUndefined();
    });
  });

  describe('distributeCertificates', () => {
    it('should track successful and failed distributions', async () => {
      const prisma = new PrismaClient();
      
      // Mock first certificate exists
      (prisma.certificate.findUnique as jest.Mock)
        .mockResolvedValueOnce({
          id: 'cert-1',
          certificateId: 'CERT-1',
          recipient: { email: 'user1@example.com' },
        })
        // Mock second certificate doesn't exist
        .mockResolvedValueOnce(null);

      (prisma.certificate.update as jest.Mock).mockResolvedValue({});

      const result = await certificateService.distributeCertificates(['cert-1', 'cert-2']);

      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.failures).toHaveLength(1);
      expect(result.failures[0].certificateId).toBe('cert-2');
    });
  });

  describe('Certificate ID uniqueness', () => {
    it('should generate unique certificate IDs', async () => {
      const prisma = new PrismaClient();
      const generatedIds = new Set<string>();

      // Generate multiple certificates
      for (let i = 0; i < 10; i++) {
        const mockCertificate = {
          id: `cert-${i}`,
          certificateId: `CERT-${i}`,
          recipientId: 'user-123',
          eventId: 'event-123',
          type: CertificateType.COMPLETION,
          pdfUrl: `/storage/certificates/CERT-${i}.pdf`,
          qrCodeUrl: `/storage/qr-codes/CERT-${i}.png`,
          metadata: {},
          issuedAt: new Date(),
          distributedAt: null,
        };

        (prisma.certificate.create as jest.Mock).mockResolvedValue(mockCertificate);

        const result = await certificateService.generateCertificate({
          recipientId: 'user-123',
          eventId: 'event-123',
          type: CertificateType.COMPLETION,
          metadata: {
            eventName: 'Test Event',
            recipientName: 'John Doe',
            recipientEmail: 'john@example.com',
            issueDate: new Date(),
          },
        });

        generatedIds.add(result.certificateId);
      }

      // All IDs should be unique
      expect(generatedIds.size).toBe(10);
    });
  });
});
