import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditLogEntry {
  userId: string;
  workspaceId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

/**
 * Audit logging middleware
 * Logs all workspace-related actions for compliance and security
 */
export function auditLog(action: string, resource: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const originalSend = res.send;
    const startTime = Date.now();

    // Capture response data
    res.send = function(data: any) {
      const responseTime = Date.now() - startTime;
      const success = res.statusCode < 400;

      // Create audit log entry
      const auditEntry: AuditLogEntry = {
        userId: req.user?.userId || 'anonymous',
        workspaceId: req.workspace?.workspaceId || req.params.workspaceId,
        action,
        resource,
        resourceId: req.params.id || req.params.taskId || req.params.teamMemberId || req.params.channelId,
        details: {
          method: req.method,
          path: req.path,
          query: req.query,
          body: sanitizeRequestBody(req.body),
          responseTime,
          statusCode: res.statusCode,
        },
        ipAddress: getClientIpAddress(req),
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        success,
        errorMessage: success ? undefined : extractErrorMessage(data),
      };

      // Log to database asynchronously
      logAuditEntry(auditEntry).catch(error => {
        console.error('Failed to log audit entry:', error);
      });

      // Call original send
      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Workspace-specific audit logging
 */
export function auditWorkspaceAction(action: string) {
  return auditLog(action, 'workspace');
}

/**
 * Team management audit logging
 */
export function auditTeamAction(action: string) {
  return auditLog(action, 'team');
}

/**
 * Task management audit logging
 */
export function auditTaskAction(action: string) {
  return auditLog(action, 'task');
}

/**
 * Communication audit logging
 */
export function auditCommunicationAction(action: string) {
  return auditLog(action, 'communication');
}

/**
 * Log audit entry to database
 */
async function logAuditEntry(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        workspaceId: entry.workspaceId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        details: entry.details,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        timestamp: entry.timestamp,
        success: entry.success,
        errorMessage: entry.errorMessage,
      },
    });
  } catch (error) {
    console.error('Database audit logging failed:', error);
    
    // Fallback to file logging
    console.log('AUDIT_LOG:', JSON.stringify(entry));
  }
}

/**
 * Sanitize request body for logging (remove sensitive data)
 */
function sanitizeRequestBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
  const sanitized = { ...body };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Extract client IP address from request
 */
function getClientIpAddress(req: Request): string {
  return (
    req.headers['x-forwarded-for'] as string ||
    req.headers['x-real-ip'] as string ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

/**
 * Extract error message from response data
 */
function extractErrorMessage(data: any): string | undefined {
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return parsed.error?.message;
    } catch {
      return undefined;
    }
  }

  if (data && typeof data === 'object' && data.error) {
    return data.error.message;
  }

  return undefined;
}

/**
 * Get audit logs for workspace
 */
export async function getWorkspaceAuditLogs(
  workspaceId: string,
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
    action?: string;
    resource?: string;
  } = {}
): Promise<any[]> {
  const {
    limit = 100,
    offset = 0,
    startDate,
    endDate,
    action,
    resource,
  } = options;

  const where: any = {
    workspaceId,
  };

  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = startDate;
    if (endDate) where.timestamp.lte = endDate;
  }

  if (action) {
    where.action = action;
  }

  if (resource) {
    where.resource = resource;
  }

  return await prisma.auditLog.findMany({
    where,
    orderBy: {
      timestamp: 'desc',
    },
    take: limit,
    skip: offset,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

/**
 * Get audit log statistics for workspace
 */
export async function getWorkspaceAuditStats(
  workspaceId: string,
  startDate?: Date,
  endDate?: Date
): Promise<any> {
  const where: any = {
    workspaceId,
  };

  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = startDate;
    if (endDate) where.timestamp.lte = endDate;
  }

  const [
    totalActions,
    successfulActions,
    failedActions,
    actionsByResource,
    actionsByUser,
  ] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.count({ where: { ...where, success: true } }),
    prisma.auditLog.count({ where: { ...where, success: false } }),
    prisma.auditLog.groupBy({
      by: ['resource'],
      where,
      _count: {
        id: true,
      },
    }),
    prisma.auditLog.groupBy({
      by: ['userId'],
      where,
      _count: {
        id: true,
      },
    }),
  ]);

  return {
    totalActions,
    successfulActions,
    failedActions,
    successRate: totalActions > 0 ? (successfulActions / totalActions) * 100 : 0,
    actionsByResource,
    actionsByUser,
  };
}