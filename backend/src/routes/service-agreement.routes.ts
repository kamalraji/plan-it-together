import { Router } from 'express';
import { serviceAgreementService } from '../services/service-agreement.service';
import { authenticate } from '../middleware/auth.middleware';
import { ApiResponse } from '../types';

const router = Router();

/**
 * Get agreement templates
 * GET /api/service-agreements/templates
 */
router.get('/templates', authenticate, async (_req, res) => {
  try {
    const templates = await serviceAgreementService.getAgreementTemplates();

    res.json({
      success: true,
      data: templates,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve agreement templates',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

/**
 * Generate service agreement for a booking
 * POST /api/service-agreements/generate
 */
router.post('/generate', authenticate, async (req, res) => {
  try {
    const {
      bookingId,
      templateId,
      customTerms,
      deliverables,
      paymentSchedule,
      cancellationPolicy,
    } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Missing required field: bookingId',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    const agreement = await serviceAgreementService.generateServiceAgreement(bookingId, {
      bookingId,
      templateId,
      customTerms,
      deliverables: deliverables || [],
      paymentSchedule: paymentSchedule || [],
      cancellationPolicy,
    });

    res.json({
      success: true,
      data: agreement,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Generate agreement error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Failed to generate service agreement',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

/**
 * Get service agreement by booking ID
 * GET /api/service-agreements/booking/:bookingId
 */
router.get('/booking/:bookingId', authenticate, async (req, res) => {
  try {
    const { bookingId } = req.params;

    const agreement = await serviceAgreementService.getServiceAgreement(bookingId);

    res.json({
      success: true,
      data: agreement,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Get agreement error:', error);
    const statusCode = error.message === 'Service agreement not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: {
        code: statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Failed to retrieve service agreement',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

/**
 * Update service agreement
 * PUT /api/service-agreements/:agreementId
 */
router.put('/:agreementId', authenticate, async (req, res) => {
  try {
    const { agreementId } = req.params;
    const {
      customTerms,
      deliverables,
      paymentSchedule,
      cancellationPolicy,
    } = req.body;

    const agreement = await serviceAgreementService.updateServiceAgreement(agreementId, {
      customTerms,
      deliverables,
      paymentSchedule,
      cancellationPolicy,
    });

    res.json({
      success: true,
      data: agreement,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Update agreement error:', error);
    const statusCode = error.message === 'Service agreement not found' ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: {
        code: statusCode === 404 ? 'NOT_FOUND' : 'BAD_REQUEST',
        message: error.message || 'Failed to update service agreement',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

/**
 * Sign service agreement
 * POST /api/service-agreements/:agreementId/sign
 */
router.post('/:agreementId/sign', authenticate, async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { signatureType, signature, ipAddress, userAgent } = req.body;

    if (!signatureType || !signature) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Missing required fields: signatureType, signature',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    if (!['ORGANIZER', 'VENDOR'].includes(signatureType)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SIGNATURE_TYPE',
          message: 'Signature type must be either ORGANIZER or VENDOR',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    const agreement = await serviceAgreementService.signAgreement({
      agreementId,
      signatureType,
      signature,
      ipAddress,
      userAgent,
    });

    res.json({
      success: true,
      data: agreement,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Sign agreement error:', error);
    const statusCode = error.message === 'Service agreement not found' ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: {
        code: statusCode === 404 ? 'NOT_FOUND' : 'BAD_REQUEST',
        message: error.message || 'Failed to sign service agreement',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

/**
 * Update deliverable status
 * PUT /api/service-agreements/:agreementId/deliverables/:deliverableId
 */
router.put('/:agreementId/deliverables/:deliverableId', authenticate, async (req, res) => {
  try {
    const { agreementId, deliverableId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Missing required field: status',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    if (!['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Status must be one of: PENDING, IN_PROGRESS, COMPLETED, OVERDUE',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    const agreement = await serviceAgreementService.updateDeliverableStatus(
      agreementId,
      deliverableId,
      status
    );

    res.json({
      success: true,
      data: agreement,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Update deliverable error:', error);
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: {
        code: statusCode === 404 ? 'NOT_FOUND' : 'BAD_REQUEST',
        message: error.message || 'Failed to update deliverable status',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

/**
 * Update payment milestone status
 * PUT /api/service-agreements/:agreementId/milestones/:milestoneId
 */
router.put('/:agreementId/milestones/:milestoneId', authenticate, async (req, res) => {
  try {
    const { agreementId, milestoneId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Missing required field: status',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    if (!['PENDING', 'PAID', 'OVERDUE'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Status must be one of: PENDING, PAID, OVERDUE',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    const agreement = await serviceAgreementService.updateMilestoneStatus(
      agreementId,
      milestoneId,
      status
    );

    res.json({
      success: true,
      data: agreement,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Update milestone error:', error);
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: {
        code: statusCode === 404 ? 'NOT_FOUND' : 'BAD_REQUEST',
        message: error.message || 'Failed to update milestone status',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

/**
 * Get agreement progress summary
 * GET /api/service-agreements/:agreementId/progress
 */
router.get('/:agreementId/progress', authenticate, async (req, res) => {
  try {
    const { agreementId } = req.params;

    const progress = await serviceAgreementService.getAgreementProgress(agreementId);

    res.json({
      success: true,
      data: progress,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Get progress error:', error);
    const statusCode = error.message === 'Service agreement not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: {
        code: statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Failed to retrieve agreement progress',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

export default router;