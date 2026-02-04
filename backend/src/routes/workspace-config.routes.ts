/**
 * Workspace Configuration API Routes
 * Provides endpoints for workspace configuration management
 */

import { Router, Request, Response } from 'express';
import { workspaceConfig } from '../config/workspace.config';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';

const router = Router();

/**
 * GET /api/workspace-config
 * Get public workspace configuration
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const config = workspaceConfig.getPublicConfig();
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error fetching workspace configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workspace configuration'
    });
  }
});

/**
 * GET /api/workspace-config/health
 * Check workspace configuration health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const validation = workspaceConfig.validateConfiguration();
    
    res.json({
      success: true,
      data: {
        enabled: workspaceConfig.isEnabled(),
        valid: validation.valid,
        errors: validation.errors,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error checking workspace configuration health:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check workspace configuration health'
    });
  }
});

/**
 * GET /api/workspace-config/admin
 * Get full workspace configuration (admin only)
 */
router.get('/admin', 
  authenticate,
  authorize(['SUPER_ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const config = workspaceConfig.getConfig();
      
      // Remove sensitive data from response
      const safeConfig = {
        ...config,
        encryptionKey: config.encryptionKey ? '[CONFIGURED]' : '[NOT SET]'
      };
      
      res.json({
        success: true,
        data: safeConfig
      });
    } catch (error) {
      console.error('Error fetching admin workspace configuration:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch workspace configuration'
      });
    }
  }
);

/**
 * GET /api/workspace-config/features
 * Get workspace feature flags
 */
router.get('/features', async (req: Request, res: Response) => {
  try {
    const features = {
      workspaceEnabled: workspaceConfig.isEnabled(),
      autoProvision: workspaceConfig.isAutoProvisionEnabled(),
      templateSharing: workspaceConfig.isTemplateSharingEnabled(),
      notifications: workspaceConfig.isNotificationEnabled(),
      emailNotifications: workspaceConfig.isEmailNotificationEnabled(),
      pushNotifications: workspaceConfig.isPushNotificationEnabled(),
      analytics: workspaceConfig.isAnalyticsEnabled(),
      performanceMonitoring: workspaceConfig.isPerformanceMonitoringEnabled()
    };
    
    res.json({
      success: true,
      data: features
    });
  } catch (error) {
    console.error('Error fetching workspace features:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workspace features'
    });
  }
});

/**
 * GET /api/workspace-config/limits
 * Get workspace limits and constraints
 */
router.get('/limits', async (req: Request, res: Response) => {
  try {
    const limits = {
      maxTeamSize: workspaceConfig.getMaxTeamSize(),
      maxTasksPerWorkspace: workspaceConfig.getMaxTasksPerWorkspace(),
      sessionTimeoutMinutes: workspaceConfig.getSessionTimeoutMinutes(),
      dissolutionDelayDays: workspaceConfig.getDissolutionDelayDays(),
      auditLogRetentionDays: workspaceConfig.getAuditLogRetentionDays(),
      metricsRetentionDays: workspaceConfig.getMetricsRetentionDays()
    };
    
    res.json({
      success: true,
      data: limits
    });
  } catch (error) {
    console.error('Error fetching workspace limits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workspace limits'
    });
  }
});

export default router;