import { Request, Response, NextFunction } from 'express';
import { WorkspaceRole } from '@prisma/client';
import { teamService } from '../services/team.service';
import { workspaceService } from '../services/workspace.service';

// Extend Express Request type to include workspace context
declare global {
  namespace Express {
    interface Request {
      workspace?: {
        workspaceId: string;
        role: WorkspaceRole;
        permissions: string[];
      };
    }
  }
}

/**
 * Workspace access control middleware
 * Verifies user has access to workspace and attaches workspace context
 */
export function requireWorkspaceAccess(req: Request, res: Response, next: NextFunction): void {
  const workspaceId = req.params.workspaceId;
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  if (!workspaceId) {
    res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_WORKSPACE_ID',
        message: 'Workspace ID is required',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Verify workspace access asynchronously
  (async () => {
    try {
      // Check if user has access to workspace
      const teamMember = await teamService.getTeamMemberByUserId(workspaceId, userId);
      
      if (!teamMember) {
        res.status(403).json({
          success: false,
          error: {
            code: 'WORKSPACE_ACCESS_DENIED',
            message: 'Access to workspace denied',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Check if workspace is active
      const workspace = await workspaceService.getWorkspace(workspaceId, userId);
      if (!workspace || workspace.status === 'DISSOLVED') {
        res.status(403).json({
          success: false,
          error: {
            code: 'WORKSPACE_INACTIVE',
            message: 'Workspace is not active',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Attach workspace context to request
      req.workspace = {
        workspaceId,
        role: teamMember.role,
        permissions: getPermissionsForRole(teamMember.role),
      };

      next();
    } catch (error) {
      console.error('Workspace access check failed:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'WORKSPACE_ACCESS_ERROR',
          message: 'Failed to verify workspace access',
          timestamp: new Date().toISOString(),
        },
      });
    }
  })();
}

/**
 * Require specific workspace role(s)
 */
export function requireWorkspaceRole(...allowedRoles: WorkspaceRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.workspace) {
      res.status(401).json({
        success: false,
        error: {
          code: 'WORKSPACE_CONTEXT_MISSING',
          message: 'Workspace context required',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.workspace.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_WORKSPACE_ROLE',
          message: 'Insufficient workspace role for this action',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    next();
  };
}

/**
 * Require specific workspace permission(s)
 */
export function requireWorkspacePermission(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.workspace) {
      res.status(401).json({
        success: false,
        error: {
          code: 'WORKSPACE_CONTEXT_MISSING',
          message: 'Workspace context required',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    const hasAllPermissions = requiredPermissions.every(permission =>
      req.workspace!.permissions.includes(permission)
    );

    if (!hasAllPermissions) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_WORKSPACE_PERMISSIONS',
          message: 'Insufficient workspace permissions for this action',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    next();
  };
}

/**
 * Check if user is workspace owner or has admin role
 */
export function requireWorkspaceOwnerOrAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.workspace) {
    res.status(401).json({
      success: false,
      error: {
        code: 'WORKSPACE_CONTEXT_MISSING',
        message: 'Workspace context required',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  const adminRoles = [WorkspaceRole.WORKSPACE_OWNER, WorkspaceRole.TEAM_LEAD];
  
  if (!adminRoles.includes(req.workspace.role)) {
    res.status(403).json({
      success: false,
      error: {
        code: 'WORKSPACE_ADMIN_REQUIRED',
        message: 'Workspace owner or admin access required',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  next();
}

/**
 * Get permissions for workspace role
 */
function getPermissionsForRole(role: WorkspaceRole): string[] {
  const permissions: Record<WorkspaceRole, string[]> = {
    [WorkspaceRole.WORKSPACE_OWNER]: [
      'workspace:read',
      'workspace:write',
      'workspace:delete',
      'team:invite',
      'team:remove',
      'team:manage_roles',
      'task:create',
      'task:assign',
      'task:update',
      'task:delete',
      'communication:send',
      'communication:broadcast',
      'communication:manage_channels',
      'analytics:view',
      'template:create',
      'template:apply',
    ],
    [WorkspaceRole.TEAM_LEAD]: [
      'workspace:read',
      'workspace:write',
      'team:invite',
      'team:manage_roles',
      'task:create',
      'task:assign',
      'task:update',
      'task:delete',
      'communication:send',
      'communication:broadcast',
      'communication:manage_channels',
      'analytics:view',
    ],
    [WorkspaceRole.EVENT_COORDINATOR]: [
      'workspace:read',
      'task:create',
      'task:assign',
      'task:update',
      'communication:send',
      'communication:broadcast',
      'analytics:view',
    ],
    [WorkspaceRole.VOLUNTEER_MANAGER]: [
      'workspace:read',
      'team:invite',
      'task:create',
      'task:assign',
      'task:update',
      'communication:send',
      'communication:broadcast',
    ],
    [WorkspaceRole.TECHNICAL_SPECIALIST]: [
      'workspace:read',
      'task:create',
      'task:update',
      'communication:send',
    ],
    [WorkspaceRole.MARKETING_LEAD]: [
      'workspace:read',
      'task:create',
      'task:update',
      'communication:send',
      'communication:broadcast',
    ],
    [WorkspaceRole.GENERAL_VOLUNTEER]: [
      'workspace:read',
      'task:update',
      'communication:send',
    ],
  };

  return permissions[role] || [];
}