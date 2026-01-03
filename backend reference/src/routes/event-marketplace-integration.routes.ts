import { Router } from 'express';
import { eventMarketplaceIntegrationService } from '../services/event-marketplace-integration.service';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import {
  ServiceRecommendationDTO,
  VendorTimelineSyncDTO,
  IntegratedCommunicationDTO,
} from '../types';

const router = Router();

/**
 * Get service recommendations for an event
 * GET /api/event-marketplace-integration/:eventId/recommendations
 */
router.get(
  '/:eventId/recommendations',
  authenticate,
  authorize(['ORGANIZER']),
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const organizerId = req.user!.userId;
      
      const options: ServiceRecommendationDTO = {
        preferredCategories: req.query.categories ? 
          (req.query.categories as string).split(',') : undefined,
        budgetRange: req.query.minBudget && req.query.maxBudget ? {
          min: parseFloat(req.query.minBudget as string),
          max: parseFloat(req.query.maxBudget as string),
        } : undefined,
        verifiedOnly: req.query.verifiedOnly === 'true',
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };

      const recommendations = await eventMarketplaceIntegrationService
        .getServiceRecommendationsForEvent(eventId, organizerId, options);

      res.json({
        success: true,
        data: recommendations,
      });
    } catch (error) {
      console.error('Error getting service recommendations:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'RECOMMENDATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get recommendations',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * Synchronize vendor timelines with event project management
 * POST /api/event-marketplace-integration/:eventId/sync-timelines
 */
router.post(
  '/:eventId/sync-timelines',
  authenticate,
  authorize(['ORGANIZER']),
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const organizerId = req.user!.userId;
      const syncData: VendorTimelineSyncDTO = req.body;

      const result = await eventMarketplaceIntegrationService
        .synchronizeVendorTimelines(eventId, organizerId, syncData);

      res.json(result);
    } catch (error) {
      console.error('Error synchronizing vendor timelines:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'SYNC_ERROR',
          message: error instanceof Error ? error.message : 'Failed to synchronize timelines',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * Create integrated communication with vendors
 * POST /api/event-marketplace-integration/:eventId/communicate
 */
router.post(
  '/:eventId/communicate',
  authenticate,
  authorize(['ORGANIZER']),
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const organizerId = req.user!.userId;
      const communicationData: IntegratedCommunicationDTO = req.body;

      const result = await eventMarketplaceIntegrationService
        .createIntegratedCommunication(eventId, organizerId, communicationData);

      res.json(result);
    } catch (error) {
      console.error('Error creating integrated communication:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'COMMUNICATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to send communication',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * Get integrated marketplace dashboard for an event
 * GET /api/event-marketplace-integration/:eventId/dashboard
 */
router.get(
  '/:eventId/dashboard',
  authenticate,
  authorize(['ORGANIZER']),
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const organizerId = req.user!.userId;

      const dashboard = await eventMarketplaceIntegrationService
        .getEventMarketplaceDashboard(eventId, organizerId);

      res.json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      console.error('Error getting marketplace dashboard:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'DASHBOARD_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get dashboard data',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * Get vendor coordination interface data
 * GET /api/event-marketplace-integration/:eventId/coordination
 */
router.get(
  '/:eventId/coordination',
  authenticate,
  authorize(['ORGANIZER']),
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const organizerId = req.user!.userId;

      const coordinationData = await eventMarketplaceIntegrationService
        .getVendorCoordinationData(eventId, organizerId);

      res.json({
        success: true,
        data: coordinationData,
      });
    } catch (error) {
      console.error('Error getting vendor coordination data:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'COORDINATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get coordination data',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

export default router;