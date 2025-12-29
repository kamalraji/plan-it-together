import { Router, Request, Response } from 'express';
import { marketplaceService } from '../services/marketplace.service';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * Search services with filters
 * GET /api/marketplace/search
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const searchParams = {
      query: req.query.q as string,
      category: req.query.category as string,
      location: req.query.location as string,
      dateRange: req.query.startDate && req.query.endDate ? {
        startDate: new Date(req.query.startDate as string),
        endDate: new Date(req.query.endDate as string),
      } : undefined,
      budgetRange: req.query.minBudget && req.query.maxBudget ? {
        min: parseFloat(req.query.minBudget as string),
        max: parseFloat(req.query.maxBudget as string),
      } : undefined,
      verifiedOnly: req.query.verifiedOnly === 'true',
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };
    
    const results = await marketplaceService.searchServices(searchParams);
    
    res.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'SEARCH_SERVICES_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Get services by category
 * GET /api/marketplace/categories/:category
 */
router.get('/categories/:category', async (req: Request, res: Response) => {
  try {
    const services = await marketplaceService.getServicesByCategory(req.params.category as any);
    
    res.json({
      success: true,
      data: services,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'GET_CATEGORY_SERVICES_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Get featured services
 * GET /api/marketplace/featured
 */
router.get('/featured', async (req: Request, res: Response) => {
  try {
    const eventType = req.query.eventType as string;
    const location = req.query.location as string;
    
    const services = await marketplaceService.getFeaturedServices(eventType, location);
    
    res.json({
      success: true,
      data: services,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'GET_FEATURED_SERVICES_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Get service recommendations for an event
 * GET /api/marketplace/recommendations/:eventId
 */
router.get('/recommendations/:eventId', authenticate, async (req: Request, res: Response) => {
  try {
    const services = await marketplaceService.getServiceRecommendations(req.params.eventId);
    
    res.json({
      success: true,
      data: services,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'GET_RECOMMENDATIONS_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Get service by ID
 * GET /api/marketplace/services/:id
 */
router.get('/services/:id', async (req: Request, res: Response) => {
  try {
    const service = await marketplaceService.getServiceById(req.params.id);
    
    res.json({
      success: true,
      data: service,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: {
        code: 'SERVICE_NOT_FOUND',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;