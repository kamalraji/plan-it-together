import { Router, Request, Response } from 'express';
import { taskService } from '../services/task.service';
import { authenticate } from '../middleware/auth.middleware';
import { 
  requireWorkspaceAccess, 
  requireWorkspacePermission 
} from '../middleware/workspace-access.middleware';
import { auditTaskAction } from '../middleware/audit-logging.middleware';
import { TaskStatus, TaskPriority, TaskCategory } from '@prisma/client';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * POST /api/task/:workspaceId
 * Create a new task
 */
router.post('/:workspaceId', requireWorkspaceAccess, requireWorkspacePermission('task:create'), auditTaskAction('create_task'), async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const taskData = req.body;
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
    if (!taskData.title || !taskData.description || !taskData.category) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Title, description, and category are required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Validate category
    if (!Object.values(TaskCategory).includes(taskData.category)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CATEGORY',
          message: 'Invalid task category',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Validate priority if provided
    if (taskData.priority && !Object.values(TaskPriority).includes(taskData.priority)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PRIORITY',
          message: 'Invalid task priority',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const task = await taskService.createTask(workspaceId, userId, taskData);
    
    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_TASK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create task',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/task/:taskId
 * Get task by ID
 */
router.get('/:taskId', auditTaskAction('view_task'), async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
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

    const task = await taskService.getTask(taskId, userId);
    
    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Error getting task:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_TASK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get task',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/task/workspace/:workspaceId
 * Get tasks for workspace
 */
router.get('/workspace/:workspaceId', requireWorkspaceAccess, auditTaskAction('list_tasks'), async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user?.userId;
    const { status, assigneeId, category, priority } = req.query;

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

    // Build filters
    const filters: any = {};
    if (status && Object.values(TaskStatus).includes(status as TaskStatus)) {
      filters.status = status as TaskStatus;
    }
    if (assigneeId) {
      filters.assigneeId = assigneeId as string;
    }
    if (category && Object.values(TaskCategory).includes(category as TaskCategory)) {
      filters.category = category as TaskCategory;
    }
    if (priority && Object.values(TaskPriority).includes(priority as TaskPriority)) {
      filters.priority = priority as TaskPriority;
    }

    const tasks = await taskService.getWorkspaceTasks(workspaceId, userId, filters);
    
    res.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error('Error getting workspace tasks:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_TASKS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get workspace tasks',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * PUT /api/task/:taskId
 * Update task
 */
router.put('/:taskId', requireWorkspacePermission('task:update'), auditTaskAction('update_task'), async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;
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

    // Validate status if provided
    if (updates.status && !Object.values(TaskStatus).includes(updates.status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Invalid task status',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Validate priority if provided
    if (updates.priority && !Object.values(TaskPriority).includes(updates.priority)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PRIORITY',
          message: 'Invalid task priority',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Validate category if provided
    if (updates.category && !Object.values(TaskCategory).includes(updates.category)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CATEGORY',
          message: 'Invalid task category',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const task = await taskService.updateTask(taskId, userId, updates);
    
    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_TASK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update task',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/task/:taskId/assign
 * Assign task to team member
 */
router.post('/:taskId/assign', requireWorkspacePermission('task:assign'), auditTaskAction('assign_task'), async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const assignment = req.body;
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

    if (!assignment.assigneeId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_ASSIGNEE',
          message: 'Assignee ID is required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const task = await taskService.assignTask(taskId, userId, assignment);
    
    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Error assigning task:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ASSIGN_TASK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to assign task',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/task/:taskId/progress
 * Update task progress
 */
router.post('/:taskId/progress', requireWorkspacePermission('task:update'), auditTaskAction('update_progress'), async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const progressUpdate = req.body;
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
    if (progressUpdate.status === undefined || progressUpdate.progress === undefined) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PROGRESS_DATA',
          message: 'Status and progress are required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Validate status
    if (!Object.values(TaskStatus).includes(progressUpdate.status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Invalid task status',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Validate progress
    if (typeof progressUpdate.progress !== 'number' || progressUpdate.progress < 0 || progressUpdate.progress > 100) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PROGRESS',
          message: 'Progress must be a number between 0 and 100',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const task = await taskService.updateTaskProgress(taskId, userId, progressUpdate);
    
    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Error updating task progress:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_PROGRESS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update task progress',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * DELETE /api/task/:taskId
 * Delete task
 */
router.delete('/:taskId', requireWorkspacePermission('task:delete'), auditTaskAction('delete_task'), async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
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

    await taskService.deleteTask(taskId, userId);
    
    res.json({
      success: true,
      data: {
        message: 'Task deleted successfully',
        taskId,
      },
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_TASK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete task',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/task/:taskId/dependencies
 * Get task dependencies
 */
router.get('/:taskId/dependencies', auditTaskAction('view_dependencies'), async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
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

    const dependencies = await taskService.getTaskDependencies(taskId, userId);
    
    res.json({
      success: true,
      data: dependencies,
    });
  } catch (error) {
    console.error('Error getting task dependencies:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_DEPENDENCIES_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get task dependencies',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/task/:taskId/dependencies
 * Add task dependency
 */
router.post('/:taskId/dependencies', requireWorkspacePermission('task:update'), auditTaskAction('add_dependency'), async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { dependencyTaskId } = req.body;
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

    if (!dependencyTaskId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_DEPENDENCY_TASK_ID',
          message: 'Dependency task ID is required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const result = await taskService.addTaskDependency(taskId, dependencyTaskId, userId);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error adding task dependency:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ADD_DEPENDENCY_ERROR',
        message: error instanceof Error ? error.message : 'Failed to add task dependency',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * DELETE /api/task/:taskId/dependencies/:dependencyTaskId
 * Remove task dependency
 */
router.delete('/:taskId/dependencies/:dependencyTaskId', requireWorkspacePermission('task:update'), auditTaskAction('remove_dependency'), async (req: Request, res: Response) => {
  try {
    const { taskId, dependencyTaskId } = req.params;
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

    await taskService.removeTaskDependency(taskId, dependencyTaskId, userId);
    
    res.json({
      success: true,
      data: {
        message: 'Task dependency removed successfully',
        taskId,
        dependencyTaskId,
      },
    });
  } catch (error) {
    console.error('Error removing task dependency:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REMOVE_DEPENDENCY_ERROR',
        message: error instanceof Error ? error.message : 'Failed to remove task dependency',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/task/:taskId/comments
 * Get task comments
 */
router.get('/:taskId/comments', auditTaskAction('view_comments'), async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { limit = '50', offset = '0' } = req.query;
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

    const comments = await taskService.getTaskComments(taskId, userId, {
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    });
    
    res.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    console.error('Error getting task comments:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_COMMENTS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get task comments',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/task/:taskId/comments
 * Add task comment
 */
router.post('/:taskId/comments', requireWorkspacePermission('task:update'), auditTaskAction('add_comment'), async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
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

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMPTY_COMMENT',
          message: 'Comment content is required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const comment = await taskService.addTaskComment(taskId, userId, { content });
    
    res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    console.error('Error adding task comment:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ADD_COMMENT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to add task comment',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/task/:taskId/history
 * Get task activity history
 */
router.get('/:taskId/history', auditTaskAction('view_history'), async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { limit = '50', offset = '0' } = req.query;
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

    const history = await taskService.getTaskHistory(taskId, userId, {
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    });
    
    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Error getting task history:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_HISTORY_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get task history',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/task/workspace/:workspaceId/templates
 * Get task templates for workspace
 */
router.get('/workspace/:workspaceId/templates', requireWorkspaceAccess, auditTaskAction('list_templates'), async (req: Request, res: Response) => {
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

    const templates = await taskService.getTaskTemplates(workspaceId, userId);
    
    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Error getting task templates:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_TEMPLATES_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get task templates',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/task/:taskId/template
 * Create template from task
 */
router.post('/:taskId/template', requireWorkspacePermission('template:create'), auditTaskAction('create_template'), async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { name, description } = req.body;
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

    if (!name) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TEMPLATE_NAME',
          message: 'Template name is required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const template = await taskService.createTaskTemplate(taskId, userId, { name, description });
    
    res.status(201).json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Error creating task template:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_TEMPLATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create task template',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;