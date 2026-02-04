import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { queryPresets } from '@/lib/query-config';
import { useState, useMemo } from 'react';

export interface WorkspaceMembership {
  workspaceId: string;
  workspaceName: string;
  workspaceType: string | null;
  role: string;
}

export interface DirectoryMember {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  organization: string | null;
  email?: string;
  workspaceMemberships: WorkspaceMembership[];
}

interface UseMemberDirectoryOptions {
  eventId: string;
}

export function useMemberDirectory({ eventId }: UseMemberDirectoryOptions) {
  const { user, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [workspaceTypeFilter, setWorkspaceTypeFilter] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['member-directory', eventId],
    enabled: !!user && !authLoading && !!eventId,
    ...queryPresets.standard,
    queryFn: async (): Promise<DirectoryMember[]> => {
      if (!eventId) return [];

      // First get all workspaces for this event
      const { data: workspaces, error: wsError } = await supabase
        .from('workspaces')
        .select('id, name, workspace_type')
        .eq('event_id', eventId);

      if (wsError) {
        console.error('Error fetching workspaces:', wsError);
        throw wsError;
      }

      if (!workspaces?.length) return [];

      const workspaceIds = workspaces.map(w => w.id);
      const workspaceMap = new Map(workspaces.map(w => [w.id, { name: w.name, type: w.workspace_type }]));

      // Get all team members from these workspaces
      // Note: status can be 'ACTIVE' or 'active' depending on how it was inserted
      const { data: teamMembers, error: tmError } = await supabase
        .from('workspace_team_members')
        .select('user_id, role, workspace_id, status')
        .in('workspace_id', workspaceIds)
        .or('status.ilike.active,status.eq.ACTIVE');

      if (tmError) {
        console.error('Error fetching team members:', tmError);
        throw tmError;
      }

      if (!teamMembers?.length) return [];

      // Get unique user IDs
      const userIds = [...new Set(teamMembers.map(m => m.user_id))];

      // Fetch user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url, organization')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Build member directory
      const membersMap = new Map<string, DirectoryMember>();

      teamMembers.forEach(tm => {
        const profile = profiles?.find(p => p.id === tm.user_id);
        const workspace = workspaceMap.get(tm.workspace_id);

        if (!membersMap.has(tm.user_id)) {
          membersMap.set(tm.user_id, {
            userId: tm.user_id,
            fullName: profile?.full_name || 'Unknown Member',
            avatarUrl: profile?.avatar_url || null,
            organization: profile?.organization || null,
            workspaceMemberships: [],
          });
        }

        const member = membersMap.get(tm.user_id)!;
        member.workspaceMemberships.push({
          workspaceId: tm.workspace_id,
          workspaceName: workspace?.name || 'Unknown',
          workspaceType: workspace?.type || null,
          role: tm.role,
        });
      });

      return Array.from(membersMap.values()).sort((a, b) => 
        a.fullName.localeCompare(b.fullName)
      );
    },
  });

  // Filtered and searched members
  const filteredMembers = useMemo(() => {
    let members = query.data || [];

    // Apply search filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      members = members.filter(m =>
        m.fullName.toLowerCase().includes(lowerQuery) ||
        m.organization?.toLowerCase().includes(lowerQuery) ||
        m.workspaceMemberships.some(wm =>
          wm.workspaceName.toLowerCase().includes(lowerQuery) ||
          wm.role.toLowerCase().includes(lowerQuery)
        )
      );
    }

    // Apply workspace type filter
    if (workspaceTypeFilter) {
      members = members.filter(m =>
        m.workspaceMemberships.some(wm => wm.workspaceType === workspaceTypeFilter)
      );
    }

    // Apply role filter
    if (roleFilter) {
      members = members.filter(m =>
        m.workspaceMemberships.some(wm => wm.role === roleFilter)
      );
    }

    return members;
  }, [query.data, searchQuery, workspaceTypeFilter, roleFilter]);

  // Extract unique roles and workspace types for filter options
  const filterOptions = useMemo(() => {
    const members = query.data || [];
    const roles = new Set<string>();
    const workspaceTypes = new Set<string>();

    members.forEach(m => {
      m.workspaceMemberships.forEach(wm => {
        roles.add(wm.role);
        if (wm.workspaceType) workspaceTypes.add(wm.workspaceType);
      });
    });

    return {
      roles: Array.from(roles).sort(),
      workspaceTypes: Array.from(workspaceTypes).sort(),
    };
  }, [query.data]);

  return {
    members: filteredMembers,
    allMembers: query.data || [],
    totalCount: query.data?.length || 0,
    filteredCount: filteredMembers.length,
    isLoading: query.isLoading || authLoading,
    error: query.error,
    refetch: query.refetch,
    // Search and filters
    searchQuery,
    setSearchQuery,
    workspaceTypeFilter,
    setWorkspaceTypeFilter,
    roleFilter,
    setRoleFilter,
    filterOptions,
  };
}
