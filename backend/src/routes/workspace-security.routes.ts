import { Router } from 'express';
import { workspaceSecurityService } from '../services/workspace-security.service';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

/**
 * Log workspace activity for audit purposes
 * POST /api/workspace-security/:workspaceId/log-activity
 */
router.post('/:workspaceId/log-activity', authMiddleware, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user!.id;
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
      ipAddress: req.ip,
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
router.post('/:workspaceId/enforce-privacy', authMiddleware, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user!.id;
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

/**
 * Handle security incident
 * POST /api/workspace-security/:workspaceId/security-incident
 */
router.post('/:workspaceId/security-incident', authMiddleware, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user!.id;
    const { type, severity, description, affectedUsers, affectedResources } = req.body;

    if (!type || !severity || !description) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Type, severity, and description are required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const incidentResponse = await workspaceSecurityService.handleSecurityIncident(workspaceId, {
      type,
      severity,
      description,
      affectedUsers,
      affectedResources,
      detectedBy: userId,
    });

    res.json({
      success: true,
      data: incidentResponse,
    });
  } catch (error) {
    console.error('Error handling security incident:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SECURITY_INCIDENT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to handle security incident',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Enforce security policies
 * POST /api/workspace-security/:workspaceId/enforce-policies
 */
router.post('/:workspaceId/enforce-policies', authMiddleware, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const {
      passwordRequirements,
      mfaRequired,
      sessionTimeout,
      ipWhitelist,
      allowedFileTypes,
      maxFileSize,
    } = req.body;

    const policyResult = await workspaceSecurityService.enforceSecurityPolicies(workspaceId, {
      passwordRequirements,
      mfaRequired,
      sessionTimeout,
      ipWhitelist,
      allowedFileTypes,
      maxFileSize,
    });

    res.json({
      success: true,
      data: policyResult,
    });
  } catch (error) {
    console.error('Error enforcing security policies:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SECURITY_POLICY_ERROR',
        message: error instanceof Error ? error.message : 'Failed to enforce security policies',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Validate user session
 * POST /api/workspace-security/:workspaceId/validate-session
 */
router.post('/:workspaceId/validate-session', authMiddleware, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user!.id;
    const { lastActivity } = req.body;

    const sessionValidation = await workspaceSecurityService.validateUserSession(
      workspaceId,
      userId,
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || '',
        lastActivity: lastActivity ? new Date(lastActivity) : new Date(),
      }
    );

    res.json({
      success: true,
      data: sessionValidation,
    });
  } catch (error) {
    console.error('Error validating user session:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SESSION_VALIDATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to validate session',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Get compliance report
 * GET /api/workspace-security/:workspaceId/compliance-report
 */
router.get('/:workspaceId/compliance-report', authMiddleware, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user!.id;

    const complianceReport = await workspaceSecurityService.getComplianceReport(workspaceId, userId);

    res.json({
      success: true,
      data: complianceReport,
    });
  } catch (error) {
    console.error('Error getting compliance report:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'COMPLIANCE_REPORT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get compliance report',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Encrypt workspace data
 * POST /api/workspace-security/:workspaceId/encrypt-data
 */
router.post('/:workspaceId/encrypt-data', authMiddleware, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { data, dataType } = req.body;

    if (!data || !dataType) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Data and data type are required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const encryptionResult = await workspaceSecurityService.encryptWorkspaceData(
      workspaceId,
      data,
      dataType
    );

    res.json({
      success: true,
      data: {
        encryptedData: encryptionResult.encryptedData,
        // Note: In production, encryption keys should be managed securely
        // and not returned in API responses
        keyId: 'key-' + encryptionResult.encryptionKey.substring(0, 8),
        encrypted: true,
      },
    });
  } catch (error) {
    console.error('Error encrypting workspace data:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ENCRYPTION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to encrypt data',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;