import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Organization = Database['public']['Tables']['organizations']['Row'];
type OrganizationAdmin = Database['public']['Tables']['organization_admins']['Row'];
type Follow = Database['public']['Tables']['follows']['Row'];

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
  location?: Record<string, any>;
  social_links?: Record<string, string>;
}

export interface UpdateOrganizationDTO {
  name?: string;
  slug?: string;
  description?: string;
  category?: 'COLLEGE' | 'COMPANY' | 'INDUSTRY' | 'NON_PROFIT';
  logo_url?: string;
  banner_url?: string;
  website?: string;
  email?: string;
  phone?: string;
  location?: Record<string, any>;
  social_links?: Record<string, string>;
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
   * Search organizations with filters
   */
  async searchOrganizations(params: SearchOrganizationsParams): Promise<Organization[]> {
    let query = supabase.from('organizations').select('*');

    // Filter by verified status
    if (params.verifiedOnly) {
      query = query.eq('verification_status', 'VERIFIED');
    }

    // Filter by category
    if (params.category) {
      query = query.eq('category', params.category);
    }

    // Search by name (case-insensitive)
    if (params.query) {
      query = query.ilike('name', `%${params.query}%`);
    }

    // Pagination
    const limit = params.limit || 20;
    const offset = params.offset || 0;
    query = query.range(offset, offset + limit - 1);

    // Order by follower count and name
    query = query.order('follower_count', { ascending: false }).order('name');

    const { data, error } = await query;

    if (error) throw new Error(error.message);
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

    const eventIds = (events || []).map(e => e.id);
    
    let totalRegistrations = 0;
    if (eventIds.length > 0) {
      const { count } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .in('event_id', eventIds);
      totalRegistrations = count || 0;
    }

    // Get followers
    const { data: organization } = await supabase
      .from('organizations')
      .select('follower_count')
      .eq('id', organizationId)
      .single();

    return {
      totalEvents: totalEvents || 0,
      activeEvents: activeEvents || 0,
      totalRegistrations,
      followerCount: organization?.follower_count || 0,
    };
  }
}

export const organizationService = new OrganizationService();