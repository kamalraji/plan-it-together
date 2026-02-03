import { Router, Request, Response } from 'express';
import { workspaceCommunicationService } from '../services/workspace-communication.service';
import { authenticate } from '../middleware/auth.middleware';
import { ChannelType } from '@prisma/client';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * POST /api/workspace-communication/:workspaceId/channels
 * Create a new communication channel
 */
router.post('/:workspaceId/channels', async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const channelData = req.body;
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

    // Validate required fields
    if (!channelData.name || !channelData.type) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Channel name and type are required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Validate channel type
    if (!Object.values(ChannelType).includes(channelData.type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CHANNEL_TYPE',
          message: 'Invalid channel type',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const channel = await workspaceCommunicationService.createChannel(workspaceId, userId, channelData);
    
    res.status(201).json({
      success: true,
      data: channel,
    });
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_CHANNEL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create channel',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/workspace-communication/:workspaceId/channels
 * Get channels for workspace
 */
router.get('/:workspaceId/channels', async (req: Request, res: Response) => {
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

    const channels = await workspaceCommunicationService.getWorkspaceChannels(workspaceId, userId);
    
    res.json({
      success: true,
      data: channels,
    });
  } catch (error) {
    console.error('Error getting workspace channels:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_CHANNELS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get workspace channels',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/workspace-communication/channels/:channelId
 * Get channel by ID
 */
router.get('/channels/:channelId', async (req: Request, res: Response) => {
  try {
    const { channelId } = req.params;
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

    const channel = await workspaceCommunicationService.getChannel(channelId, userId);
    
    res.json({
      success: true,
      data: channel,
    });
  } catch (error) {
    console.error('Error getting channel:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_CHANNEL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get channel',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/workspace-communication/channels/:channelId/messages
 * Send message to channel
 */
router.post('/channels/:channelId/messages', async (req: Request, res: Response) => {
  try {
    const { channelId } = req.params;
    const messageData = req.body;
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

    // Validate message content
    if (!messageData.content || messageData.content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMPTY_MESSAGE',
          message: 'Message content is required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const message = await workspaceCommunicationService.sendMessage(channelId, userId, messageData);
    
    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SEND_MESSAGE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to send message',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/workspace-communication/channels/:channelId/messages
 * Get message history for channel
 */
router.get('/channels/:channelId/messages', async (req: Request, res: Response) => {
  try {
    const { channelId } = req.params;
    const { limit, before } = req.query;
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

    const messageLimit = limit ? parseInt(limit as string, 10) : 50;
    const beforeDate = before ? new Date(before as string) : undefined;

    const messageHistory = await workspaceCommunicationService.getChannelMessages(
      channelId,
      userId,
      messageLimit,
      beforeDate
    );
    
    res.json({
      success: true,
      data: messageHistory,
    });
  } catch (error) {
    console.error('Error getting channel messages:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_MESSAGES_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get channel messages',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/workspace-communication/:workspaceId/broadcast
 * Send broadcast message to workspace
 */
router.post('/:workspaceId/broadcast', async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const broadcastData = req.body;
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

    // Validate broadcast data
    if (!broadcastData.content || !broadcastData.targetType) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_BROADCAST_DATA',
          message: 'Content and target type are required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Validate target type
    const validTargetTypes = ['ALL_MEMBERS', 'ROLE_SPECIFIC'];
    if (!validTargetTypes.includes(broadcastData.targetType)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TARGET_TYPE',
          message: 'Invalid broadcast target type',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Validate target roles if role-specific
    if (broadcastData.targetType === 'ROLE_SPECIFIC' && (!broadcastData.targetRoles || broadcastData.targetRoles.length === 0)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TARGET_ROLES',
          message: 'Target roles are required for role-specific broadcasts',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const messages = await workspaceCommunicationService.sendBroadcastMessage(workspaceId, userId, broadcastData);
    
    res.status(201).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error('Error sending broadcast message:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'BROADCAST_ERROR',
        message: error instanceof Error ? error.message : 'Failed to send broadcast message',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/workspace-communication/channels/:channelId/members
 * Add member to private channel
 */
router.post('/channels/:channelId/members', async (req: Request, res: Response) => {
  try {
    const { channelId } = req.params;
    const { memberId } = req.body;
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

    if (!memberId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_MEMBER_ID',
          message: 'Member ID is required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    await workspaceCommunicationService.addChannelMember(channelId, userId, memberId, userId);
    
    res.json({
      success: true,
      data: {
        message: 'Member added to channel successfully',
        channelId,
        memberId,
      },
    });
  } catch (error) {
    console.error('Error adding channel member:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ADD_MEMBER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to add member to channel',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * DELETE /api/workspace-communication/channels/:channelId/members/:memberId
 * Remove member from private channel
 */
router.delete('/channels/:channelId/members/:memberId', async (req: Request, res: Response) => {
  try {
    const { channelId, memberId } = req.params;
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

    await workspaceCommunicationService.removeChannelMember(channelId, memberId, userId);
    
    res.json({
      success: true,
      data: {
        message: 'Member removed from channel successfully',
        channelId,
        memberId,
      },
    });
  } catch (error) {
    console.error('Error removing channel member:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REMOVE_MEMBER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to remove member from channel',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/workspace-communication/:workspaceId/search
 * Search messages in workspace
 */
router.get('/:workspaceId/search', async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const { query, channelId } = req.query;
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

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_SEARCH_QUERY',
          message: 'Search query is required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const messages = await workspaceCommunicationService.searchMessages(
      workspaceId,
      userId,
      query,
      channelId as string | undefined
    );
    
    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SEARCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to search messages',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;