import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys, queryPresets } from '@/lib/query-config';

/**
 * Prefetch workspace data on hover/focus for instant navigation
 */
export function usePrefetchWorkspace() {
  const queryClient = useQueryClient();

  const prefetch = useCallback(
    (workspaceId: string) => {
      // Prefetch workspace details
      queryClient.prefetchQuery({
        queryKey: queryKeys.workspaces.detail(workspaceId),
        queryFn: async () => {
          const { data, error } = await supabase
            .from('workspaces')
            .select('id, name, status, created_at, updated_at, event_id, parent_workspace_id, workspace_type, department_id')
            .eq('id', workspaceId)
            .maybeSingle();
          if (error) throw error;
          return data;
        },
        ...queryPresets.standard,
      });

      // Prefetch workspace tasks
      queryClient.prefetchQuery({
        queryKey: queryKeys.workspaces.tasks(workspaceId),
        queryFn: async () => {
          const { data, error } = await supabase
            .from('workspace_tasks')
            .select('id, title, status, priority, due_date, assigned_to, role_scope')
            .eq('workspace_id', workspaceId)
            .order('created_at', { ascending: true });
          if (error) throw error;
          return data ?? [];
        },
        ...queryPresets.dynamic,
      });

      // Prefetch team members
      queryClient.prefetchQuery({
        queryKey: queryKeys.workspaces.team(workspaceId),
        queryFn: async () => {
          const { data, error } = await supabase
            .from('workspace_team_members')
            .select('id, user_id, role, status, joined_at')
            .eq('workspace_id', workspaceId)
            .order('joined_at', { ascending: true });
          if (error) throw error;
          return data ?? [];
        },
        ...queryPresets.standard,
      });
    },
    [queryClient]
  );

  return { prefetch };
}

/**
 * Prefetch organization data on hover/focus
 */
export function usePrefetchOrganization() {
  const queryClient = useQueryClient();

  const prefetch = useCallback(
    (organizationId: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.organizations.detail(organizationId),
        queryFn: async () => {
          const { data, error } = await supabase
            .from('organizations')
            .select('id, name, slug, description, logo_url, banner_url, category, city, country')
            .eq('id', organizationId)
            .maybeSingle();
          if (error) throw error;
          return data;
        },
        ...queryPresets.static,
      });
    },
    [queryClient]
  );

  const prefetchBySlug = useCallback(
    (slug: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.organizations.bySlug(slug),
        queryFn: async () => {
          const { data, error } = await supabase
            .from('organizations')
            .select('id, name, slug, description, logo_url, banner_url, category, city, country')
            .eq('slug', slug)
            .maybeSingle();
          if (error) throw error;
          return data;
        },
        ...queryPresets.static,
      });
    },
    [queryClient]
  );

  return { prefetch, prefetchBySlug };
}

/**
 * Prefetch event data on hover/focus
 */
export function usePrefetchEvent() {
  const queryClient = useQueryClient();

  const prefetch = useCallback(
    (eventId: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.events.detail(eventId),
        queryFn: async () => {
          const { data, error } = await supabase
            .from('events')
            .select('id, name, description, start_date, end_date, status, mode, visibility, capacity')
            .eq('id', eventId)
            .maybeSingle();
          if (error) throw error;
          return data;
        },
        ...queryPresets.standard,
      });
    },
    [queryClient]
  );

  const prefetchBySlug = useCallback(
    (slug: string) => {
      queryClient.prefetchQuery({
        queryKey: ['public-event-by-slug', slug],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('events')
            .select(`
              *,
              organizations:organization_id (
                id,
                name,
                slug,
                logo_url,
                verification_status
              )
            `)
            .eq('landing_page_slug', slug)
            .eq('visibility', 'PUBLIC')
            .maybeSingle();
          if (error) throw error;
          return data;
        },
        ...queryPresets.standard,
      });
    },
    [queryClient]
  );

  return { prefetch, prefetchBySlug };
}

/**
 * Prefetch user profile data
 */
export function usePrefetchProfile() {
  const queryClient = useQueryClient();

  const prefetch = useCallback(
    (userId: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.users.profile(userId),
        queryFn: async () => {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('id, full_name, avatar_url, bio, organization')
            .eq('id', userId)
            .maybeSingle();
          if (error) throw error;
          return data;
        },
        ...queryPresets.static,
      });
    },
    [queryClient]
  );

  return { prefetch };
}
