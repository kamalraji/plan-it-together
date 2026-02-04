import { supabase } from '@/integrations/supabase/looseClient';

type Organization = any;
type OrganizationAdmin = any;
type Follow = any;

export interface CreateOrganizationDTO {
  name: string;
  slug: string;
  description?: string;
  category: 'COLLEGE' | 'COMPANY' | 'INDUSTRY' | 'NON_PROFIT';
  logo_url?: string;
  banner_url?: string;
  website?: string;
  email?: string;
  phone?: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  gov_registration_id?: string | null;
  location?: Record<string, any>;
  social_links?: Record<string, string>;
}

export interface UpdateOrganizationDTO {
  name?: string;
  slug?: string;
  description?: string;
  category?: 'COLLEGE' | 'COMPANY' | 'INDUSTRY' | 'NON_PROFIT';
  logo_url?: string | null;
  banner_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_image_url?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  gov_registration_id?: string | null;
  location?: Record<string, any> | null;
  social_links?: Record<string, string> | null;
}

export interface SearchOrganizationsParams {
  query?: string;
  category?: 'COLLEGE' | 'COMPANY' | 'INDUSTRY' | 'NON_PROFIT';
  verifiedOnly?: boolean;
  limit?: number;
  offset?: number;
}

class OrganizationService {
  /**
   * Create a new organization
   * The creator is automatically added as an admin via database trigger
   */
  async createOrganization(data: CreateOrganizationDTO): Promise<Organization> {
    const { data: organization, error } = await supabase
      .from('organizations')
      .insert(data)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return organization;
  }

