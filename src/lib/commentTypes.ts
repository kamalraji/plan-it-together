export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  parent_id?: string | null;
  mentions: string[];
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  // Joined data
  user?: { id: string; full_name: string; email: string; avatar_url?: string };
  reactions?: CommentReaction[];
  replies?: TaskComment[];
  reactionCounts?: Record<string, number>;
}

export interface CommentReaction {
  id: string;
  comment_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  user?: { id: string; full_name: string };
}

export interface TaskActivity {
  id: string;
  task_id: string;
  user_id: string;
  activity_type: ActivityType;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
  user?: { id: string; full_name: string; avatar_url?: string };
}

export type ActivityType = 
  | 'created'
  | 'status_changed'
  | 'priority_changed'
  | 'assigned'
  | 'unassigned'
  | 'due_date_changed'
  | 'progress_updated'
  | 'comment_added'
  | 'file_uploaded'
  | 'dependency_added'
  | 'dependency_removed'
  | 'title_changed'
  | 'description_changed';

// Common emoji reactions
export const REACTION_EMOJIS = ['👍', '👎', '❤️', '🎉', '😄', '😕', '🔥', '👀'] as const;

export type ReactionEmoji = typeof REACTION_EMOJIS[number];

export const ACTIVITY_TYPE_CONFIG: Record<ActivityType, { icon: string; color: string; label: string }> = {
  created: { icon: 'Plus', color: 'text-success', label: 'Created task' },
  status_changed: { icon: 'RefreshCw', color: 'text-info', label: 'Changed status' },
  priority_changed: { icon: 'Flag', color: 'text-orange-500', label: 'Changed priority' },
  assigned: { icon: 'UserPlus', color: 'text-primary', label: 'Assigned' },
  unassigned: { icon: 'UserMinus', color: 'text-muted-foreground', label: 'Unassigned' },
  due_date_changed: { icon: 'Calendar', color: 'text-primary', label: 'Changed due date' },
  progress_updated: { icon: 'TrendingUp', color: 'text-cyan-500', label: 'Updated progress' },
  comment_added: { icon: 'MessageSquare', color: 'text-blue-400', label: 'Added comment' },
  file_uploaded: { icon: 'Upload', color: 'text-teal-500', label: 'Uploaded file' },
  dependency_added: { icon: 'Link', color: 'text-warning', label: 'Added dependency' },
  dependency_removed: { icon: 'Unlink', color: 'text-red-400', label: 'Removed dependency' },
  title_changed: { icon: 'Edit', color: 'text-warning', label: 'Changed title' },
  description_changed: { icon: 'FileText', color: 'text-muted-foreground', label: 'Changed description' },
};
