import { Router } from 'express';
import { workspaceSecurityService } from '../services/workspace-security.service';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * Log workspace activity for audit purposes
 * POST /api/workspace-security/:workspaceId/log-activity
 */
router.post('/:workspaceId/log-activity', authenticate, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user!.userId;
    const { action, resource, resourceId, details } = req.body;

    if (!action || !resource) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Action and resource are required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    await workspaceSecurityService.logWorkspaceActivity(workspaceId, userId, {
      action,
      resource,
      resourceId,
      details,
      ipAddress: req.ip || '',
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      message: 'Activity logged successfully',
    });
  } catch (error) {
    console.error('Error logging workspace activity:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ACTIVITY_LOG_ERROR',
        message: error instanceof Error ? error.message : 'Failed to log activity',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Enforce data privacy compliance
 * POST /api/workspace-security/:workspaceId/enforce-privacy
 */
router.post('/:workspaceId/enforce-privacy', authenticate, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user!.userId;
    const { dataType, participantIds, purpose, retentionPeriod } = req.body;

    if (!dataType || !purpose) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Data type and purpose are required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const complianceResult = await workspaceSecurityService.enforceDataPrivacyCompliance(
      workspaceId,
      userId,
      {
        dataType,
        participantIds,
        purpose,
        retentionPeriod,
      }
    );

    res.json({
      success: true,
      data: complianceResult,
    });
  } catch (error) {
    console.error('Error enforcing data privacy compliance:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PRIVACY_COMPLIANCE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to enforce privacy compliance',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;