  /**
   * Update an organization (requires admin access)
   */
  async updateOrganization(
    organizationId: string,
    updates: UpdateOrganizationDTO
  ): Promise<Organization> {
    const { data: organization, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', organizationId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return organization;
  }

  /**
   * Get organization by ID
   */
  async getOrganization(organizationId: string): Promise<Organization> {
    const { data: organization, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (error) throw new Error(error.message);
    return organization;
  }

  /**
   * Get organization by slug
   */
  async getOrganizationBySlug(slug: string): Promise<Organization> {
    const { data: organization, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw new Error(error.message);
    return organization;
  }

  /**
   * Get organizations where the current user is the owner
   */
  async getMyOrganizations(): Promise<Organization[]> {
    const { data: session } = await supabase.auth.getSession();
    const user = session?.session?.user;

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('owner_id', user.id);

    if (error) throw new Error(error.message);
    return data || [];
  }

  /**
   * Get organization membership rows for the current user
   */
  async getMyOrganizationMemberships(): Promise<any[]> {
    const { data: session } = await supabase.auth.getSession();
    const user = session?.session?.user;

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
      .from('organization_memberships')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw new Error(error.message);
    return data || [];
  }

  /**
   * Get organizations where the current user is an ACTIVE member
   */
  async getMyMemberOrganizations(): Promise<Organization[]> {
    const { data: session } = await supabase.auth.getSession();
    const user = session?.session?.user;

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
      .from('organization_memberships')
      .select('organizations(*)')
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE')
      .in('role', ['OWNER', 'ADMIN', 'ORGANIZER']);

    if (error) throw new Error(error.message);

    return (data || [])
      .map((row: any) => row.organizations)
      .filter(Boolean);
  }

  /**
   * Search organizations with filters
   */
  async searchOrganizations(params: SearchOrganizationsParams): Promise<Organization[]> {
    let query = supabase.from('organizations').select('*');

    // Filter by category when provided
    if (params.category) {
      query = query.eq('category', params.category);
    }

    // Simple search by name (case-insensitive)
    if (params.query) {
      query = query.ilike('name', `%${params.query}%`);
    }

    // Pagination
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;
    query = query.range(offset, offset + limit - 1);

    // Stable ordering by name
    query = query.order('name', { ascending: true });

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  /**
   * Get events for an organization
   */
  async getOrganizationEvents(
    organizationId: string,
    visibility?: 'PUBLIC' | 'PRIVATE' | 'UNLISTED'
  ) {
    let query = supabase
      .from('events')
      .select('*')
      .eq('organization_id', organizationId);

    if (visibility) {
      query = query.eq('visibility', visibility);
    }

    query = query.order('start_date', { ascending: false });

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data || [];
  }

  /**
   * Add an admin to an organization
   * (legacy admin model, kept for backwards compatibility)
   */
  async addAdmin(
    organizationId: string,
    userId: string,
    role: string = 'ADMIN'
  ): Promise<OrganizationAdmin> {
    const { data: session } = await supabase.auth.getSession();

    const { data: admin, error } = await supabase
      .from('organization_admins')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        role,
        invited_by: session?.session?.user?.id,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return admin;
  }

  /**
   * Remove an admin from an organization
   */
  async removeAdmin(organizationId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('organization_admins')
      .delete()
      .eq('organization_id', organizationId)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return true;
  }

  /**
   * Get admins for an organization
   */
  async getOrganizationAdmins(organizationId: string): Promise<OrganizationAdmin[]> {
    const { data, error } = await supabase
      .from('organization_admins')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at');

    if (error) throw new Error(error.message);
    return data || [];
  }

  /**
   * Check if user is admin of an organization
   */
  async isUserAdmin(organizationId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('organization_admins')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single();

    return !error && !!data;
  }

  async requestJoinOrganization(organizationId: string): Promise<any> {
    const { data: session } = await supabase.auth.getSession();
    const user = session?.session?.user;

    if (!user) throw new Error('You must be logged in to request to join an organization.');

    // Check if a membership already exists for this org + user
    const { data: existing, error: existingError } = await supabase
      .from('organization_memberships')
      .select('id, status')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingError && existingError.code !== 'PGRST116') {
      throw new Error(existingError.message || 'Failed to check existing membership');
    }

    if (existing) {
      if (existing.status === 'PENDING') {
        throw new Error('You already have a pending request for this organization.');
      }
      if (existing.status === 'ACTIVE') {
        throw new Error('You are already a member of this organization.');
      }
    }

    const { data, error } = await supabase
      .from('organization_memberships')
      .insert({
        organization_id: organizationId,
        user_id: user.id,
        role: 'ORGANIZER',
        status: 'PENDING',
      })
      .select('*')
      .single();

    if (error) {
      const message =
        error.message?.includes('violates row-level security policy')
          ? 'You do not have permission to request to join this organization.'
          : error.message;
      throw new Error(message || 'Failed to send join request');
    }
    return data;
  }

  /**
   * Get memberships for an organization (all statuses)
   */
  async getOrganizationMemberships(
    organizationId: string,
    status?: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'REMOVED',
  ): Promise<any[]> {
    let query = supabase
      .from('organization_memberships')
      .select('*')
      .eq('organization_id', organizationId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }

  /**
   * Update membership status / role (for org admins)
   */
  async updateMembershipStatus(
    membershipId: string,
    updates: { status?: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'REMOVED'; role?: string },
  ): Promise<any> {
    const { data: session } = await supabase.auth.getSession();
    const user = session?.session?.user;

    if (!user) throw new Error('Not authenticated');

    const payload: any = {
      ...updates,
    };

    if (updates.status === 'ACTIVE' || updates.status === 'REJECTED') {
      payload.approved_by = user.id;
    }

    const { data, error } = await supabase
      .from('organization_memberships')
      .update(payload)
      .eq('id', membershipId)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Follow an organization
   */
  async followOrganization(organizationId: string): Promise<Follow> {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) throw new Error('Not authenticated');

    const { data: follow, error } = await supabase
      .from('follows')
      .insert({
        user_id: session.session.user.id,
        organization_id: organizationId,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return follow;
  }

  /**
   * Unfollow an organization
   */
  async unfollowOrganization(organizationId: string): Promise<boolean> {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('user_id', session.session.user.id)
      .eq('organization_id', organizationId);

    if (error) throw new Error(error.message);
    return true;
  }

  /**
   * Get organizations that a user follows
   */
  async getFollowedOrganizations(userId: string): Promise<Organization[]> {
    const { data, error } = await supabase
      .from('follows')
      .select('organization_id, organizations(*)')
      .eq('user_id', userId);

    if (error) throw new Error(error.message);

    return (data || [])
      .map((item: any) => item.organizations)
      .filter(Boolean);
  }

  /**
   * Check if user follows an organization
   */
  async isFollowing(organizationId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .single();

    return !error && !!data;
  }

  /**
   * Get analytics for an organization
   */
  async getOrganizationAnalytics(organizationId: string) {
    // Get total events
    const { count: totalEvents } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    // Get active events
    const { count: activeEvents } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .in('status', ['PUBLISHED', 'ONGOING']);

    // Get total registrations across all events
    const { data: events } = await supabase
      .from('events')
      .select('id')
      .eq('organization_id', organizationId);

    const eventIds = (events || []).map((e: any) => e.id);

    let totalRegistrations = 0;
    if (eventIds.length > 0) {
      const { count } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .in('event_id', eventIds);
      totalRegistrations = count || 0;
    }

    // Get followers from follows table (organization followers)
    const { count: followerCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    return {
      totalEvents: totalEvents || 0,
      activeEvents: activeEvents || 0,
      totalRegistrations,
      followerCount: followerCount || 0,
    };
  }
}

export const organizationService = new OrganizationService();