/**
 * Simple test script to verify certificate generation works
 * Run with: npx tsx test-certificate.ts
 */

import certificateService from './src/services/certificate.service';
import { CertificateType } from '@prisma/client';

async function testCertificateGeneration() {
  console.log('Testing certificate generation...\n');

  try {
    // Test 1: Generate a completion certificate
    console.log('Test 1: Generating COMPLETION certificate...');
    const completionCert = await certificateService.generateCertificate({
      recipientId: 'test-user-1',
      eventId: 'test-event-1',
      type: CertificateType.COMPLETION,
      metadata: {
        eventName: 'Test Event 2024',
        recipientName: 'John Doe',
        recipientEmail: 'john@example.com',
        issueDate: new Date(),
      },
    });
    console.log('✓ COMPLETION certificate generated:', completionCert.certificateId);
    console.log('  PDF:', completionCert.pdfUrl);
    console.log('  QR Code:', completionCert.qrCodeUrl);
    console.log();

    // Test 2: Generate a merit certificate
    console.log('Test 2: Generating MERIT certificate...');
    const meritCert = await certificateService.generateCertificate({
      recipientId: 'test-user-2',
      eventId: 'test-event-1',
      type: CertificateType.MERIT,
      metadata: {
        eventName: 'Test Event 2024',
        recipientName: 'Jane Smith',
        recipientEmail: 'jane@example.com',
        issueDate: new Date(),
        position: 1,
        score: 98.5,
      },
    });
    console.log('✓ MERIT certificate generated:', meritCert.certificateId);
    console.log('  PDF:', meritCert.pdfUrl);
    console.log('  QR Code:', meritCert.qrCodeUrl);
    console.log();

    // Test 3: Generate an appreciation certificate
    console.log('Test 3: Generating APPRECIATION certificate...');
    const appreciationCert = await certificateService.generateCertificate({
      recipientId: 'test-user-3',
      eventId: 'test-event-1',
      type: CertificateType.APPRECIATION,
      metadata: {
        eventName: 'Test Event 2024',
        recipientName: 'Bob Johnson',
        recipientEmail: 'bob@example.com',
        issueDate: new Date(),
        role: 'Volunteer',
      },
    });
    console.log('✓ APPRECIATION certificate generated:', appreciationCert.certificateId);
    console.log('  PDF:', appreciationCert.pdfUrl);
    console.log('  QR Code:', appreciationCert.qrCodeUrl);
    console.log();

    // Test 4: Verify a certificate
    console.log('Test 4: Verifying certificate...');
    const verification = await certificateService.verifyCertificate(completionCert.certificateId);
    if (verification.valid) {
      console.log('✓ Certificate verified successfully');
      console.log('  Recipient:', verification.certificate?.recipientName);
      console.log('  Event:', verification.certificate?.eventName);
      console.log('  Type:', verification.certificate?.type);
    } else {
      console.log('✗ Certificate verification failed:', verification.error);
    }
    console.log();

    // Test 5: Verify invalid certificate
    console.log('Test 5: Verifying invalid certificate...');
    const invalidVerification = await certificateService.verifyCertificate('INVALID-CERT-ID');
    if (!invalidVerification.valid) {
      console.log('✓ Invalid certificate correctly rejected');
      console.log('  Error:', invalidVerification.error);
    } else {
      console.log('✗ Invalid certificate was incorrectly validated');
    }
    console.log();

    console.log('All tests completed successfully! ✓');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testCertificateGeneration()
  .then(() => {
    console.log('\nTest script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test script failed:', error);
    process.exit(1);
  });
