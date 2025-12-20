import { Router } from 'express';
import { workspaceMarketplaceIntegrationService } from '../services/workspace-marketplace-integration.service';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

/**
 * Get team member service recommendations for a workspace
 * GET /api/workspace-marketplace-integration/:workspaceId/recommendations
 */
router.get('/:workspaceId/recommendations', authMiddleware, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user!.id;
    
    const options = {
      preferredCategories: req.query.categories ? (req.query.categories as string).split(',') : undefined,
      location: req.query.location as string,
      budgetRange: req.query.minBudget && req.query.maxBudget ? {
        min: parseInt(req.query.minBudget as string),
        max: parseInt(req.query.maxBudget as string),
      } : undefined,
      verifiedOnly: req.query.verifiedOnly === 'true',
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const recommendations = await workspaceMarketplaceIntegrationService
      .getTeamMemberServiceRecommendations(workspaceId, userId, options);

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error('Error getting team member service recommendations:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'RECOMMENDATIONS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get recommendations',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Integrate hired specialist into workspace
 * POST /api/workspace-marketplace-integration/:workspaceId/integrate-specialist
 */
router.post('/:workspaceId/integrate-specialist', authMiddleware, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user!.id;
    const { bookingId, customRole, permissions, accessLevel } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_BOOKING_ID',
          message: 'Booking ID is required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const result = await workspaceMarketplaceIntegrationService
      .integrateHiredSpecialistIntoWorkspace(workspaceId, bookingId, userId, {
        customRole,
        permissions,
        accessLevel,
      });

    res.json(result);
  } catch (error) {
    console.error('Error integrating hired specialist:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTEGRATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to integrate specialist',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Set up integrated communication for external team members
 * POST /api/workspace-marketplace-integration/:workspaceId/setup-communication
 */
router.post('/:workspaceId/setup-communication', authMiddleware, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user!.id;

    const result = await workspaceMarketplaceIntegrationService
      .setupIntegratedCommunicationForExternalMembers(workspaceId, userId);

    res.json(result);
  } catch (error) {
    console.error('Error setting up integrated communication:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'COMMUNICATION_SETUP_ERROR',
        message: error instanceof Error ? error.message : 'Failed to set up communication',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Manage mixed team access levels
 * POST /api/workspace-marketplace-integration/:workspaceId/manage-mixed-team
 */
router.post('/:workspaceId/manage-mixed-team', authMiddleware, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user!.id;

    const result = await workspaceMarketplaceIntegrationService
      .manageMixedTeamAccess(workspaceId, userId);

    res.json(result);
  } catch (error) {
    console.error('Error managing mixed team access:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'MIXED_TEAM_ERROR',
        message: error instanceof Error ? error.message : 'Failed to manage mixed team access',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Set up service separation with collaboration
 * POST /api/workspace-marketplace-integration/:workspaceId/setup-separation
 */
router.post('/:workspaceId/setup-separation', authMiddleware, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user!.id;

    const result = await workspaceMarketplaceIntegrationService
      .maintainServiceSeparationWithCollaboration(workspaceId, userId);

    res.json(result);
  } catch (error) {
    console.error('Error setting up service separation:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SEPARATION_SETUP_ERROR',
        message: error instanceof Error ? error.message : 'Failed to set up service separation',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;