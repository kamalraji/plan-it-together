/**
 * useEventData Hook
 * Combines TanStack Query with event-compat utilities for optimized data fetching
 * 
 * Features:
 * - Automatic caching with configurable stale times
 * - Legacy JSONB to normalized schema conversion
 * - Related data fetching (venues, virtual links, images, FAQs)
 * - Optimistic updates support
 * - Type-safe data access
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryPresets } from '@/lib/query-config';
import { normalizeEventFromDB } from '@/utils/event-compat';
import { 
  EVENT_VENUE_COLUMNS, 
  EVENT_VIRTUAL_LINK_COLUMNS, 
  EVENT_IMAGE_COLUMNS, 
  EVENT_FAQ_COLUMNS 
} from '@/lib/supabase-columns';
import type { 
  Event, 
  EventVenue, 
  EventVirtualLink, 
  EventImage, 
  EventFAQ,
  VirtualPlatform,
} from '@/types/event.types';
import type { Database } from '@/integrations/supabase/types';

// Type helpers
type EventRow = Database['public']['Tables']['events']['Row'];
type EventStatusDB = EventRow['status'];
type EventVisibilityDB = EventRow['visibility'];
type EventModeDB = EventRow['mode'];
type EventCategoryDB = EventRow['category'];

// ============================================
// Query Key Factory
// ============================================

export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (filters?: EventListFilters) => [...eventKeys.lists(), filters] as const,
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventKeys.details(), id] as const,
  venue: (eventId: string) => [...eventKeys.detail(eventId), 'venue'] as const,
  virtualLinks: (eventId: string) => [...eventKeys.detail(eventId), 'virtualLinks'] as const,
  images: (eventId: string) => [...eventKeys.detail(eventId), 'images'] as const,
  faqs: (eventId: string) => [...eventKeys.detail(eventId), 'faqs'] as const,
  bySlug: (slug: string) => [...eventKeys.all, 'slug', slug] as const,
  byOrganization: (orgId: string) => [...eventKeys.all, 'organization', orgId] as const,
};

// ============================================
// Types
// ============================================

export interface EventListFilters {
  organizationId?: string;
  status?: EventStatusDB;
  visibility?: EventVisibilityDB;
  mode?: EventModeDB;
  category?: EventCategoryDB;
  limit?: number;
  offset?: number;
}

interface UseEventDataOptions {
  enabled?: boolean;
  includeRelations?: boolean;
  staleTime?: number;
}

// ============================================
// Main Hook: useEventData
// ============================================

/**
 * Fetch a single event by ID with all related data
 * Automatically normalizes legacy JSONB data to the new schema
 */
export function useEventData(eventId: string | undefined, options: UseEventDataOptions = {}) {
  const { enabled = true, includeRelations = true, staleTime } = options;

  return useQuery({
    queryKey: eventKeys.detail(eventId || ''),
    queryFn: async (): Promise<Event | null> => {
      if (!eventId) return null;

      // Build the query with optional relations
      let query = supabase
        .from('events')
        .select(`
          *,
          organizations (
            id,
            name,
            logo_url,
            verification_status,
            branding
          )
          ${includeRelations ? `,
          event_venues (*),
          event_virtual_links (*),
          event_images (*),
          event_faqs (*)
          ` : ''}
        `)
        .eq('id', eventId)
        .single();

      const { data, error } = await query;

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return normalizeEventFromDB(data);
    },
    enabled: enabled && !!eventId,
    staleTime: staleTime ?? queryPresets.standard.staleTime,
    gcTime: queryPresets.standard.gcTime,
  });
}

// ============================================
// Hook: useEventBySlug
// ============================================

/**
 * Fetch an event by its landing page slug
 * Useful for public event pages
 */
