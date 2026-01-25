/**
 * Event Backward Compatibility Layer
 * Phase 5: Provides utilities to bridge legacy JSONB data with the normalized schema
 * 
 * This module handles:
 * 1. Reading from both legacy (branding JSONB) and normalized (dedicated columns) sources
 * 2. Migrating legacy data to normalized format on-the-fly
 * 3. Providing consistent API regardless of data source
 */

import type {
  Event,
  EventVenue,
  EventVirtualLink,
  EventImage,
  EventFAQ,
  EventBranding,
  EventBrandingExtended,
  RegistrationType,
  VirtualPlatform,
  LegacyVenueConfig,
  LegacyVirtualConfig,
} from '@/types/event.types';

// ============================================
// Type Guards
// ============================================

/**
 * Check if a value is a valid RegistrationType enum value
 */
export function isRegistrationType(value: unknown): value is RegistrationType {
  return (
    value === 'OPEN' ||
    value === 'INVITE_ONLY' ||
    value === 'APPROVAL_REQUIRED'
  );
}

/**
 * Check if a value is a valid VirtualPlatform
 */
export function isVirtualPlatform(value: unknown): value is VirtualPlatform {
  return (
    value === 'zoom' ||
    value === 'teams' ||
    value === 'meet' ||
    value === 'webex' ||
    value === 'other'
  );
}

// ============================================
// Data Extraction Utilities
// ============================================

/**
 * Extract timezone with fallback priority:
 * 1. Dedicated timezone column
 * 2. branding.timezone
 * 3. Default 'UTC'
 */
export function extractTimezone(event: Partial<Event>): string {
  if (event.timezone) return event.timezone;
  if (event.branding?.timezone) return event.branding.timezone;
  return 'UTC';
}

/**
 * Extract registration type with fallback priority:
 * 1. Dedicated registrationType column
 * 2. branding.registrationType
 * 3. branding.registration?.type (old legacy)
 * 4. Default 'OPEN'
 */
export function extractRegistrationType(event: Partial<Event>): RegistrationType | string {
  if (event.registrationType) return event.registrationType;
  
  const branding = event.branding as EventBrandingExtended | undefined;
  if (branding?.registrationType) return branding.registrationType;
  if (branding?.registration?.type) return branding.registration.type;
  if (branding?.ticketing?.registrationType) return branding.ticketing.registrationType;
  
  return 'OPEN';
}

/**
 * Extract isFree flag with fallback priority:
 * 1. Dedicated is_free column
 * 2. branding.isFreeEvent
 * 3. branding.ticketing?.isFree
 * 4. Default true
 */
export function extractIsFree(event: Partial<Event>): boolean {
  if (typeof event.isFree === 'boolean') return event.isFree;
  
  const branding = event.branding as EventBrandingExtended | undefined;
  if (typeof branding?.isFreeEvent === 'boolean') return branding.isFreeEvent;
  if (typeof branding?.ticketing?.isFree === 'boolean') return branding.ticketing.isFree;
  
  return true;
}

/**
 * Extract allowWaitlist flag with fallback priority:
 * 1. Dedicated allow_waitlist column
 * 2. branding.allowWaitlist
 * 3. branding.registration?.allowWaitlist
 * 4. Default false
 */
export function extractAllowWaitlist(event: Partial<Event>): boolean {
  if (typeof event.allowWaitlist === 'boolean') return event.allowWaitlist;
  
  const branding = event.branding as EventBrandingExtended | undefined;
  if (typeof branding?.allowWaitlist === 'boolean') return branding.allowWaitlist;
  if (typeof branding?.registration?.allowWaitlist === 'boolean') return branding.registration.allowWaitlist;
  
  return false;
}

/**
 * Extract contact email with fallback priority:
 * 1. Dedicated contact_email column
 * 2. branding.contactEmail
 * 3. null
 */
export function extractContactEmail(event: Partial<Event>): string | null {
  if (event.contactEmail) return event.contactEmail;
  if (event.branding?.contactEmail) return event.branding.contactEmail;
  return null;
}

/**
 * Extract contact phone with fallback priority
 */
export function extractContactPhone(event: Partial<Event>): string | null {
  if (event.contactPhone) return event.contactPhone;
  if (event.branding?.contactPhone) return event.branding.contactPhone;
  return null;
}

/**
 * Extract event website with fallback priority
 */
export function extractEventWebsite(event: Partial<Event>): string | null {
  if (event.eventWebsite) return event.eventWebsite;
  if (event.branding?.eventWebsite) return event.branding.eventWebsite;
  return null;
}

/**
 * Extract registration deadline with fallback priority:
 * 1. Dedicated registration_deadline column
 * 2. branding.registrationDeadline
 * 3. null
 */
