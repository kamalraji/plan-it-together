import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TaskComment, CommentReaction } from '@/lib/commentTypes';
import { logCommentAdded } from '@/lib/activityLogger';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { queryKeys, queryPresets } from '@/lib/query-config';

interface UseTaskCommentsOptions {
  taskId: string;
  enabled?: boolean;
}

export function useTaskComments({ taskId, enabled = true }: UseTaskCommentsOptions) {
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading, refetch } = useQuery({
    queryKey: queryKeys.tasks.comments(taskId),
    queryFn: async () => {
      // Use explicit column list for performance, cast for type safety
      const { data: commentsData, error: commentsError } = await supabase
        .from('task_comments')
        .select('id, task_id, user_id, content, parent_id, mentions, is_edited, created_at, updated_at, deleted_at')
        .eq('task_id', taskId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      const userIds = [...new Set(commentsData.map(c => c.user_id))];
      const { data: users } = await supabase.from('user_profiles').select('id, full_name, email, avatar_url').in('id', userIds);
      const userMap = new Map(users?.map(u => [u.id, u]) || []);

      const commentIds = commentsData.map(c => c.id);
      const { data: reactions } = await supabase.from('task_comment_reactions').select('id, comment_id, user_id, emoji, created_at').in('comment_id', commentIds);

      const reactionsByComment = new Map<string, CommentReaction[]>();
      reactions?.forEach(r => {
        const existing = reactionsByComment.get(r.comment_id) || [];
        existing.push(r);
        reactionsByComment.set(r.comment_id, existing);
      });

      const commentMap = new Map<string, TaskComment>();
      const rootComments: TaskComment[] = [];

      commentsData.forEach(c => {
        const commentReactions = reactionsByComment.get(c.id) || [];
        const reactionCounts: Record<string, number> = {};
        commentReactions.forEach(r => { reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1; });

        const userData = userMap.get(c.user_id);
        const comment: TaskComment = {
          id: c.id,
          task_id: c.task_id,
          user_id: c.user_id,
          content: c.content,
          parent_id: c.parent_id,
          mentions: c.mentions || [],
          is_edited: c.is_edited || false,
          created_at: c.created_at,
          updated_at: c.updated_at,
          deleted_at: c.deleted_at,
          user: userData ? { id: userData.id, full_name: userData.full_name || 'Unknown', email: userData.email || '', avatar_url: userData.avatar_url || undefined } : undefined,
          reactions: commentReactions,
          reactionCounts,
          replies: [],
        };
        commentMap.set(c.id, comment);
      });

      commentMap.forEach(comment => {
        if (comment.parent_id) {
          const parent = commentMap.get(comment.parent_id);
          if (parent) { parent.replies = parent.replies || []; parent.replies.push(comment); }
        } else { rootComments.push(comment); }
      });

      return rootComments;
    },
    enabled: enabled && !!taskId,
    ...queryPresets.dynamic,
  });

  useEffect(() => {
    if (!taskId || !enabled) return;
    const channel = supabase.channel(`task-comments-${taskId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_comments', filter: `task_id=eq.${taskId}` }, () => refetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_comment_reactions' }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [taskId, enabled, refetch]);

  const addCommentMutation = useMutation({
    mutationFn: async ({ content, mentions = [], parentId }: { content: string; mentions?: string[]; parentId?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase.from('task_comments').insert([{ task_id: taskId, user_id: user.id, content, mentions, parent_id: parentId || null }]).select().single();
      if (error) throw error;
      await logCommentAdded(taskId, user.id);
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.tasks.comments(taskId) }); queryClient.invalidateQueries({ queryKey: queryKeys.tasks.activities(taskId) }); },
    onError: () => { toast.error('Failed to add comment'); },
  });

  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const { data, error } = await supabase.from('task_comments').update({ content, is_edited: true, updated_at: new Date().toISOString() }).eq('id', commentId).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.tasks.comments(taskId) }); },
    onError: () => { toast.error('Failed to update comment'); },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from('task_comments').update({ deleted_at: new Date().toISOString() }).eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.tasks.comments(taskId) }); toast.success('Comment deleted'); },
    onError: () => { toast.error('Failed to delete comment'); },
  });

  const toggleReactionMutation = useMutation({
    mutationFn: async ({ commentId, emoji }: { commentId: string; emoji: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data: existing } = await supabase.from('task_comment_reactions').select('id').eq('comment_id', commentId).eq('user_id', user.id).eq('emoji', emoji).maybeSingle();
      if (existing) { await supabase.from('task_comment_reactions').delete().eq('id', existing.id); return { action: 'removed' }; }
      await supabase.from('task_comment_reactions').insert([{ comment_id: commentId, user_id: user.id, emoji }]);
      return { action: 'added' };
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.tasks.comments(taskId) }); },
  });

  return {
    comments, isLoading, refetch,
    addComment: addCommentMutation.mutate, isAddingComment: addCommentMutation.isPending,
    updateComment: updateCommentMutation.mutate, isUpdatingComment: updateCommentMutation.isPending,
    deleteComment: deleteCommentMutation.mutate, isDeletingComment: deleteCommentMutation.isPending,
    toggleReaction: toggleReactionMutation.mutate, isTogglingReaction: toggleReactionMutation.isPending,
  };
}