export function useEventBySlug(slug: string | undefined, options: UseEventDataOptions = {}) {
  const { enabled = true, includeRelations = true, staleTime } = options;

  return useQuery({
    queryKey: eventKeys.bySlug(slug || ''),
    queryFn: async (): Promise<Event | null> => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          organizations (
            id,
            name,
            logo_url,
            verification_status,
            branding
          )
          ${includeRelations ? `,
          event_venues (*),
          event_virtual_links (*),
          event_images (*),
          event_faqs (*)
          ` : ''}
        `)
        .eq('landing_page_slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return normalizeEventFromDB(data);
    },
    enabled: enabled && !!slug,
    staleTime: staleTime ?? queryPresets.standard.staleTime,
    gcTime: queryPresets.standard.gcTime,
  });
}

// ============================================
// Hook: useEventsList
// ============================================

/**
 * Fetch a list of events with optional filters
 */
export function useEventsList(filters: EventListFilters = {}, options: UseEventDataOptions = {}) {
  const { enabled = true, staleTime } = options;

  return useQuery({
    queryKey: eventKeys.list(filters),
    queryFn: async (): Promise<Event[]> => {
      let query = supabase
        .from('events')
        .select(`
          *,
          organizations (
            id,
            name,
            logo_url,
            verification_status
          )
        `)
        .order('start_date', { ascending: true });

      // Apply filters
      if (filters.organizationId) {
        query = query.eq('organization_id', filters.organizationId);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.visibility) {
        query = query.eq('visibility', filters.visibility);
      }
      if (filters.mode) {
        query = query.eq('mode', filters.mode);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(normalizeEventFromDB);
    },
    enabled,
    staleTime: staleTime ?? queryPresets.dynamic.staleTime,
    gcTime: queryPresets.dynamic.gcTime,
  });
}

// ============================================
// Hook: useOrganizationEvents
// ============================================

/**
 * Fetch all events for an organization
 */
export function useOrganizationEvents(organizationId: string | undefined, options: UseEventDataOptions = {}) {
  return useEventsList(
    { organizationId: organizationId || '' },
    { ...options, enabled: options.enabled !== false && !!organizationId }
  );
}

// ============================================
// Related Data Hooks
// ============================================

/**
 * Fetch event venue separately (for lazy loading)
 */
export function useEventVenue(eventId: string | undefined) {
  return useQuery({
    queryKey: eventKeys.venue(eventId || ''),
    queryFn: async (): Promise<EventVenue | null> => {
      if (!eventId) return null;

      const { data, error } = await supabase
        .from('event_venues')
        .select(EVENT_VENUE_COLUMNS.detail)
        .eq('event_id', eventId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        eventId: data.event_id,
        name: data.name,
        address: data.address || '',
        city: data.city || '',
        state: data.state || null,
        country: data.country || '',
        postalCode: data.postal_code || null,
        latitude: data.latitude,
        longitude: data.longitude,
        capacity: data.capacity,
        accessibilityFeatures: data.accessibility_features || [],
        accessibilityNotes: data.accessibility_notes,
        createdAt: data.created_at || new Date().toISOString(),
        updatedAt: data.updated_at || new Date().toISOString(),
      };
    },
    enabled: !!eventId,
    staleTime: queryPresets.standard.staleTime,
  });
}

/**
 * Fetch event virtual links separately
 */
export function useEventVirtualLinks(eventId: string | undefined) {
  return useQuery({
    queryKey: eventKeys.virtualLinks(eventId || ''),
    queryFn: async (): Promise<EventVirtualLink[]> => {
      if (!eventId) return [];

      const { data, error } = await supabase
        .from('event_virtual_links')
        .select(EVENT_VIRTUAL_LINK_COLUMNS.detail)
        .eq('event_id', eventId)
        .order('is_primary', { ascending: false });

      if (error) throw error;

      return (data || []).map(vl => ({
        id: vl.id,
        eventId: vl.event_id,
        platform: (vl.platform || 'other') as VirtualPlatform,
        meetingUrl: vl.meeting_url || '',
        meetingId: vl.meeting_id || null,
        password: vl.password || null,
        instructions: vl.instructions || null,
        isPrimary: vl.is_primary ?? true,
        createdAt: vl.created_at || new Date().toISOString(),
        updatedAt: vl.updated_at || new Date().toISOString(),
      }));
    },
    enabled: !!eventId,
    staleTime: queryPresets.standard.staleTime,
  });
}

/**
 * Fetch event images separately
 */
export function useEventImages(eventId: string | undefined) {
  return useQuery({
    queryKey: eventKeys.images(eventId || ''),
    queryFn: async (): Promise<EventImage[]> => {
      if (!eventId) return [];

      const { data, error } = await supabase
        .from('event_images')
        .select(EVENT_IMAGE_COLUMNS.detail)
        .eq('event_id', eventId)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      return (data || []).map(img => ({
        id: img.id,
        eventId: img.event_id,
        imageUrl: img.url || '',
        caption: img.caption || null,
        sortOrder: img.sort_order ?? 0,
        isPrimary: img.is_primary ?? false,
        createdAt: img.created_at || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    },
    enabled: !!eventId,
    staleTime: queryPresets.standard.staleTime,
  });
}

/**
 * Fetch event FAQs separately
 */
export function useEventFAQs(eventId: string | undefined) {
  return useQuery({
    queryKey: eventKeys.faqs(eventId || ''),
    queryFn: async (): Promise<EventFAQ[]> => {
      if (!eventId) return [];

      const { data, error } = await supabase
        .from('event_faqs')
        .select(EVENT_FAQ_COLUMNS.detail)
        .eq('event_id', eventId)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      return (data || []).map(faq => ({
        id: faq.id,
        eventId: faq.event_id,
        question: faq.question,
        answer: faq.answer,
        sortOrder: faq.sort_order ?? 0,
        createdAt: faq.created_at || new Date().toISOString(),
        updatedAt: faq.updated_at || new Date().toISOString(),
      }));
    },
    enabled: !!eventId,
    staleTime: queryPresets.standard.staleTime,
  });
}

// ============================================
// Prefetch Utilities
// ============================================

/**
 * Prefetch event data for faster navigation
 */
export function usePrefetchEvent() {
  const queryClient = useQueryClient();

  return async (eventId: string) => {
    await queryClient.prefetchQuery({
      queryKey: eventKeys.detail(eventId),
      queryFn: async () => {
        const { data, error } = await supabase
          .from('events')
          .select(`
            *,
            organizations (id, name, logo_url, verification_status),
            event_venues (*),
            event_virtual_links (*),
            event_images (*),
            event_faqs (*)
          `)
          .eq('id', eventId)
          .single();

        if (error) throw error;
        return normalizeEventFromDB(data);
      },
      staleTime: queryPresets.standard.staleTime,
    });
  };
}

// ============================================
// Cache Invalidation Utilities
// ============================================

/**
 * Hook to get cache invalidation functions
 */
export function useEventCacheInvalidation() {
  const queryClient = useQueryClient();

  return {
    /** Invalidate a specific event */
    invalidateEvent: (eventId: string) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
    },
    
    /** Invalidate all event lists */
    invalidateEventLists: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
    },
    
    /** Invalidate organization events */
    invalidateOrganizationEvents: (orgId: string) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.byOrganization(orgId) });
    },
    
    /** Invalidate all event-related queries */
    invalidateAllEvents: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
    
    /** Update event in cache optimistically */
    optimisticUpdate: (eventId: string, updater: (old: Event | null | undefined) => Event) => {
      queryClient.setQueryData(eventKeys.detail(eventId), updater);
    },
    
    /** Set event data in cache */
    setEventData: (eventId: string, data: Event) => {
      queryClient.setQueryData(eventKeys.detail(eventId), data);
    },
  };
}

// ============================================
// Combined Data Hook
// ============================================

/**
 * Fetch event with all related data in separate queries (for parallel loading)
 * Useful when you need to show loading states for each section
 */
export function useEventWithRelations(eventId: string | undefined) {
  const eventQuery = useEventData(eventId, { includeRelations: false });
  const venueQuery = useEventVenue(eventId);
  const virtualLinksQuery = useEventVirtualLinks(eventId);
  const imagesQuery = useEventImages(eventId);
  const faqsQuery = useEventFAQs(eventId);

  const isLoading = 
    eventQuery.isLoading || 
    venueQuery.isLoading || 
    virtualLinksQuery.isLoading || 
    imagesQuery.isLoading || 
    faqsQuery.isLoading;

  const isError = 
    eventQuery.isError || 
    venueQuery.isError || 
    virtualLinksQuery.isError || 
    imagesQuery.isError || 
    faqsQuery.isError;

  // Combine data
  const event: Event | null = eventQuery.data
    ? {
        ...eventQuery.data,
        venue: venueQuery.data || eventQuery.data.venue,
        virtualLinks: virtualLinksQuery.data?.length ? virtualLinksQuery.data : eventQuery.data.virtualLinks,
        images: imagesQuery.data?.length ? imagesQuery.data : eventQuery.data.images,
        faqs: faqsQuery.data?.length ? faqsQuery.data : eventQuery.data.faqs,
      }
    : null;

  return {
    data: event,
    isLoading,
    isError,
    queries: {
      event: eventQuery,
      venue: venueQuery,
      virtualLinks: virtualLinksQuery,
      images: imagesQuery,
      faqs: faqsQuery,
    },
  };
}

// Export default for convenience
export default useEventData;
