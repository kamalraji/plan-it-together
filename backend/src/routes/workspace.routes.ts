import { Router, Request, Response } from 'express';
import { workspaceService } from '../services/workspace.service';
import { authenticate } from '../middleware/auth.middleware';
import { 
  requireWorkspaceAccess, 
  requireWorkspaceOwnerOrAdmin,
  requireWorkspacePermission 
} from '../middleware/workspace-access.middleware';
import { 
  auditWorkspaceAction,
  getWorkspaceAuditLogs,
  getWorkspaceAuditStats 
} from '../middleware/audit-logging.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * POST /api/workspace/provision
 * Provision a new workspace for an event
 */
router.post('/provision', auditWorkspaceAction('provision'), async (req: Request, res: Response) => {
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
router.get('/:workspaceId', requireWorkspaceAccess, auditWorkspaceAction('read'), async (req: Request, res: Response) => {
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
router.get('/event/:eventId', auditWorkspaceAction('read'), async (req: Request, res: Response) => {
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
router.put('/:workspaceId', requireWorkspaceAccess, requireWorkspacePermission('workspace:write'), auditWorkspaceAction('update'), async (req: Request, res: Response) => {
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
router.post('/:workspaceId/dissolve', requireWorkspaceAccess, requireWorkspaceOwnerOrAdmin, auditWorkspaceAction('dissolve'), async (req: Request, res: Response) => {
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
router.post('/:workspaceId/apply-template', requireWorkspaceAccess, requireWorkspacePermission('template:apply'), auditWorkspaceAction('apply_template'), async (req: Request, res: Response) => {
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
router.get('/:workspaceId/analytics', requireWorkspaceAccess, requireWorkspacePermission('analytics:view'), auditWorkspaceAction('view_analytics'), async (req: Request, res: Response) => {
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

/**
 * GET /api/workspace/:workspaceId/dashboard
 * Get workspace dashboard data
 */
router.get('/:workspaceId/dashboard', requireWorkspaceAccess, auditWorkspaceAction('view_dashboard'), async (req: Request, res: Response) => {
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

    const dashboard = await workspaceService.getWorkspaceDashboard(workspaceId, userId);
    
    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error('Error getting workspace dashboard:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_DASHBOARD_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get workspace dashboard',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/workspace/:workspaceId/health
 * Get workspace health metrics
 */
router.get('/:workspaceId/health', requireWorkspaceAccess, requireWorkspacePermission('analytics:view'), auditWorkspaceAction('view_health'), async (req: Request, res: Response) => {
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

    const health = await workspaceService.getWorkspaceHealth(workspaceId, userId);
    
    res.json({
      success: true,
      data: health,
    });
  } catch (error) {
    console.error('Error getting workspace health:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_HEALTH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get workspace health',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/workspace/:workspaceId/audit-logs
 * Get workspace audit logs
 */
router.get('/:workspaceId/audit-logs', requireWorkspaceAccess, requireWorkspaceOwnerOrAdmin, auditWorkspaceAction('view_audit_logs'), async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user?.userId;
    const { 
      limit = '100', 
      offset = '0', 
      startDate, 
      endDate, 
      action, 
      resource 
    } = req.query;

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

    const options = {
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      action: action as string,
      resource: resource as string,
    };

    const auditLogs = await getWorkspaceAuditLogs(workspaceId, userId, options);
    
    res.json({
      success: true,
      data: auditLogs,
    });
  } catch (error) {
    console.error('Error getting workspace audit logs:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_AUDIT_LOGS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get workspace audit logs',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/workspace/:workspaceId/audit-stats
 * Get workspace audit statistics
 */
router.get('/:workspaceId/audit-stats', requireWorkspaceAccess, requireWorkspaceOwnerOrAdmin, auditWorkspaceAction('view_audit_stats'), async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user?.userId;
    const { startDate, endDate } = req.query;

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

    const stats = await getWorkspaceAuditStats(
      workspaceId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting workspace audit stats:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_AUDIT_STATS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get workspace audit stats',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/workspace/user/:userId
 * Get workspaces for user
 */
router.get('/user/:userId', auditWorkspaceAction('list_user_workspaces'), async (req: Request, res: Response) => {
  try {
    const { userId: targetUserId } = req.params;
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

    // Users can only view their own workspaces unless they have admin privileges
    if (userId !== targetUserId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'Cannot access other user workspaces',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const workspaces = await workspaceService.getUserWorkspaces(targetUserId);
    
    res.json({
      success: true,
      data: workspaces,
    });
  } catch (error) {
    console.error('Error getting user workspaces:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_USER_WORKSPACES_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get user workspaces',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/workspace/:workspaceId/export
 * Export workspace data
 */
router.post('/:workspaceId/export', requireWorkspaceAccess, requireWorkspacePermission('analytics:view'), auditWorkspaceAction('export_data'), async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const { format = 'json', includeAuditLogs = false } = req.body;
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

    // Validate format
    const validFormats = ['json', 'csv'];
    if (!validFormats.includes(format)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FORMAT',
          message: 'Invalid export format. Supported formats: json, csv',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const exportData = await workspaceService.exportWorkspaceData(workspaceId, userId, {
      format,
      includeAuditLogs,
    });
    
    // Set appropriate headers for file download
    const filename = `workspace-${workspaceId}-export-${new Date().toISOString().split('T')[0]}.${format}`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/csv');
    
    res.send(exportData);
  } catch (error) {
    console.error('Error exporting workspace data:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'EXPORT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to export workspace data',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;