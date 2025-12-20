import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { auditWorkspaceAction } from '../middleware/audit-logging.middleware';

// Import existing route handlers
import workspaceRoutes from './workspace.routes';
import teamRoutes from './team.routes';
import taskRoutes from './task.routes';
import workspaceCommunicationRoutes from './workspace-communication.routes';
import workspaceTemplateRoutes from './workspace-templates';
import workspaceMarketplaceIntegrationRoutes from './workspace-marketplace-integration.routes';
import workspaceSecurityRoutes from './workspace-security.routes';
import workspaceLifecycleRoutes from './workspace-lifecycle.routes';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * Workspace API Routes
 * Consolidated workspace management endpoints with proper authorization and audit logging
 */

// Core workspace management
router.use('/workspace', workspaceRoutes);

// Team management
router.use('/team', teamRoutes);

// Task management  
router.use('/task', taskRoutes);

// Communication
router.use('/communication', workspaceCommunicationRoutes);

// Templates
router.use('/templates', workspaceTemplateRoutes);

// Marketplace integration
router.use('/marketplace-integration', workspaceMarketplaceIntegrationRoutes);

// Security
router.use('/security', workspaceSecurityRoutes);

// Lifecycle management
router.use('/lifecycle', workspaceLifecycleRoutes);

/**
 * Additional consolidated endpoints for comprehensive workspace management
 */

/**
 * GET /api/workspace-api/health
 * Health check for workspace API
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
          workspace: 'ok',
          team: 'ok',
          task: 'ok',
          communication: 'ok',
          templates: 'ok',
          marketplace: 'ok',
          security: 'ok',
          lifecycle: 'ok',
        },
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: {
        code: 'WORKSPACE_API_HEALTH_ERROR',
        message: 'Workspace API health check failed',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/workspace-api/permissions
 * Get available workspace permissions
 */
router.get('/permissions', auditWorkspaceAction('list_permissions'), async (_req: Request, res: Response) => {
  try {
    const permissions = {
      workspace: [
        'workspace:read',
        'workspace:write',
        'workspace:delete',
      ],
      team: [
        'team:invite',
        'team:remove',
        'team:manage_roles',
      ],
      task: [
        'task:create',
        'task:assign',
        'task:update',
        'task:delete',
      ],
      communication: [
        'communication:send',
        'communication:broadcast',
        'communication:manage_channels',
      ],
      analytics: [
        'analytics:view',
      ],
      template: [
        'template:create',
        'template:apply',
      ],
    };

    res.json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    console.error('Error getting workspace permissions:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_PERMISSIONS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get workspace permissions',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/workspace-api/roles
 * Get available workspace roles
 */
router.get('/roles', auditWorkspaceAction('list_roles'), async (req: Request, res: Response) => {
  try {
    const roles = {
      WORKSPACE_OWNER: {
        name: 'Workspace Owner',
        description: 'Full administrative access to workspace',
        permissions: [
          'workspace:read', 'workspace:write', 'workspace:delete',
          'team:invite', 'team:remove', 'team:manage_roles',
          'task:create', 'task:assign', 'task:update', 'task:delete',
          'communication:send', 'communication:broadcast', 'communication:manage_channels',
          'analytics:view', 'template:create', 'template:apply'
        ],
      },
      TEAM_LEAD: {
        name: 'Team Lead',
        description: 'Team management and task coordination',
        permissions: [
          'workspace:read', 'workspace:write',
          'team:invite', 'team:manage_roles',
          'task:create', 'task:assign', 'task:update', 'task:delete',
          'communication:send', 'communication:broadcast', 'communication:manage_channels',
          'analytics:view'
        ],
      },
      EVENT_COORDINATOR: {
        name: 'Event Coordinator',
        description: 'Event planning and coordination',
        permissions: [
          'workspace:read',
          'task:create', 'task:assign', 'task:update',
          'communication:send', 'communication:broadcast',
          'analytics:view'
        ],
      },
      VOLUNTEER_MANAGER: {
        name: 'Volunteer Manager',
        description: 'Volunteer coordination and management',
        permissions: [
          'workspace:read',
          'team:invite',
          'task:create', 'task:assign', 'task:update',
          'communication:send', 'communication:broadcast'
        ],
      },
      TECHNICAL_SPECIALIST: {
        name: 'Technical Specialist',
        description: 'Technical tasks and support',
        permissions: [
          'workspace:read',
          'task:create', 'task:update',
          'communication:send'
        ],
      },
      MARKETING_LEAD: {
        name: 'Marketing Lead',
        description: 'Marketing and promotion activities',
        permissions: [
          'workspace:read',
          'task:create', 'task:update',
          'communication:send', 'communication:broadcast'
        ],
      },
      GENERAL_VOLUNTEER: {
        name: 'General Volunteer',
        description: 'Basic volunteer access',
        permissions: [
          'workspace:read',
          'task:update',
          'communication:send'
        ],
      },
    };

    res.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    console.error('Error getting workspace roles:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_ROLES_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get workspace roles',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/workspace-api/stats
 * Get overall workspace API statistics
 */
router.get('/stats', auditWorkspaceAction('view_api_stats'), async (req: Request, res: Response) => {
  try {
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

    // This would typically aggregate stats from various services
    const stats = {
      totalWorkspaces: 0,
      activeWorkspaces: 0,
      totalTeamMembers: 0,
      totalTasks: 0,
      totalMessages: 0,
      totalTemplates: 0,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting workspace API stats:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_API_STATS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get workspace API stats',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;