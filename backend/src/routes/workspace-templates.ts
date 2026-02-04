import { Router } from 'express';
import { workspaceTemplateService } from '../services/workspace-template.service';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * Create template from workspace
 * POST /api/workspace-templates/from-workspace/:workspaceId
 */
router.post('/from-workspace/:workspaceId', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;
    const templateData = req.body;

    const template = await workspaceTemplateService.createTemplateFromWorkspace(
      workspaceId,
      userId,
      templateData
    );

    res.status(201).json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Error creating template from workspace:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create template',
    });
  }
});

/**
 * Get template recommendations for event
 * GET /api/workspace-templates/recommendations/:eventId
 */
router.get('/recommendations/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const recommendations = await workspaceTemplateService.getTemplateRecommendations(
      eventId,
      userId
    );

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error('Error getting template recommendations:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get recommendations',
    });
  }
});

/**
 * Apply template to workspace
 * POST /api/workspace-templates/:templateId/apply/:workspaceId
 */
router.post('/:templateId/apply/:workspaceId', async (req, res) => {
  try {
    const { templateId, workspaceId } = req.params;
    const userId = req.user.id;
    const customizations = req.body.customizations;

    await workspaceTemplateService.applyTemplateToWorkspace(
      workspaceId,
      templateId,
      userId,
      customizations
    );

    res.json({
      success: true,
      message: 'Template applied successfully',
    });
  } catch (error) {
    console.error('Error applying template to workspace:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to apply template',
    });
  }
});

/**
 * Get template effectiveness metrics
 * GET /api/workspace-templates/:templateId/effectiveness
 */
router.get('/:templateId/effectiveness', async (req, res) => {
  try {
    const { templateId } = req.params;

    const metrics = await workspaceTemplateService.trackTemplateEffectiveness(templateId);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Error getting template effectiveness:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get effectiveness metrics',
    });
  }
});

/**
 * Share template with organization
 * POST /api/workspace-templates/:templateId/share/:organizationId
 */
router.post('/:templateId/share/:organizationId', async (req, res) => {
  try {
    const { templateId, organizationId } = req.params;
    const userId = req.user.id;

    await workspaceTemplateService.shareTemplateWithOrganization(
      templateId,
      organizationId,
      userId
    );

    res.json({
      success: true,
      message: 'Template shared with organization successfully',
    });
  } catch (error) {
    console.error('Error sharing template with organization:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to share template',
    });
  }
});

/**
 * Get organization templates
 * GET /api/workspace-templates/organization/:organizationId
 */
router.get('/organization/:organizationId', async (req, res) => {
  try {
    const { organizationId } = req.params;
    const userId = req.user.id;

    const templates = await workspaceTemplateService.getOrganizationTemplates(
      organizationId,
      userId
    );

    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Error getting organization templates:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get organization templates',
    });
  }
});

/**
 * Get all available templates for user
 * GET /api/workspace-templates
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { organizationId } = req.query;

    const templates = await workspaceTemplateService.getAllAvailableTemplates(
      userId,
      organizationId as string
    );

    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Error getting available templates:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get templates',
    });
  }
});

/**
 * Rate template based on usage experience
 * POST /api/workspace-templates/:templateId/rate
 */
router.post('/:templateId/rate', async (req, res) => {
  try {
    const { templateId } = req.params;
    const userId = req.user.id;
    const ratingData = req.body;

    await workspaceTemplateService.rateTemplate(templateId, userId, ratingData);

    res.json({
      success: true,
      message: 'Template rating submitted successfully',
    });
  } catch (error) {
    console.error('Error rating template:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit rating',
    });
  }
});

/**
 * Get template by ID
 * GET /api/workspace-templates/:templateId
 */
router.get('/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;

    const template = await workspaceTemplateService.getTemplateById(templateId);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
      });
    }

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Error getting template:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get template',
    });
  }
});

export default router;