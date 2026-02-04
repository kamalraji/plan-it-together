import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { buildHierarchyChain, buildWorkspaceUrl, slugify } from '@/lib/workspaceNavigation';
import { Loader2 } from 'lucide-react';

interface WorkspaceWithParent {
  id: string;
  name: string;
  slug: string | null;
  workspace_type: string | null;
  parent_workspace_id: string | null;
  event_id: string;
}

interface EventData {
  id: string;
  slug: string | null;
  name: string;
}

/**
 * LegacyWorkspaceRedirect handles redirecting old workspace URLs to the new hierarchical format
 * 
 * Old format: /:orgSlug/workspaces/:eventId/:workspaceType?name=xxx&workspaceId=xxx
 * New format: /:orgSlug/workspaces/:eventSlug/root/:rootSlug/department/:deptSlug?eventId=xxx&workspaceId=xxx
 */
export const LegacyWorkspaceRedirect: React.FC = () => {
  const { orgSlug, eventId } = useParams<{ orgSlug: string; eventId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [redirectAttempted, setRedirectAttempted] = useState(false);

  const workspaceId = searchParams.get('workspaceId');
  const tab = searchParams.get('tab');
  const taskId = searchParams.get('taskId');
  const sectionId = searchParams.get('sectionid');
  const roleSpace = searchParams.get('roleSpace');

  // Fetch event data to get slug
  const { data: event } = useQuery({
    queryKey: ['legacy-redirect-event', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const { data, error } = await supabase
        .from('events')
        .select('id, slug, name')
        .eq('id', eventId)
        .single();
      if (error) throw error;
      return data as EventData;
    },
    enabled: !!eventId,
  });

  // Fetch all workspaces for hierarchy building
  const { data: workspaces } = useQuery({
    queryKey: ['legacy-redirect-workspaces', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, slug, workspace_type, parent_workspace_id, event_id')
        .eq('event_id', eventId);
      if (error) throw error;
      return (data || []) as WorkspaceWithParent[];
    },
    enabled: !!eventId,
  });

  // Perform redirect when data is ready
  useEffect(() => {
    if (redirectAttempted) return;
    if (!orgSlug || !event || !workspaces || workspaces.length === 0) return;
    if (!workspaceId) {
      // No workspace selected, redirect to event workspace list
      const eventSlug = event.slug || slugify(event.name);
      navigate(`/${orgSlug}/workspaces/${eventSlug}?eventId=${event.id}`, { replace: true });
      setRedirectAttempted(true);
      return;
    }

    // Find the target workspace
    const targetWorkspace = workspaces.find(ws => ws.id === workspaceId);
    if (!targetWorkspace) {
      console.warn('[LegacyRedirect] Workspace not found:', workspaceId);
      return;
    }

    // Build hierarchy chain
    const workspaceData = workspaces.map(ws => ({
      id: ws.id,
      slug: ws.slug || slugify(ws.name),
      name: ws.name,
      workspaceType: ws.workspace_type,
      parentWorkspaceId: ws.parent_workspace_id,
    }));

    const hierarchy = buildHierarchyChain(workspaceId, workspaceData);
    
    if (hierarchy.length === 0) {
      console.warn('[LegacyRedirect] Could not build hierarchy for workspace:', workspaceId);
      return;
    }

    // Build new hierarchical URL
    const eventSlug = event.slug || slugify(event.name);
    const newUrl = buildWorkspaceUrl(
      {
        orgSlug,
        eventSlug,
        eventId: event.id,
        hierarchy,
      },
      {
        tab: tab as any,
        taskId: taskId || undefined,
        sectionId: sectionId || undefined,
        roleSpace: roleSpace || undefined,
      }
    );

    console.log('[LegacyRedirect] Redirecting:', location.pathname + location.search, '->', newUrl);
    navigate(newUrl, { replace: true });
    setRedirectAttempted(true);
  }, [orgSlug, event, workspaces, workspaceId, tab, taskId, sectionId, roleSpace, navigate, location, redirectAttempted]);

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-[400px] gap-3">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Redirecting...</span>
    </div>
  );
};

export default LegacyWorkspaceRedirect;
