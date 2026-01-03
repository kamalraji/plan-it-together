import { Router, Request, Response } from 'express';
import certificateService from '../services/certificate.service';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

/**
 * POST /api/certificates/criteria
 * Store certificate criteria for an event
 * Requires: Organizer role
 */
router.post(
  '/criteria',
  authenticate,
  authorize([UserRole.ORGANIZER]),
  async (req: Request, res: Response) => {
    try {
      const { eventId, criteria } = req.body;

      if (!eventId || !criteria || !Array.isArray(criteria)) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Event ID and criteria array are required',
            timestamp: new Date().toISOString()
          }
        });
      }

      await certificateService.storeCertificateCriteria(eventId, criteria);

      res.status(200).json({
        success: true,
        data: { message: 'Certificate criteria stored successfully' }
      });
    } catch (error) {
      console.error('Error storing certificate criteria:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to store certificate criteria',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

/**
 * GET /api/certificates/criteria/:eventId
 * Get certificate criteria for an event
 * Requires: Authentication
 */
router.get(
  '/criteria/:eventId',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;

      const criteria = await certificateService.getCertificateCriteria(eventId);

      res.status(200).json({
        success: true,
        data: criteria
      });
    } catch (error) {
      console.error('Error retrieving certificate criteria:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve certificate criteria',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

/**
 * POST /api/certificates/generate
 * Generate a single certificate
 * Requires: Organizer role
 */
router.post(
  '/generate',
  authenticate,
  authorize([UserRole.ORGANIZER]),
  async (req: Request, res: Response) => {
    try {
      const { recipientId, eventId, type, metadata } = req.body;

      if (!recipientId || !eventId || !type || !metadata) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Recipient ID, event ID, type, and metadata are required',
            timestamp: new Date().toISOString()
          }
        });
      }

      const certificate = await certificateService.generateCertificate({
        recipientId,
        eventId,
        type,
        metadata
      });

      res.status(201).json({
        success: true,
        data: certificate
      });
    } catch (error) {
      console.error('Error generating certificate:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to generate certificate',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

/**
 * POST /api/certificates/batch-generate
 * Batch generate certificates for an event
 * Requires: Organizer role
 */
router.post(
  '/batch-generate',
  authenticate,
  authorize([UserRole.ORGANIZER]),
  async (req: Request, res: Response) => {
    try {
      const { eventId } = req.body;

      if (!eventId) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Event ID is required',
            timestamp: new Date().toISOString()
          }
        });
      }

      const certificates = await certificateService.batchGenerateCertificates(eventId);

      res.status(201).json({
        success: true,
        data: {
          count: certificates.length,
          certificates
        }
      });
    } catch (error) {
      console.error('Error batch generating certificates:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to batch generate certificates',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

/**
 * POST /api/certificates/distribute
 * Distribute certificates via email
 * Requires: Organizer role
 */
router.post(
  '/distribute',
  authenticate,
  authorize([UserRole.ORGANIZER]),
  async (req: Request, res: Response) => {
    try {
      const { certificateIds } = req.body;

      if (!certificateIds || !Array.isArray(certificateIds)) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Certificate IDs array is required',
            timestamp: new Date().toISOString()
          }
        });
      }

      const result = await certificateService.distributeCertificates(certificateIds);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error distributing certificates:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to distribute certificates',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

/**
 * GET /api/certificates/verify/:certificateId
 * Verify a certificate (public endpoint)
 * No authentication required
 */
router.get(
  '/verify/:certificateId',
  async (req: Request, res: Response) => {
    try {
      const { certificateId } = req.params;

      const verification = await certificateService.verifyCertificate(certificateId);

      if (!verification.valid) {
        return res.status(404).json({
          error: {
            code: 'CERTIFICATE_NOT_FOUND',
            message: verification.error || 'Certificate not found',
            timestamp: new Date().toISOString()
          }
        });
      }

      res.status(200).json({
        success: true,
        data: verification.certificate
      });
    } catch (error) {
      console.error('Error verifying certificate:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to verify certificate',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

/**
 * GET /api/certificates/user/:userId
 * Get all certificates for a user
 * Requires: Authentication (user can only access their own certificates)
 */
router.get(
  '/user/:userId',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const requestingUser = (req as any).user;

      // Users can only access their own certificates unless they're an organizer
      if (requestingUser.id !== userId && requestingUser.role !== 'ORGANIZER') {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only access your own certificates',
            timestamp: new Date().toISOString()
          }
        });
      }

      const certificates = await certificateService.getUserCertificates(userId);

      res.status(200).json({
        success: true,
        data: certificates
      });
    } catch (error) {
      console.error('Error retrieving user certificates:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve certificates',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

/**
 * GET /api/certificates/event/:eventId
 * Get all certificates for an event
 * Requires: Organizer role
 */
router.get(
  '/event/:eventId',
  authenticate,
  authorize([UserRole.ORGANIZER]),
  async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;

      const certificates = await certificateService.getEventCertificates(eventId);

      res.status(200).json({
        success: true,
        data: certificates
      });
    } catch (error) {
      console.error('Error retrieving event certificates:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve certificates',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
);

export default router;
