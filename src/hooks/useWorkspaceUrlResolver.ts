import { useMemo } from 'react';
import { useParams, useSearchParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  parseWorkspaceUrl, 
  getWorkspaceLevelFromUrl, 
  isLegacyWorkspaceUrl,
  isHierarchicalWorkspaceUrl,
  WorkspaceLevel,
  ParsedWorkspaceUrl,
  slugify,
} from '@/lib/workspaceNavigation';
import { WorkspaceTab } from './useWorkspaceShell';

interface ResolvedWorkspaceContext {
  // URL parsing
  parsed: ParsedWorkspaceUrl;
  isLegacyUrl: boolean;
  isHierarchicalUrl: boolean;
  currentLevel: WorkspaceLevel | null;
  
  // Resolved IDs (from query params or database lookup)
  eventId: string | undefined;
  workspaceId: string | undefined;
  
  // Resolved data
  event: { id: string; slug: string; name: string } | null;
  workspace: { 
    id: string; 
    slug: string; 
    name: string; 
    workspaceType: string;
    parentWorkspaceId: string | null;
  } | null;
  
  // Deep linking
  activeTab: WorkspaceTab;
  taskId: string | undefined;
  sectionId: string | undefined;
  roleSpace: string | undefined;
  
  // Loading state
  isLoading: boolean;
  isReady: boolean;
}

/**
 * Hook to parse and resolve workspace URLs (both legacy and hierarchical formats)
 * 
 * Handles:
 * - Parsing URL path segments and query parameters
 * - Resolving slugs to database IDs
 * - Detecting legacy vs new URL formats
 * - Extracting deep-linking parameters
 */
export function useWorkspaceUrlResolver(): ResolvedWorkspaceContext {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const routeParams = useParams<{ orgSlug?: string; eventSlug?: string; eventId?: string }>();

  // Parse URL
  const parsed = useMemo(
    () => parseWorkspaceUrl(location.pathname, location.search),
    [location.pathname, location.search]
  );

  const isLegacyUrl = isLegacyWorkspaceUrl(location.pathname);
  const isHierarchicalUrl = isHierarchicalWorkspaceUrl(location.pathname);
  const currentLevel = getWorkspaceLevelFromUrl(parsed);

  // Get eventId from query params (both formats use this)
  const eventIdFromParams = searchParams.get('eventId') || routeParams.eventId;
  const workspaceIdFromParams = searchParams.get('workspaceId');

  // Resolve event by slug (for hierarchical URLs)
  const { data: eventBySlug, isLoading: eventLoading } = useQuery({
    queryKey: ['resolve-event-slug', parsed.orgSlug, parsed.eventSlug],
    queryFn: async () => {
      if (!parsed.eventSlug || eventIdFromParams) return null;
      
      // First get org ID from slug
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', parsed.orgSlug)
        .single();
      
      if (!org) return null;

      const { data, error } = await supabase
        .from('events')
        .select('id, slug, name')
        .eq('organization_id', org.id)
        .eq('slug', parsed.eventSlug)
        .single();
      
      if (error) return null;
      return data;
    },
    enabled: !!parsed.eventSlug && !eventIdFromParams && isHierarchicalUrl,
  });

  // Resolve event by ID (for legacy URLs or when eventId is in params)
  const { data: eventById, isLoading: eventByIdLoading } = useQuery({
    queryKey: ['resolve-event-id', eventIdFromParams],
    queryFn: async () => {
      if (!eventIdFromParams) return null;
      const { data, error } = await supabase
        .from('events')
        .select('id, slug, name')
        .eq('id', eventIdFromParams)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!eventIdFromParams,
  });

  const resolvedEvent = eventById || eventBySlug;
  const resolvedEventId = eventIdFromParams || eventBySlug?.id;

  // Resolve workspace by slug path (for hierarchical URLs)
  const { data: workspaceBySlug, isLoading: workspaceLoading } = useQuery({
    queryKey: ['resolve-workspace-slug', resolvedEventId, parsed.rootSlug, parsed.departmentSlug, parsed.committeeSlug, parsed.teamSlug],
    queryFn: async () => {
      if (!resolvedEventId) return null;
      
      // Determine which slug to look for based on deepest level
      let targetSlug = parsed.teamSlug || parsed.committeeSlug || parsed.departmentSlug || parsed.rootSlug;
      if (!targetSlug) return null;

      // Get all workspaces for the event
      const { data: workspaces, error } = await supabase
        .from('workspaces')
        .select('id, slug, name, workspace_type, parent_workspace_id')
        .eq('event_id', resolvedEventId);
      
      if (error || !workspaces) return null;

      // Find workspace matching the slug path
      // For now, simple slug match (can be enhanced for full path verification)
      const workspace = workspaces.find(ws => {
        const wsSlug = ws.slug || slugify(ws.name);
        return wsSlug === targetSlug;
      });

      if (!workspace) return null;
      
      return {
        id: workspace.id,
        slug: workspace.slug || slugify(workspace.name),
        name: workspace.name,
        workspaceType: workspace.workspace_type || 'ROOT',
        parentWorkspaceId: workspace.parent_workspace_id,
      };
    },
    enabled: !!resolvedEventId && isHierarchicalUrl && !workspaceIdFromParams,
  });

  // Resolve workspace by ID (when workspaceId is in params)
  const { data: workspaceById, isLoading: workspaceByIdLoading } = useQuery({
    queryKey: ['resolve-workspace-id', workspaceIdFromParams],
    queryFn: async () => {
      if (!workspaceIdFromParams) return null;
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, slug, name, workspace_type, parent_workspace_id')
        .eq('id', workspaceIdFromParams)
        .single();
      if (error) return null;
      return {
        id: data.id,
        slug: data.slug || slugify(data.name),
        name: data.name,
        workspaceType: data.workspace_type || 'ROOT',
        parentWorkspaceId: data.parent_workspace_id,
      };
    },
    enabled: !!workspaceIdFromParams,
  });

  const resolvedWorkspace = workspaceById || workspaceBySlug;
  const resolvedWorkspaceId = workspaceIdFromParams || workspaceBySlug?.id;

  const isLoading = eventLoading || eventByIdLoading || workspaceLoading || workspaceByIdLoading;
  const isReady = !isLoading && (!!resolvedEventId || !isHierarchicalUrl);

  return {
    parsed,
    isLegacyUrl,
    isHierarchicalUrl,
    currentLevel,
    
    eventId: resolvedEventId,
    workspaceId: resolvedWorkspaceId,
    
    event: resolvedEvent ? {
      id: resolvedEvent.id,
      slug: resolvedEvent.slug || slugify(resolvedEvent.name),
      name: resolvedEvent.name,
    } : null,
    workspace: resolvedWorkspace || null,
    
    activeTab: (parsed.deepLink.tab as WorkspaceTab) || 'overview',
    taskId: parsed.deepLink.taskId,
    sectionId: parsed.deepLink.sectionId,
    roleSpace: parsed.deepLink.roleSpace,
    
    isLoading,
    isReady,
  };
}
