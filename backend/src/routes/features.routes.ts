import { Router } from 'express';
import { getEnabledFeatures } from '../config/features';

const router = Router();

/**
 * Get enabled features
 * GET /api/features
 */
router.get('/', (req, res) => {
  try {
    const enabledFeatures = getEnabledFeatures();
    
    res.json({
      success: true,
      data: {
        features: enabledFeatures,
        message: 'Features marked as false are planned for future implementation'
      }
    });
  } catch (error) {
    console.error('Error fetching features:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feature configuration'
    });
  }
});

export default router;