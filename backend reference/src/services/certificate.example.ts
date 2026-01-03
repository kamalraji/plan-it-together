/**
 * Example usage of Certificate Service
 * This file demonstrates how to use the certificate service in your application
 */

import certificateService from './certificate.service';
import { CertificateType } from '@prisma/client';

// Example 1: Define certificate criteria for an event
async function setupCertificateCriteria(eventId: string) {
  await certificateService.storeCertificateCriteria(eventId, [
    {
      type: CertificateType.MERIT,
      conditions: {
        maxRank: 3, // Top 3 winners
        requiresAttendance: true,
      },
    },
    {
      type: CertificateType.COMPLETION,
      conditions: {
        requiresAttendance: true, // Must have attended
      },
    },
    {
      type: CertificateType.APPRECIATION,
      conditions: {
        requiresRole: ['JUDGE', 'VOLUNTEER', 'SPEAKER'],
      },
    },
  ]);
}

// Example 2: Generate a single certificate manually
async function generateSingleCertificate() {
  const certificate = await certificateService.generateCertificate({
    recipientId: 'user-123',
    eventId: 'event-456',
    type: CertificateType.MERIT,
    metadata: {
      eventName: 'Tech Hackathon 2024',
      recipientName: 'Jane Smith',
      recipientEmail: 'jane@example.com',
      issueDate: new Date(),
      position: 1,
      score: 95.5,
    },
  });

  console.log('Certificate generated:', certificate.certificateId);
  console.log('PDF URL:', certificate.pdfUrl);
  console.log('QR Code URL:', certificate.qrCodeUrl);
}

// Example 3: Batch generate certificates for all eligible participants
async function batchGenerateCertificates(eventId: string) {
  try {
    const certificates = await certificateService.batchGenerateCertificates(eventId);
    console.log(`Generated ${certificates.length} certificates`);
    
    // Get all certificate IDs for distribution
    const certificateIds = certificates.map(cert => cert.id);
    
    // Distribute via email
    const result = await certificateService.distributeCertificates(certificateIds);
    console.log(`Successfully distributed: ${result.successful}`);
    console.log(`Failed: ${result.failed}`);
    
    if (result.failures.length > 0) {
      console.log('Failures:', result.failures);
    }
  } catch (error) {
    console.error('Error generating certificates:', error);
  }
}

// Example 4: Verify a certificate
async function verifyCertificate(certificateId: string) {
  const verification = await certificateService.verifyCertificate(certificateId);
  
  if (verification.valid) {
    console.log('Certificate is valid!');
    console.log('Recipient:', verification.certificate?.recipientName);
    console.log('Event:', verification.certificate?.eventName);
    console.log('Type:', verification.certificate?.type);
    console.log('Issued:', verification.certificate?.issuedAt);
  } else {
    console.log('Certificate is invalid:', verification.error);
  }
}

// Example 5: Get all certificates for a user
async function getUserCertificates(userId: string) {
  const certificates = await certificateService.getUserCertificates(userId);
  
  console.log(`User has ${certificates.length} certificates:`);
  certificates.forEach(cert => {
    console.log(`- ${cert.type} certificate for ${(cert as any).event.name}`);
  });
}

// Example 6: Get all certificates for an event
async function getEventCertificates(eventId: string) {
  const certificates = await certificateService.getEventCertificates(eventId);
  
  console.log(`Event has ${certificates.length} certificates issued:`);
  certificates.forEach(cert => {
    console.log(`- ${cert.type} for ${(cert as any).recipient.name}`);
  });
}

// Export examples for use in other files
export {
  setupCertificateCriteria,
  generateSingleCertificate,
  batchGenerateCertificates,
  verifyCertificate,
  getUserCertificates,
  getEventCertificates,
};
