import { Router, Request, Response } from 'express';
import { teamService } from '../services/team.service';
import { authenticate } from '../middleware/auth.middleware';
import { WorkspaceRole } from '@prisma/client';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * POST /api/team/:workspaceId/invite
 * Invite a team member to workspace
 */
router.post('/:workspaceId/invite', async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user?.userId;
    const invitation = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User authentication required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Validate invitation data
    if (!invitation.email || !invitation.role) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INVITATION',
          message: 'Email and role are required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Validate role
    if (!Object.values(WorkspaceRole).includes(invitation.role)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ROLE',
          message: 'Invalid workspace role',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const result = await teamService.inviteTeamMember(workspaceId, userId, invitation);
    
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error inviting team member:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INVITATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to invite team member',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/team/:workspaceId/bulk-invite
 * Bulk invite team members to workspace
 */
router.post('/:workspaceId/bulk-invite', async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user?.userId;
    const bulkInvitation = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User authentication required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Validate bulk invitation data
    if (!bulkInvitation.invitations || !Array.isArray(bulkInvitation.invitations)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_BULK_INVITATION',
          message: 'Invitations array is required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const results = await teamService.bulkInviteTeamMembers(workspaceId, userId, bulkInvitation);
    
    res.status(201).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error bulk inviting team members:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'BULK_INVITATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to bulk invite team members',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/team/accept-invitation
 * Accept team invitation
 */
router.post('/accept-invitation', async (req: Request, res: Response) => {
  try {
    const { invitationToken } = req.body;
    const userId = req.user?.userId;

    if (!invitationToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Invitation token is required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const result = await teamService.acceptInvitation(invitationToken, userId);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INVITATION_ACCEPTANCE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to accept invitation',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/team/:workspaceId/members
 * Get team members for workspace
 */
router.get('/:workspaceId/members', async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User authentication required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const members = await teamService.getTeamMembers(workspaceId, userId);
    
    res.json({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error('Error getting team members:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_MEMBERS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get team members',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * PUT /api/team/:workspaceId/members/:teamMemberId/role
 * Update team member role
 */
router.put('/:workspaceId/members/:teamMemberId/role', async (req: Request, res: Response) => {
  try {
    const { workspaceId, teamMemberId } = req.params;
    const { role } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User authentication required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (!role || !Object.values(WorkspaceRole).includes(role)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ROLE',
          message: 'Valid role is required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const result = await teamService.updateTeamMemberRole(workspaceId, teamMemberId, role, userId);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error updating team member role:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ROLE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update team member role',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * DELETE /api/team/:workspaceId/members/:teamMemberId
 * Remove team member from workspace
 */
router.delete('/:workspaceId/members/:teamMemberId', async (req: Request, res: Response) => {
  try {
    const { workspaceId, teamMemberId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User authentication required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    await teamService.removeTeamMember(workspaceId, teamMemberId, userId);
    
    res.json({
      success: true,
      data: {
        message: 'Team member removed successfully',
        teamMemberId,
      },
    });
  } catch (error) {
    console.error('Error removing team member:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REMOVE_MEMBER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to remove team member',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/team/:workspaceId/members/user/:userId
 * Get team member by user ID
 */
router.get('/:workspaceId/members/user/:userId', async (req: Request, res: Response) => {
  try {
    const { workspaceId, userId: targetUserId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User authentication required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const member = await teamService.getTeamMemberByUserId(workspaceId, targetUserId);
    
    if (!member) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MEMBER_NOT_FOUND',
          message: 'Team member not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.json({
      success: true,
      data: member,
    });
  } catch (error) {
    console.error('Error getting team member:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_MEMBER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get team member',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;