export function extractRegistrationDeadline(event: Partial<Event>): string | null {
  if (event.registrationDeadline) return event.registrationDeadline;
  if (event.branding?.registrationDeadline) return event.branding.registrationDeadline;
  return null;
}

/**
 * Extract min/max age restrictions
 */
export function extractAgeRestrictions(event: Partial<Event>): { minAge: number | null; maxAge: number | null } {
  const branding = event.branding as EventBrandingExtended | undefined;
  
  return {
    minAge: event.minAge ?? branding?.minAge ?? branding?.accessibility?.minAge ?? null,
    maxAge: event.maxAge ?? branding?.maxAge ?? branding?.accessibility?.maxAge ?? null,
  };
}

/**
 * Extract language preference
 */
export function extractLanguage(event: Partial<Event>): string | null {
  const branding = event.branding as EventBrandingExtended | undefined;
  return event.language ?? branding?.language ?? branding?.accessibility?.preferredLanguage ?? null;
}

// ============================================
// Venue Extraction & Conversion
// ============================================

/**
 * Convert legacy venue config to normalized EventVenue format
 */
export function legacyVenueToEventVenue(
  eventId: string,
  legacy: LegacyVenueConfig
): Partial<EventVenue> {
  return {
    eventId,
    name: legacy.name || '',
    address: legacy.address || '',
    city: legacy.city || '',
    state: legacy.state || null,
    country: legacy.country || '',
    postalCode: legacy.postalCode || null,
    latitude: legacy.coordinates?.latitude || null,
    longitude: legacy.coordinates?.longitude || null,
    capacity: legacy.capacity || null,
    accessibilityFeatures: legacy.accessibilityFeatures || [],
    accessibilityNotes: legacy.accessibilityNotes || null,
  };
}

/**
 * Extract venue with fallback:
 * 1. Joined event_venues table data
 * 2. branding.venue (legacy)
 */
