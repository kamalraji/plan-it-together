import { Router, Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { vendorService } from '../services/vendor.service';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * Register as a vendor
 * POST /api/vendors/register
 */
router.post('/register', authenticate, async (req: Request, res: Response) => {
  try {
    const vendor = await vendorService.registerVendor((req as any).user.id, req.body);
    
    res.status(201).json({
      success: true,
      data: vendor,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VENDOR_REGISTRATION_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Get vendor profile by ID
 * GET /api/vendors/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const vendor = await vendorService.getVendorProfile(req.params.id);
    res.json({
      success: true,
      data: vendor,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: {
        code: 'VENDOR_NOT_FOUND',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Get current user's vendor profile
 * GET /api/vendors/profile/me
 */
router.get('/profile/me', authenticate, async (req: Request, res: Response) => {
  try {
    const vendor = await vendorService.getVendorProfileByUserId((req as any).user.id);
    res.json({
      success: true,
      data: vendor,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: {
        code: 'VENDOR_PROFILE_NOT_FOUND',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Update vendor profile
 * PUT /api/vendors/:id
 */
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    // Check if user owns this vendor profile
    const existingVendor = await vendorService.getVendorProfile(req.params.id);
    
    if (existingVendor.userId !== (req as any).user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only update your own vendor profile',
          timestamp: new Date().toISOString(),
        },
      });
    }
    
    const vendor = await vendorService.updateVendorProfile(req.params.id, req.body);
    
    res.json({
      success: true,
      data: vendor,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'UPDATE_VENDOR_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Submit verification documents
 * POST /api/vendors/:id/verification
 */
router.post('/:id/verification', authenticate, async (req: Request, res: Response) => {
  try {
    // Check if user owns this vendor profile
    const existingVendor = await vendorService.getVendorProfile(req.params.id);
    
    if (existingVendor.userId !== (req as any).user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only submit verification documents for your own profile',
          timestamp: new Date().toISOString(),
        },
      });
    }
    
    const updatedVendor = await vendorService.submitVerificationDocuments(req.params.id, req.body);
    
    res.json({
      success: true,
      data: updatedVendor,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VERIFICATION_SUBMISSION_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Resubmit verification documents after rejection
 * POST /api/vendors/:id/verification/resubmit
 */
router.post('/:id/verification/resubmit', authenticate, async (req: Request, res: Response) => {
  try {
    // Check if user owns this vendor profile
    const existingVendor = await vendorService.getVendorProfile(req.params.id);
    
    if (existingVendor.userId !== (req as any).user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only resubmit verification for your own profile',
          timestamp: new Date().toISOString(),
        },
      });
    }
    
    const updatedVendor = await vendorService.resubmitVerification(req.params.id, req.body);
    
    res.json({
      success: true,
      data: updatedVendor,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VERIFICATION_RESUBMISSION_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Verify or reject a vendor (Super Admin only)
 * POST /api/vendors/:id/verify
 */
router.post(
  '/:id/verify',
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  async (req: Request, res: Response) => {
    try {
      const { approved, reason } = req.body;
      const reviewerId = (req as any).user.id;
      
      const vendor = await vendorService.verifyVendor(req.params.id, approved, reason, reviewerId);
      
      res.json({
        success: true,
        data: vendor,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VENDOR_VERIFICATION_ERROR',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * Get vendors pending verification (Super Admin only)
 * GET /api/vendors/verification/pending
 */
router.get(
  '/verification/pending',
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      
      const vendors = await vendorService.getVendorsPendingVerification(limit, offset);
      
      res.json({
        success: true,
        data: vendors,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'GET_PENDING_VENDORS_ERROR',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * Get verification statistics (Super Admin only)
 * GET /api/vendors/verification/stats
 */
router.get(
  '/verification/stats',
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  async (req: Request, res: Response) => {
    try {
      const stats = await vendorService.getVerificationStats();
      
      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'GET_VERIFICATION_STATS_ERROR',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * Create a service listing
 * POST /api/vendors/:id/services
 */
router.post('/:id/services', authenticate, async (req: Request, res: Response) => {
  try {
    // Check if user owns this vendor profile
    const existingVendor = await vendorService.getVendorProfile(req.params.id);
    
    if (existingVendor.userId !== (req as any).user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only create services for your own vendor profile',
          timestamp: new Date().toISOString(),
        },
      });
    }
    
    const service = await vendorService.createServiceListing(req.params.id, req.body);
    
    res.status(201).json({
      success: true,
      data: service,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'CREATE_SERVICE_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Get vendor's service listings
 * GET /api/vendors/:id/services
 */
router.get('/:id/services', async (req: Request, res: Response) => {
  try {
    const services = await vendorService.getVendorServiceListings(req.params.id);
    res.json({
      success: true,
      data: services,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'GET_SERVICES_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Update a service listing
 * PUT /api/vendors/:vendorId/services/:serviceId
 */
router.put('/:vendorId/services/:serviceId', authenticate, async (req: Request, res: Response) => {
  try {
    // Check if user owns this vendor profile
    const existingVendor = await vendorService.getVendorProfile(req.params.vendorId);
    
    if (existingVendor.userId !== (req as any).user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only update services for your own vendor profile',
          timestamp: new Date().toISOString(),
        },
      });
    }
    
    const service = await vendorService.updateServiceListing(req.params.serviceId, req.body);
    
    res.json({
      success: true,
      data: service,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'UPDATE_SERVICE_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Delete a service listing
 * DELETE /api/vendors/:vendorId/services/:serviceId
 */
router.delete('/:vendorId/services/:serviceId', authenticate, async (req: Request, res: Response) => {
  try {
    // Check if user owns this vendor profile
    const existingVendor = await vendorService.getVendorProfile(req.params.vendorId);
    
    if (existingVendor.userId !== (req as any).user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only delete services for your own vendor profile',
          timestamp: new Date().toISOString(),
        },
      });
    }
    
    await vendorService.deleteServiceListing(req.params.serviceId);
    
    res.json({
      success: true,
      data: { message: 'Service listing deleted successfully' },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'DELETE_SERVICE_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Get vendor analytics
 * GET /api/vendors/:id/analytics
 */
router.get('/:id/analytics', authenticate, async (req: Request, res: Response) => {
  try {
    // Check if user owns this vendor profile
    const existingVendor = await vendorService.getVendorProfile(req.params.id);
    
    if (existingVendor.userId !== (req as any).user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only view analytics for your own vendor profile',
          timestamp: new Date().toISOString(),
        },
      });
    }
    
    const analytics = await vendorService.getVendorAnalytics(req.params.id);
    
    res.json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VENDOR_ANALYTICS_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Get vendor performance metrics
 * GET /api/vendors/:id/performance
 */
router.get('/:id/performance', authenticate, async (req: Request, res: Response) => {
  try {
    const existingVendor = await vendorService.getVendorProfile(req.params.id);
    
    if (existingVendor.userId !== (req as any).user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only view performance metrics for your own vendor profile',
          timestamp: new Date().toISOString(),
        },
      });
    }
    
    const metrics = await vendorService.getVendorPerformanceMetrics(req.params.id);
    
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VENDOR_PERFORMANCE_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Get vendor insights and recommendations
 * GET /api/vendors/:id/insights
 */
router.get('/:id/insights', authenticate, async (req: Request, res: Response) => {
  try {
    const existingVendor = await vendorService.getVendorProfile(req.params.id);
    
    if (existingVendor.userId !== (req as any).user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only view insights for your own vendor profile',
          timestamp: new Date().toISOString(),
        },
      });
    }
    
    const insights = await vendorService.getVendorInsights(req.params.id);
    
    res.json({
      success: true,
      data: insights,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VENDOR_INSIGHTS_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Get vendor trend data
 * GET /api/vendors/:id/trends
 */
router.get('/:id/trends', authenticate, async (req: Request, res: Response) => {
  try {
    const existingVendor = await vendorService.getVendorProfile(req.params.id);
    
    if (existingVendor.userId !== (req as any).user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only view trends for your own vendor profile',
          timestamp: new Date().toISOString(),
        },
      });
    }
    
    const months = req.query.months ? parseInt(req.query.months as string) : undefined;
    const trends = await vendorService.getVendorTrendData(req.params.id, months);
    
    res.json({
      success: true,
      data: trends,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VENDOR_TRENDS_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Get market intelligence
 * GET /api/vendors/market/intelligence
 */
router.get('/market/intelligence', authenticate, async (req: Request, res: Response) => {
  try {
    const intelligence = await vendorService.getMarketIntelligence();
    
    res.json({
      success: true,
      data: intelligence,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'MARKET_INTELLIGENCE_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Get verified vendors count by category
 * GET /api/vendors/verification/categories
 */
router.get('/verification/categories', async (req: Request, res: Response) => {
  try {
    const categoryCount = await vendorService.getVerifiedVendorsByCategory();
    
    res.json({
      success: true,
      data: categoryCount,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'GET_VERIFIED_CATEGORIES_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * List vendors with filters
 * GET /api/vendors
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const filters = {
      category: req.query.category as any,
      verificationStatus: req.query.verificationStatus as any,
      location: req.query.location as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };
    
    const vendors = await vendorService.listVendors(filters);
    
    res.json({
      success: true,
      data: vendors,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'LIST_VENDORS_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;