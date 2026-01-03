import { Router, Request, Response } from 'express';
import { workspaceLifecycleService } from '../services/workspace-lifecycle.service';
import { workspaceService } from '../services/workspace.service';
import { workspaceSchedulerService } from '../services/workspace-scheduler.service';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * GET /api/workspace-lifecycle/:eventId/status
 * Get workspace lifecycle status for an event
 */
router.get('/:eventId/status', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const status = await workspaceLifecycleService.getWorkspaceLifecycleStatus(eventId);
    
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error getting workspace lifecycle status:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LIFECYCLE_STATUS_ERROR',
        message: 'Failed to get workspace lifecycle status',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/workspace-lifecycle/:workspaceId/wind-down
 * Initiate workspace wind-down process
 */
router.post('/:workspaceId/wind-down', async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User authentication required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    await workspaceService.initiateWindDown(workspaceId, userId);
    
    res.json({
      success: true,
      data: {
        message: 'Workspace wind-down initiated successfully',
        workspaceId,
      },
    });
  } catch (error) {
    console.error('Error initiating workspace wind-down:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'WIND_DOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to initiate workspace wind-down',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/workspace-lifecycle/:workspaceId/emergency-revoke
 * Emergency revoke access for security incidents
 */
router.post('/:workspaceId/emergency-revoke', async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const { reason } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User authentication required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REASON',
          message: 'Reason for emergency revocation is required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    await workspaceService.emergencyRevokeAccess(workspaceId, userId, reason);
    
    res.json({
      success: true,
      data: {
        message: 'Emergency access revocation completed',
        workspaceId,
        reason,
      },
    });
  } catch (error) {
    console.error('Error performing emergency access revocation:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'EMERGENCY_REVOKE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to perform emergency access revocation',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/workspace-lifecycle/:workspaceId/handle-departure
 * Handle team member early departure
 */
router.post('/:workspaceId/handle-departure', async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const { departingUserId } = req.body;
    const managerId = req.user?.userId;

    if (!managerId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User authentication required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (!departingUserId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_USER_ID',
          message: 'Departing user ID is required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    await workspaceService.handleEarlyDeparture(workspaceId, departingUserId, managerId);
    
    res.json({
      success: true,
      data: {
        message: 'Team member departure handled successfully',
        workspaceId,
        departingUserId,
      },
    });
  } catch (error) {
    console.error('Error handling team member departure:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DEPARTURE_HANDLING_ERROR',
        message: error instanceof Error ? error.message : 'Failed to handle team member departure',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/workspace-lifecycle/scheduler/status
 * Get workspace dissolution scheduler status
 */
router.get('/scheduler/status', async (_req: Request, res: Response) => {
  try {
    const status = workspaceSchedulerService.getStatus();
    
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error getting scheduler status:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SCHEDULER_STATUS_ERROR',
        message: 'Failed to get scheduler status',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/workspace-lifecycle/scheduler/trigger
 * Manually trigger scheduled dissolution processing (for testing)
 */
router.post('/scheduler/trigger', async (_req: Request, res: Response) => {
  try {
    await workspaceSchedulerService.triggerManualProcessing();
    
    res.json({
      success: true,
      data: {
        message: 'Scheduled dissolution processing triggered successfully',
      },
    });
  } catch (error) {
    console.error('Error triggering scheduled processing:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SCHEDULER_TRIGGER_ERROR',
        message: 'Failed to trigger scheduled processing',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;