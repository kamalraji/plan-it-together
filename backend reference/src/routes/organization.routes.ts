import { Router, Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { organizationService } from '../services/organization.service';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * Create a new organization
 * POST /api/organizations
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const organization = await organizationService.createOrganization(req.body);
    
    // Add the creator as the owner
    await organizationService.addAdmin(organization.id, (req as any).user.id, 'OWNER');
    
    res.status(201).json({
      success: true,
      data: organization,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'CREATE_ORGANIZATION_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Get organization by ID
 * GET /api/organizations/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const organization = await organizationService.getOrganization(req.params.id);
    res.json({
      success: true,
      data: organization,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: {
        code: 'ORGANIZATION_NOT_FOUND',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Get organization by page URL
 * GET /api/organizations/url/:pageUrl
 */
router.get('/url/:pageUrl', async (req: Request, res: Response) => {
  try {
    const organization = await organizationService.getOrganizationByUrl(req.params.pageUrl);
    res.json({
      success: true,
      data: organization,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: {
        code: 'ORGANIZATION_NOT_FOUND',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Update organization
 * PUT /api/organizations/:id
 */
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    // Check if user is an admin of this organization
    const isAdmin = await organizationService.isOrganizationAdmin(
      req.params.id,
      (req as any).user.id
    );
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this organization',
          timestamp: new Date().toISOString(),
        },
      });
    }
    
    const organization = await organizationService.updateOrganization(
      req.params.id,
      req.body
    );
    
    res.json({
      success: true,
      data: organization,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'UPDATE_ORGANIZATION_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Verify or reject an organization (Super Admin only)
 * POST /api/organizations/:id/verify
 */
router.post(
  '/:id/verify',
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  async (req: Request, res: Response) => {
    try {
      const { approved, reason } = req.body;
      
      const organization = await organizationService.verifyOrganization(
        req.params.id,
        approved,
        reason
      );
      
      res.json({
        success: true,
        data: organization,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VERIFICATION_ERROR',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * Get organization admins
 * GET /api/organizations/:id/admins
 */
router.get('/:id/admins', authenticate, async (req: Request, res: Response) => {
  try {
    const admins = await organizationService.getOrganizationAdmins(req.params.id);
    res.json({
      success: true,
      data: admins,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'GET_ADMINS_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Invite a user to be an admin of organization
 * POST /api/organizations/:id/invite-admin
 */
router.post('/:id/invite-admin', authenticate, async (req: Request, res: Response) => {
  try {
    // Check if user is an admin of this organization
    const isAdmin = await organizationService.isOrganizationAdmin(
      req.params.id,
      (req as any).user.id
    );
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to invite admins to this organization',
          timestamp: new Date().toISOString(),
        },
      });
    }
    
    const { email, role } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email is required',
          timestamp: new Date().toISOString(),
        },
      });
    }
    
    const result = await organizationService.inviteAdmin(
      req.params.id,
      (req as any).user.id,
      email,
      role || 'ADMIN'
    );
    
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVITE_ADMIN_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Add an admin to organization
 * POST /api/organizations/:id/admins
 */
router.post('/:id/admins', authenticate, async (req: Request, res: Response) => {
  try {
    // Check if user is an admin of this organization
    const isAdmin = await organizationService.isOrganizationAdmin(
      req.params.id,
      (req as any).user.id
    );
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to add admins to this organization',
          timestamp: new Date().toISOString(),
        },
      });
    }
    
    const { userId, role } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'User ID is required',
          timestamp: new Date().toISOString(),
        },
      });
    }
    
    const admin = await organizationService.addAdmin(req.params.id, userId, role || 'ADMIN');
    
    res.status(201).json({
      success: true,
      data: admin,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'ADD_ADMIN_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Remove an admin from organization
 * DELETE /api/organizations/:id/admins/:userId
 */
router.delete('/:id/admins/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    // Check if user is an admin of this organization
    const isAdmin = await organizationService.isOrganizationAdmin(
      req.params.id,
      (req as any).user.id
    );
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to remove admins from this organization',
          timestamp: new Date().toISOString(),
        },
      });
    }
    
    await organizationService.removeAdmin(req.params.id, req.params.userId);
    
    res.json({
      success: true,
      data: { message: 'Admin removed successfully' },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'REMOVE_ADMIN_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Get organization analytics
 * GET /api/organizations/:id/analytics
 */
router.get('/:id/analytics', authenticate, async (req: Request, res: Response) => {
  try {
    // Check if user is an admin of this organization
    const isAdmin = await organizationService.isOrganizationAdmin(
      req.params.id,
      (req as any).user.id
    );
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to view analytics for this organization',
          timestamp: new Date().toISOString(),
        },
      });
    }
    
    const analytics = await organizationService.getOrganizationAnalytics(req.params.id);
    
    res.json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'ANALYTICS_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * List organizations with filters
 * GET /api/organizations
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const filters = {
      category: req.query.category as any,
      verificationStatus: req.query.verificationStatus as any,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };
    
    const organizations = await organizationService.listOrganizations(filters);
    
    res.json({
      success: true,
      data: organizations,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'LIST_ORGANIZATIONS_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
