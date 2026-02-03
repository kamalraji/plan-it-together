import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type PipelineStage = 'draft' | 'review' | 'approved' | 'scheduled' | 'published';

export interface PipelineItem {
  id: string;
  workspace_id: string;
  title: string;
  type: 'article' | 'presentation' | 'video' | 'document';
  status: PipelineStage;
  author_id: string | null;
  author_name: string | null;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high';
  description: string | null;
  content_url: string | null;
  created_at: string;
  updated_at: string;
}

export function usePublicationPipeline(workspaceId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['publication-pipeline', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_content_items')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as PipelineItem[];
    },
    enabled: !!workspaceId,
  });

  // Real-time subscription for live updates
  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase
      .channel(`pipeline-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_content_items',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          // Invalidate and refetch on any change
          queryClient.invalidateQueries({ queryKey: ['publication-pipeline', workspaceId] });
          // Also invalidate content-items to keep ContentPipelineDragDrop in sync
          queryClient.invalidateQueries({ queryKey: ['content-items', workspaceId] });
          
          // Show toast for external changes
          if (payload.eventType === 'UPDATE') {
            const newData = payload.new as PipelineItem;
            toast.info(`"${newData.title}" moved to ${newData.status}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient]);

  return query;
}

export function useUpdatePipelineStage(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, stage }: { itemId: string; stage: PipelineStage }) => {
      const { error } = await supabase
        .from('workspace_content_items')
        .update({ 
          status: stage, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', itemId);

      if (error) throw error;
    },
    onMutate: async ({ itemId, stage }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['publication-pipeline', workspaceId] });
      
      // Snapshot previous value
      const previousItems = queryClient.getQueryData<PipelineItem[]>(['publication-pipeline', workspaceId]);
      
      // Optimistically update
      queryClient.setQueryData<PipelineItem[]>(['publication-pipeline', workspaceId], (old) => 
        old?.map(item => 
          item.id === itemId 
            ? { ...item, status: stage, updated_at: new Date().toISOString() } 
            : item
        ) ?? []
      );
      
      return { previousItems };
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousItems) {
        queryClient.setQueryData(['publication-pipeline', workspaceId], context.previousItems);
      }
      toast.error('Failed to update stage: ' + error.message);
    },
    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['publication-pipeline', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['content-items', workspaceId] });
    },
  });
}

export function usePipelineStats(workspaceId: string) {
  const { data: items = [] } = usePublicationPipeline(workspaceId);

  return {
    total: items.length,
    draft: items.filter(i => i.status === 'draft').length,
    review: items.filter(i => i.status === 'review').length,
    approved: items.filter(i => i.status === 'approved').length,
    scheduled: items.filter(i => i.status === 'scheduled').length,
    published: items.filter(i => i.status === 'published').length,
  };
}
