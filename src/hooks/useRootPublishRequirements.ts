import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/looseClient';
import { PublishRequirements, DEFAULT_PUBLISH_REQUIREMENTS } from '@/types/eventPublishReadiness';

export interface RootPublishRequirementsData {
  publishRequirements: PublishRequirements;
  requiresApproval: boolean;
  approverRoles: string[];
  rootWorkspaceId: string | null;
  rootWorkspaceName: string | null;
}

/**
 * Hook to fetch ROOT workspace publish requirements from any workspace level.
 * This enables child workspaces to see what the ROOT workspace requires for publishing.
 */
export function useRootPublishRequirements(eventId: string | undefined) {
  return useQuery({
    queryKey: ['root-publish-requirements', eventId],
    queryFn: async (): Promise<RootPublishRequirementsData> => {
      if (!eventId) {
        return {
          publishRequirements: DEFAULT_PUBLISH_REQUIREMENTS,
          requiresApproval: false,
          approverRoles: [],
          rootWorkspaceId: null,
          rootWorkspaceName: null,
        };
      }

      // Find the ROOT workspace for this event
      const { data: rootWorkspace, error } = await supabase
        .from('workspaces')
        .select('id, name, settings')
        .eq('event_id', eventId)
        .eq('workspace_type', 'ROOT')
        .maybeSingle();

      if (error) throw error;

      if (!rootWorkspace) {
        return {
          publishRequirements: DEFAULT_PUBLISH_REQUIREMENTS,
          requiresApproval: false,
          approverRoles: [],
          rootWorkspaceId: null,
          rootWorkspaceName: null,
        };
      }

      const settings = rootWorkspace.settings as {
        publishRequirements?: PublishRequirements;
        requireEventPublishApproval?: boolean;
        publishApproverRoles?: string[];
      } | null;

      return {
        publishRequirements: settings?.publishRequirements || DEFAULT_PUBLISH_REQUIREMENTS,
        requiresApproval: settings?.requireEventPublishApproval ?? false,
        approverRoles: settings?.publishApproverRoles || ['WORKSPACE_OWNER'],
        rootWorkspaceId: rootWorkspace.id,
        rootWorkspaceName: rootWorkspace.name,
      };
    },
    enabled: !!eventId,
    staleTime: 30000, // 30 seconds
  });
}
