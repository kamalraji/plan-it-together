import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationService, CreateOrganizationDTO, UpdateOrganizationDTO, SearchOrganizationsParams } from '@/services/organizationService';
import { useToast } from '@/hooks/use-toast';
import { queryPresets } from '@/lib/query-config';

// Query keys
const orgKeys = {
  all: ['organizations'] as const,
  lists: () => [...orgKeys.all, 'list'] as const,
  list: (filters: SearchOrganizationsParams) => [...orgKeys.lists(), filters] as const,
  details: () => [...orgKeys.all, 'detail'] as const,
  detail: (id: string) => [...orgKeys.details(), id] as const,
  bySlug: (slug: string) => [...orgKeys.all, 'slug', slug] as const,
  events: (id: string) => [...orgKeys.detail(id), 'events'] as const,
  admins: (id: string) => [...orgKeys.detail(id), 'admins'] as const,
  analytics: (id: string) => [...orgKeys.detail(id), 'analytics'] as const,
  followed: (userId: string) => [...orgKeys.all, 'followed', userId] as const,
  isFollowing: (orgId: string, userId: string) => [...orgKeys.detail(orgId), 'following', userId] as const,
  myOrganizations: ['organizations', 'mine'] as const,
  myMemberOrganizations: ['organizations', 'member-orgs'] as const,
  myMemberships: ['organizations', 'memberships', 'me'] as const,
  memberships: (orgId: string) => [...orgKeys.detail(orgId), 'memberships'] as const,
} as const;

/**
 * Hook to create an organization
 */
