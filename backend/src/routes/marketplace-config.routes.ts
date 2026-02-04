import { Router } from 'express';
import { marketplaceConfigService } from '../services/marketplace-config.service';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { ApiResponse } from '../types';

const router = Router();

/**
 * Get marketplace configuration
 * GET /api/marketplace/config
 */
router.get('/config', authenticate, authorize(['SUPER_ADMIN']), async (req, res) => {
  try {
    const config = await marketplaceConfigService.getConfig();

    res.json({
      success: true,
      data: config,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Get marketplace config error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve marketplace configuration',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

/**
 * Update marketplace configuration
 * PUT /api/marketplace/config
 */
router.put('/config', authenticate, authorize(['SUPER_ADMIN']), async (req, res) => {
  try {
    const updates = req.body;

    const updatedConfig = await marketplaceConfigService.updateConfig(updates);

    res.json({
      success: true,
      data: updatedConfig,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Update marketplace config error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Failed to update marketplace configuration',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

/**
 * Get commission rate for a category and amount
 * GET /api/marketplace/config/commission?category=VENUE&amount=5000
 */
router.get('/config/commission', authenticate, async (req, res) => {
  try {
    const { category, amount } = req.query;

    if (!category || !amount) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Missing required query parameters: category, amount',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    const feeCalculation = await marketplaceConfigService.calculatePlatformFee(
      category as string,
      parseFloat(amount as string)
    );

    res.json({
      success: true,
      data: feeCalculation,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Get commission rate error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to calculate commission rate',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

/**
 * Get verification requirements for a category
 * GET /api/marketplace/config/verification/:category
 */
router.get('/config/verification/:category', authenticate, async (req, res) => {
  try {
    const { category } = req.params;

    const requirements = await marketplaceConfigService.getVerificationRequirements(category);

    res.json({
      success: true,
      data: requirements,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Get verification requirements error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve verification requirements',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

/**
 * Check vendor verification compliance
 * GET /api/marketplace/config/verification/:vendorId/:category/check
 */
router.get('/config/verification/:vendorId/:category/check', authenticate, async (req, res) => {
  try {
    const { vendorId, category } = req.params;

    const compliance = await marketplaceConfigService.checkVerificationCompliance(vendorId, category);

    res.json({
      success: true,
      data: compliance,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Check verification compliance error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Failed to check verification compliance',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

/**
 * Validate payment configuration
 * GET /api/marketplace/config/validate
 */
router.get('/config/validate', authenticate, authorize(['SUPER_ADMIN']), async (req, res) => {
  try {
    const validation = await marketplaceConfigService.validatePaymentConfig();

    res.json({
      success: true,
      data: validation,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Validate payment config error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to validate payment configuration',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

export default router;