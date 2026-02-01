import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface PageSection {
  id: string;
  sectionId: string;
  ownedByWorkspaceId: string | null;
  ownedByWorkspaceName: string | null;
  lockedByUserId: string | null;
  lockedAt: string | null;
  htmlContent: string | null;
  cssContent: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch all sections for an event's page
 */
export function usePageBuilderSections(eventId?: string) {
  return useQuery({
    queryKey: ['page-builder-sections', eventId],
    queryFn: async () => {
      if (!eventId) return [];

      const { data, error } = await supabase
        .from('page_builder_sections')
        .select(`
          id,
          section_id,
          owned_by_workspace_id,
          locked_by_user_id,
          locked_at,
          html_content,
          css_content,
          created_at,
          updated_at,
          workspaces:owned_by_workspace_id (name)
        `)
        .eq('event_id', eventId);

      if (error) throw error;

      return (data || []).map((item): PageSection => ({
        id: item.id,
        sectionId: item.section_id,
        ownedByWorkspaceId: item.owned_by_workspace_id,
        ownedByWorkspaceName: (item.workspaces as any)?.name || null,
        lockedByUserId: item.locked_by_user_id,
        lockedAt: item.locked_at,
        htmlContent: item.html_content,
        cssContent: item.css_content,
        createdAt: item.created_at || new Date().toISOString(),
        updatedAt: item.updated_at || new Date().toISOString(),
      }));
    },
    enabled: !!eventId,
  });
}

/**
 * Lock a section for editing
 */
export function useLockSection() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const lockMutation = useMutation({
    mutationFn: async ({ eventId, sectionId }: { eventId: string; sectionId: string }) => {
      // First check if section exists
      const { data: existing } = await supabase
        .from('page_builder_sections')
        .select('id, locked_by_user_id')
        .eq('event_id', eventId)
        .eq('section_id', sectionId)
        .maybeSingle();

      if (existing?.locked_by_user_id && existing.locked_by_user_id !== user?.id) {
        throw new Error('Section is locked by another user');
      }

      if (existing) {
        // Update existing section
        const { error } = await supabase
          .from('page_builder_sections')
          .update({
            locked_by_user_id: user?.id,
            locked_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new section entry
        const { error } = await supabase
          .from('page_builder_sections')
          .insert({
            event_id: eventId,
            section_id: sectionId,
            locked_by_user_id: user?.id,
            locked_at: new Date().toISOString(),
          });

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['page-builder-sections', variables.eventId] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to lock section');
    },
  });

  const unlockMutation = useMutation({
    mutationFn: async ({ eventId, sectionId }: { eventId: string; sectionId: string }) => {
      const { error } = await supabase
        .from('page_builder_sections')
        .update({
          locked_by_user_id: null,
          locked_at: null,
        })
        .eq('event_id', eventId)
        .eq('section_id', sectionId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['page-builder-sections', variables.eventId] });
    },
    onError: (_error) => {
      toast.error('Failed to unlock section');
    },
  });

  return {
    lockSection: lockMutation.mutate,
    unlockSection: unlockMutation.mutate,
    isLocking: lockMutation.isPending,
    isUnlocking: unlockMutation.isPending,
  };
}

/**
 * Save section content
 */
export function useSaveSectionContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      sectionId,
      htmlContent,
      cssContent,
      workspaceId,
    }: {
      eventId: string;
      sectionId: string;
      htmlContent: string;
      cssContent?: string;
      workspaceId?: string;
    }) => {
      const { data: existing } = await supabase
        .from('page_builder_sections')
        .select('id')
        .eq('event_id', eventId)
        .eq('section_id', sectionId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('page_builder_sections')
          .update({
            html_content: htmlContent,
            css_content: cssContent || null,
            owned_by_workspace_id: workspaceId || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('page_builder_sections')
          .insert({
            event_id: eventId,
            section_id: sectionId,
            html_content: htmlContent,
            css_content: cssContent || null,
            owned_by_workspace_id: workspaceId || null,
          });

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['page-builder-sections', variables.eventId] });
    },
    onError: (_error) => {
      toast.error('Failed to save section');
    },
  });
}
