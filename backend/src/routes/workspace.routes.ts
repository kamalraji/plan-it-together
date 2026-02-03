import { Router, Request, Response } from 'express';
import { workspaceService } from '../services/workspace.service';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * POST /api/workspace/provision
 * Provision a new workspace for an event
 */
router.post('/provision', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.body;
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

    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_EVENT_ID',
          message: 'Event ID is required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const workspace = await workspaceService.provisionWorkspace(eventId, userId);
    
    res.status(201).json({
      success: true,
      data: workspace,
    });
  } catch (error) {
    console.error('Error provisioning workspace:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'WORKSPACE_PROVISION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to provision workspace',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/workspace/:workspaceId
 * Get workspace by ID
 */
router.get('/:workspaceId', async (req: Request, res: Response) => {
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

    const workspace = await workspaceService.getWorkspace(workspaceId, userId);
    
    res.json({
      success: true,
      data: workspace,
    });
  } catch (error) {
    console.error('Error getting workspace:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_WORKSPACE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get workspace',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/workspace/event/:eventId
 * Get workspace by event ID
 */
router.get('/event/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
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

    const workspace = await workspaceService.getWorkspaceByEventId(eventId, userId);
    
    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'WORKSPACE_NOT_FOUND',
          message: 'Workspace not found for this event',
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.json({
      success: true,
      data: workspace,
    });
  } catch (error) {
    console.error('Error getting workspace by event ID:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_WORKSPACE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get workspace',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * PUT /api/workspace/:workspaceId
 * Update workspace settings
 */
router.put('/:workspaceId', async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const updates = req.body;
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

    const workspace = await workspaceService.updateWorkspace(workspaceId, userId, updates);
    
    res.json({
      success: true,
      data: workspace,
    });
  } catch (error) {
    console.error('Error updating workspace:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_WORKSPACE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update workspace',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/workspace/:workspaceId/dissolve
 * Dissolve workspace (after event completion)
 */
router.post('/:workspaceId/dissolve', async (req: Request, res: Response) => {
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

    await workspaceService.dissolveWorkspace(workspaceId, userId);
    
    res.json({
      success: true,
      data: {
        message: 'Workspace dissolution initiated successfully',
        workspaceId,
      },
    });
  } catch (error) {
    console.error('Error dissolving workspace:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DISSOLVE_WORKSPACE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to dissolve workspace',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/workspace/:workspaceId/apply-template
 * Apply workspace template
 */
router.post('/:workspaceId/apply-template', async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const { templateId } = req.body;
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

    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TEMPLATE_ID',
          message: 'Template ID is required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    await workspaceService.applyTemplate(workspaceId, templateId, userId);
    
    res.json({
      success: true,
      data: {
        message: 'Template applied successfully',
        workspaceId,
        templateId,
      },
    });
  } catch (error) {
    console.error('Error applying template:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'APPLY_TEMPLATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to apply template',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/workspace/:workspaceId/analytics
 * Get workspace analytics
 */
router.get('/:workspaceId/analytics', async (req: Request, res: Response) => {
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

    const analytics = await workspaceService.getWorkspaceAnalytics(workspaceId, userId);
    
    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Error getting workspace analytics:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_ANALYTICS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get workspace analytics',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;