export function useCreateOrganization() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateOrganizationDTO) => {
      const { supabase } = await import('@/integrations/supabase/looseClient');
      const { data: result, error } = await supabase.functions.invoke('create-organization', {
        body: data,
      });

      if (error) {
        throw new Error(error.message || 'Failed to create organization');
      }

      const organization = (result as any)?.organization;
      if (!organization) {
        throw new Error('Organization was not returned from backend');
      }

      return organization as { id: string; slug: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.lists() });
      toast({
        title: 'Success',
        description: 'Organization created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create organization',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to update an organization
 */
export function useUpdateOrganization(organizationId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (updates: UpdateOrganizationDTO) =>
      organizationService.updateOrganization(organizationId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.detail(organizationId) });
      queryClient.invalidateQueries({ queryKey: orgKeys.lists() });
      toast({
        title: 'Success',
        description: 'Organization updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update organization',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to fetch an organization by ID
 */
export function useOrganization(organizationId: string) {
  return useQuery({
    queryKey: orgKeys.detail(organizationId),
    queryFn: () => organizationService.getOrganization(organizationId),
    enabled: !!organizationId,
    staleTime: queryPresets.static.staleTime,
    gcTime: queryPresets.static.gcTime,
  });
}

/**
 * Hook to fetch an organization by slug
 */
export function useOrganizationBySlug(slug: string) {
  return useQuery({
    queryKey: orgKeys.bySlug(slug),
    queryFn: () => organizationService.getOrganizationBySlug(slug),
    enabled: !!slug,
    staleTime: queryPresets.static.staleTime,
    gcTime: queryPresets.static.gcTime,
  });
}

/**
 * Hook to search organizations
 */
export function useSearchOrganizations(params: SearchOrganizationsParams) {
  return useQuery({
    queryKey: orgKeys.list(params),
    queryFn: () => organizationService.searchOrganizations(params),
    staleTime: queryPresets.standard.staleTime,
    gcTime: queryPresets.standard.gcTime,
  });
}

/**
 * Hook to fetch organization events
 */
export function useOrganizationEvents(
  organizationId: string,
  visibility?: 'PUBLIC' | 'PRIVATE' | 'UNLISTED'
) {
  return useQuery({
    queryKey: orgKeys.events(organizationId),
    queryFn: () => organizationService.getOrganizationEvents(organizationId, visibility),
    enabled: !!organizationId,
    staleTime: queryPresets.standard.staleTime,
    gcTime: queryPresets.standard.gcTime,
  });
}

/**
 * Hook to add an admin to an organization
 */
export function useAddOrganizationAdmin(organizationId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role?: string }) =>
      organizationService.addAdmin(organizationId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.admins(organizationId) });
      toast({
        title: 'Success',
        description: 'Admin added successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add admin',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to remove an admin from an organization
 */
export function useRemoveOrganizationAdmin(organizationId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (userId: string) => organizationService.removeAdmin(organizationId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.admins(organizationId) });
      toast({
        title: 'Success',
        description: 'Admin removed successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove admin',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to fetch organization admins (legacy)
 */
export function useOrganizationAdmins(organizationId: string) {
  return useQuery({
    queryKey: orgKeys.admins(organizationId),
    queryFn: () => organizationService.getOrganizationAdmins(organizationId),
    enabled: !!organizationId,
  });
}

/**
 * Hook to fetch memberships for an organization
 */
export function useOrganizationMemberships(
  organizationId: string,
  status?: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'REMOVED',
) {
  return useQuery({
    queryKey: [orgKeys.memberships(organizationId), status],
    queryFn: () => organizationService.getOrganizationMemberships(organizationId, status),
    enabled: !!organizationId,
  });
}

/**
 * Hook to follow an organization
 */
export function useFollowOrganization(organizationId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => organizationService.followOrganization(organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.detail(organizationId) });
      queryClient.invalidateQueries({ queryKey: orgKeys.all });
      toast({
        title: 'Success',
        description: 'Now following organization',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to follow organization',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to unfollow an organization
 */
export function useUnfollowOrganization(organizationId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => organizationService.unfollowOrganization(organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.detail(organizationId) });
      queryClient.invalidateQueries({ queryKey: orgKeys.all });
      toast({
        title: 'Success',
        description: 'Unfollowed organization',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to unfollow organization',
        variant: 'destructive',
      });
    },
  });
}

export function useRequestJoinOrganization() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (organizationId: string) =>
      organizationService.requestJoinOrganization(organizationId),
    onSuccess: (data, organizationId) => {
      toast({
        title: 'Request sent',
        description: 'Your request to join this organization is pending approval.',
      });

      // Optimistically merge the new membership into the cached list so
      // components like JoinOrganizationPage immediately show "Pending"/
      // "Joined" instead of reverting back to the "Request to join" button.
      queryClient.setQueryData<any[]>(orgKeys.myMemberships, (old) => {
        const previous = old || [];
        if (!data || !organizationId) return previous;

        const exists = previous.some(
          (m) => m.organization_id === organizationId && m.user_id === data.user_id,
        );
        if (exists) return previous;

        return [...previous, data];
      });

      queryClient.invalidateQueries({ queryKey: orgKeys.myMemberships });
      if (organizationId) {
        queryClient.invalidateQueries({ queryKey: orgKeys.memberships(organizationId) });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send join request',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to update membership status (approve / reject / remove)
 */
export function useUpdateMembershipStatus(organizationId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (args: { membershipId: string; status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'REMOVED'; role?: string }) =>
      organizationService.updateMembershipStatus(args.membershipId, {
        status: args.status,
        role: args.role,
      }),
    onSuccess: () => {
      toast({
        title: 'Updated',
        description: 'Membership updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: orgKeys.memberships(organizationId) });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update membership',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to fetch followed organizations
 */
export function useFollowedOrganizations(userId: string) {
  return useQuery({
    queryKey: orgKeys.followed(userId),
    queryFn: () => organizationService.getFollowedOrganizations(userId),
    enabled: !!userId,
  });
}

/**
 * Hook to check if user is following an organization
 */
export function useIsFollowing(organizationId: string, userId: string) {
  return useQuery({
    queryKey: orgKeys.isFollowing(organizationId, userId),
    queryFn: () => organizationService.isFollowing(organizationId, userId),
    enabled: !!organizationId && !!userId,
  });
}

/**
 * Hook to fetch organization analytics
 */
export function useOrganizationAnalytics(organizationId: string) {
  return useQuery({
    queryKey: orgKeys.analytics(organizationId),
    queryFn: () => organizationService.getOrganizationAnalytics(organizationId),
    enabled: !!organizationId,
  });
}

/**
 * Hook to fetch organizations where the current user is the owner (legacy)
 */
export function useMyOrganizations() {
  return useQuery({
    queryKey: orgKeys.myOrganizations,
    queryFn: () => organizationService.getMyOrganizations(),
  });
}

/**
 * Hook to fetch organizations where the current user is an ACTIVE member
 */
export function useMyMemberOrganizations() {
  return useQuery({
    queryKey: orgKeys.myMemberOrganizations,
    queryFn: () => organizationService.getMyMemberOrganizations(),
  });
}

/**
 * Hook to fetch membership rows for the current user
 */
export function useMyOrganizationMemberships() {
  return useQuery({
    queryKey: orgKeys.myMemberships,
    queryFn: () => organizationService.getMyOrganizationMemberships(),
  });
}
