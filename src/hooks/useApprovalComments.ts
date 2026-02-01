import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface ApprovalComment {
  id: string;
  requestType: 'budget' | 'resource' | 'access';
  requestId: string;
  userId: string;
  userName: string | null;
  avatarUrl: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export function useApprovalComments(
  requestType: 'budget' | 'resource' | 'access',
  requestId: string
) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const commentsQuery = useQuery({
    queryKey: ['approval-comments', requestType, requestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('approval_request_comments')
        .select('id, request_type, request_id, user_id, content, created_at, updated_at')
        .eq('request_type', requestType)
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch user profiles
      const userIds = [...new Set(data.map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.id, { name: p.full_name, avatar: p.avatar_url }])
      );

      return data.map((c) => ({
        id: c.id,
        requestType: c.request_type as 'budget' | 'resource' | 'access',
        requestId: c.request_id,
        userId: c.user_id,
        userName: profileMap.get(c.user_id)?.name || null,
        avatarUrl: profileMap.get(c.user_id)?.avatar || null,
        content: c.content,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      }));
    },
    enabled: !!requestId,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id) throw new Error('Must be authenticated');

      const { error } = await supabase.from('approval_request_comments').insert({
        request_type: requestType,
        request_id: requestId,
        user_id: user.id,
        content,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['approval-comments', requestType, requestId],
      });
    },
    onError: (error) => {
      toast.error('Failed to add comment: ' + (error as Error).message);
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('approval_request_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['approval-comments', requestType, requestId],
      });
      toast.success('Comment deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete comment: ' + (error as Error).message);
    },
  });

  return {
    comments: commentsQuery.data || [],
    isLoading: commentsQuery.isLoading,
    addComment: addCommentMutation.mutate,
    isAddingComment: addCommentMutation.isPending,
    deleteComment: deleteCommentMutation.mutate,
    isDeletingComment: deleteCommentMutation.isPending,
  };
}