export function extractVenue(event: Partial<Event>): EventVenue | null {
  // Prefer normalized venue from joined table
  if (event.venue?.id) return event.venue;
  
  // Fallback to legacy branding.venue
  const legacyVenue = event.branding?.venue;
  if (legacyVenue?.name || legacyVenue?.address) {
    return {
      id: `legacy-${event.id}`,
      ...legacyVenueToEventVenue(event.id || '', legacyVenue),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as EventVenue;
  }
  
  return null;
}

// ============================================
// Virtual Links Extraction & Conversion
// ============================================

/**
 * Convert legacy virtual config to normalized EventVirtualLink format
 */
export function legacyVirtualToEventVirtualLink(
  eventId: string,
  legacy: LegacyVirtualConfig
): Partial<EventVirtualLink> {
  return {
    eventId,
    platform: isVirtualPlatform(legacy.platform) ? legacy.platform : 'other',
    meetingUrl: legacy.meetingUrl || '',
    meetingId: legacy.meetingId || null,
    password: legacy.password || null,
    instructions: legacy.instructions || null,
    isPrimary: true,
  };
}

/**
 * Extract virtual links with fallback:
 * 1. Joined event_virtual_links table data
 * 2. branding.virtualLinks (legacy)
 */
export function extractVirtualLinks(event: Partial<Event>): EventVirtualLink[] {
  // Prefer normalized data from joined table
  if (event.virtualLinks?.length) return event.virtualLinks;
  
  // Fallback to legacy branding.virtualLinks
  const legacyVirtual = event.branding?.virtualLinks;
  if (legacyVirtual?.meetingUrl) {
    return [{
      id: `legacy-${event.id}`,
      ...legacyVirtualToEventVirtualLink(event.id || '', legacyVirtual),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as EventVirtualLink];
  }
  
  return [];
}

// ============================================
// Complete Event Normalization
// ============================================

/**
 * Normalize a raw database event row to the unified Event interface
 * This is the main utility for ensuring consistent data access
 */
export function normalizeEventFromDB(dbRow: any): Event {
  const branding = (dbRow.branding || {}) as EventBrandingExtended;
  const eventId = dbRow.id;
  
  // Build venue from joined data or legacy
  let venue: EventVenue | null = null;
  if (dbRow.event_venues?.[0]) {
    const v = dbRow.event_venues[0];
    venue = {
      id: v.id,
      eventId: v.event_id,
      name: v.name,
      address: v.address,
      city: v.city,
      state: v.state,
      country: v.country,
      postalCode: v.postal_code,
      latitude: v.latitude,
      longitude: v.longitude,
      capacity: v.capacity,
      accessibilityFeatures: v.accessibility_features || [],
      accessibilityNotes: v.accessibility_notes,
      createdAt: v.created_at,
      updatedAt: v.updated_at,
    };
  } else if (branding.venue?.name) {
    venue = {
      id: `legacy-${eventId}`,
      ...legacyVenueToEventVenue(eventId, branding.venue),
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    } as EventVenue;
  }
  
  // Build virtual links from joined data or legacy
  let virtualLinks: EventVirtualLink[] = [];
  if (dbRow.event_virtual_links?.length) {
    virtualLinks = dbRow.event_virtual_links.map((vl: any) => ({
      id: vl.id,
      eventId: vl.event_id,
      platform: vl.platform,
      meetingUrl: vl.meeting_url,
      meetingId: vl.meeting_id,
      password: vl.password,
      instructions: vl.instructions,
      isPrimary: vl.is_primary,
      createdAt: vl.created_at,
      updatedAt: vl.updated_at,
    }));
  } else if (branding.virtualLinks?.meetingUrl) {
    virtualLinks = [{
      id: `legacy-${eventId}`,
      ...legacyVirtualToEventVirtualLink(eventId, branding.virtualLinks),
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    } as EventVirtualLink];
  }
  
  // Build images from joined data
  const images: EventImage[] = (dbRow.event_images || []).map((img: any) => ({
    id: img.id,
    eventId: img.event_id,
    imageUrl: img.image_url,
    caption: img.caption,
    sortOrder: img.sort_order,
    isPrimary: img.is_primary,
    createdAt: img.created_at,
    updatedAt: img.updated_at,
  }));
  
  // Build FAQs from joined data
  const faqs: EventFAQ[] = (dbRow.event_faqs || []).map((faq: any) => ({
    id: faq.id,
    eventId: faq.event_id,
    question: faq.question,
    answer: faq.answer,
    sortOrder: faq.sort_order,
    createdAt: faq.created_at,
    updatedAt: faq.updated_at,
  }));
  
  // Extract registration type with fallbacks (branding is already typed as EventBrandingExtended)
  const regType = (dbRow.registration_type as string | undefined)
    || branding.registrationType 
    || branding.registration?.type 
    || branding.ticketing?.registrationType
    || 'OPEN';
  
  return {
    id: eventId,
    name: dbRow.name,
    description: dbRow.description || '',
    slug: dbRow.landing_page_slug || null,
    
    mode: dbRow.mode,
    status: dbRow.status,
    visibility: dbRow.visibility,
    category: dbRow.category || null,
    
    startDate: dbRow.start_date,
    endDate: dbRow.end_date,
    timezone: dbRow.timezone || branding.timezone || 'UTC',
    
    capacity: dbRow.capacity ?? null,
    registrationDeadline: dbRow.registration_deadline || branding.registrationDeadline || null,
    registrationType: regType,
    isFree: dbRow.is_free ?? branding.isFreeEvent ?? true,
    allowWaitlist: dbRow.allow_waitlist ?? branding.allowWaitlist ?? false,
    
    contactEmail: dbRow.contact_email || branding.contactEmail || null,
    contactPhone: dbRow.contact_phone || branding.contactPhone || null,
    eventWebsite: dbRow.event_website || branding.eventWebsite || null,
    
    minAge: dbRow.min_age ?? branding.minAge ?? null,
    maxAge: dbRow.max_age ?? branding.maxAge ?? null,
    language: dbRow.language || branding.language || null,
    
    organizerId: dbRow.organizer_id || '',
    organizationId: dbRow.organization_id || null,
    
    inviteLink: dbRow.invite_link || null,
    landingPageUrl: dbRow.landing_page_slug 
      ? `/e/${dbRow.landing_page_slug}` 
      : `/events/${eventId}`,
    
    branding,
    canvasState: dbRow.canvas_state || null,
    landingPageData: dbRow.landing_page_data || null,
    
    venue,
    virtualLinks,
    images,
    faqs,
    
    timeline: dbRow.timeline || branding.timeline || [],
    agenda: dbRow.agenda || branding.agenda || [],
    prizes: dbRow.prizes || branding.prizes || [],
    sponsors: dbRow.sponsors || branding.sponsors || [],
    
    organization: dbRow.organizations ? {
      id: dbRow.organizations.id,
      name: dbRow.organizations.name,
      logoUrl: dbRow.organizations.logo_url,
      verificationStatus: dbRow.organizations.verification_status,
      branding: dbRow.organizations.branding,
    } : null,
    
    createdAt: dbRow.created_at,
    updatedAt: dbRow.updated_at,
  };
}

// ============================================
// Payload Builders for Database Operations
// ============================================

/**
 * Build the events table payload from form values
 * Ensures proper normalization and backward compatibility in branding
 */
export function buildEventPayload(formValues: any, isUpdate = false): Record<string, any> {
  const payload: Record<string, any> = {
    name: formValues.name,
    description: formValues.description,
    mode: formValues.mode,
    visibility: formValues.visibility || 'PUBLIC',
    category: formValues.category || null,
    
    start_date: formValues.startDate,
    end_date: formValues.endDate,
    capacity: formValues.capacity ? parseInt(formValues.capacity, 10) : null,
    
    // Normalized columns
    timezone: formValues.timezone || 'UTC',
    registration_deadline: formValues.registrationDeadline || null,
    registration_type: formValues.registrationType || 'OPEN',
    is_free: formValues.isFreeEvent ?? true,
    allow_waitlist: formValues.allowWaitlist ?? false,
    contact_email: formValues.contactEmail?.trim() || null,
    contact_phone: formValues.contactPhone?.trim() || null,
    event_website: formValues.eventWebsite?.trim() || null,
    min_age: formValues.minAge || null,
    max_age: formValues.maxAge || null,
    language: formValues.language?.trim() || null,
    
    // Branding JSONB (visual customization + legacy compatibility)
    branding: {
      logoUrl: formValues.logoUrl || null,
      bannerUrl: formValues.bannerUrl || null,
      primaryColor: formValues.primaryColor || null,
      secondaryColor: formValues.secondaryColor || null,
      heroSubtitle: formValues.heroSubtitle || null,
      primaryCtaLabel: formValues.primaryCtaLabel || null,
      secondaryCtaLabel: formValues.secondaryCtaLabel || null,
      
      // SEO (legacy - ideally should be in events table)
      tags: formValues.tags ? formValues.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      metaDescription: formValues.metaDescription || null,
      customSlug: formValues.customSlug || null,
      
      // Legacy fields for backward compatibility
      timezone: formValues.timezone || 'UTC',
      registrationType: formValues.registrationType || 'OPEN',
      isFreeEvent: formValues.isFreeEvent ?? true,
      allowWaitlist: formValues.allowWaitlist ?? false,
      contactEmail: formValues.contactEmail?.trim() || null,
      contactPhone: formValues.contactPhone?.trim() || null,
      eventWebsite: formValues.eventWebsite?.trim() || null,
    },
  };
  
  if (!isUpdate) {
    payload.status = 'DRAFT';
    payload.organization_id = formValues.organizationId || null;
  }
  
  return payload;
}

/**
 * Build venue payload for event_venues table
 */
export function buildVenuePayload(eventId: string, formValues: any): Record<string, any> | null {
  if (!formValues.venueName && !formValues.venueAddress) return null;
  
  return {
    event_id: eventId,
    name: formValues.venueName || '',
    address: formValues.venueAddress || '',
    city: formValues.venueCity || '',
    state: formValues.venueState || null,
    country: formValues.venueCountry || '',
    postal_code: formValues.venuePostalCode || null,
    latitude: formValues.venueLatitude || null,
    longitude: formValues.venueLongitude || null,
    capacity: formValues.venueCapacity ? parseInt(formValues.venueCapacity, 10) : null,
    accessibility_features: formValues.accessibilityFeatures || [],
    accessibility_notes: formValues.accessibilityNotes || null,
  };
}

/**
 * Build virtual link payload for event_virtual_links table
 */
export function buildVirtualLinkPayload(eventId: string, formValues: any): Record<string, any> | null {
  if (!formValues.meetingUrl) return null;
  
  return {
    event_id: eventId,
    platform: formValues.platform || 'other',
    meeting_url: formValues.meetingUrl,
    meeting_id: formValues.meetingId || null,
    password: formValues.meetingPassword || null,
    instructions: formValues.meetingInstructions || null,
    is_primary: true,
  };
}

// ============================================
// Migration Helpers
// ============================================

/**
 * Check if an event needs migration from legacy to normalized format
 */
export function needsMigration(event: Partial<Event>): boolean {
  const branding = event.branding as EventBrandingExtended | undefined;
  
  // Has legacy data in branding but not in normalized columns
  if (branding?.timezone && !event.timezone) return true;
  if (branding?.registrationType && !event.registrationType) return true;
  if (branding?.contactEmail && !event.contactEmail) return true;
  if (branding?.venue && !event.venue?.id) return true;
  if (branding?.virtualLinks && (!event.virtualLinks || event.virtualLinks.length === 0)) return true;
  
  return false;
}

/**
 * Generate SQL migration statements for a specific event
 * (For manual or batch migration use)
 */
export function generateMigrationSQL(eventId: string, branding: EventBranding): string[] {
  const statements: string[] = [];
  
  if (branding.timezone) {
    statements.push(`UPDATE events SET timezone = '${branding.timezone}' WHERE id = '${eventId}';`);
  }
  if (branding.registrationType) {
    statements.push(`UPDATE events SET registration_type = '${branding.registrationType}' WHERE id = '${eventId}';`);
  }
  if (branding.contactEmail) {
    statements.push(`UPDATE events SET contact_email = '${branding.contactEmail}' WHERE id = '${eventId}';`);
  }
  // Add more as needed...
  
  return statements;
}
