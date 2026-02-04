/**
 * Event Form Utility Functions
 * Handles type-safe transformations between database types and form types
 */
import type { Event, CreateEventDTO, VenueConfig, VirtualConfig, EventMode, EventVisibility } from '@/types';

/**
 * Converts null values to undefined for form compatibility
 * React Hook Form expects undefined for optional fields, not null
 */
function nullToUndefined<T>(value: T | null | undefined): T | undefined {
  return value === null ? undefined : value;
}

/**
 * Transform event venue data for form defaults
 * Handles the type mismatch between database null values and form undefined values
 */
function transformVenueForForm(venue: any): VenueConfig | undefined {
  if (!venue) return undefined;
  
  return {
    name: venue.name || '',
    address: venue.address || '',
    city: venue.city || '',
    state: nullToUndefined(venue.state) || '',
    country: venue.country || '',
    postalCode: nullToUndefined(venue.postalCode) || '',
    coordinates: venue.latitude && venue.longitude 
      ? { latitude: venue.latitude, longitude: venue.longitude }
      : venue.coordinates,
    capacity: nullToUndefined(venue.capacity),
    facilities: venue.accessibilityFeatures || venue.facilities || [],
  };
}

/**
 * Transform virtual links data for form defaults
 */
function transformVirtualLinksForForm(virtualLinks: any): VirtualConfig | undefined {
  if (!virtualLinks) return undefined;
  
  // Handle array format (new schema)
  if (Array.isArray(virtualLinks)) {
    const primary = virtualLinks.find((v: any) => v.isPrimary) || virtualLinks[0];
    if (!primary) return undefined;
    
    return {
      meetingUrl: primary.meetingUrl || '',
      meetingId: nullToUndefined(primary.meetingId),
      password: nullToUndefined(primary.password),
      platform: primary.platform || 'other',
      instructions: nullToUndefined(primary.instructions),
    };
  }
  
  // Handle object format (legacy)
  return {
    meetingUrl: virtualLinks.meetingUrl || '',
    meetingId: nullToUndefined(virtualLinks.meetingId),
    password: nullToUndefined(virtualLinks.password),
    platform: virtualLinks.platform || 'other',
    instructions: nullToUndefined(virtualLinks.instructions),
  };
}

/**
 * Get form default values from an existing event
 * Ensures all null values are converted to undefined for form compatibility
 */
export function getEventFormDefaults(event: Event): Partial<CreateEventDTO> {
  return {
    name: event.name,
    description: event.description,
    mode: event.mode,
    startDate: event.startDate.slice(0, 16), // Format for datetime-local input
    endDate: event.endDate.slice(0, 16),
    capacity: nullToUndefined(event.capacity),
    registrationDeadline: event.registrationDeadline?.slice(0, 16),
    organizationId: nullToUndefined(event.organizationId),
    visibility: event.visibility,
    branding: event.branding || {},
    venue: transformVenueForForm(event.venue),
    virtualLinks: transformVirtualLinksForForm(event.virtualLinks),
    timeline: event.timeline || [],
    prizes: event.prizes || [],
    sponsors: event.sponsors || [],
  };
}

/**
 * Get empty form defaults for new event creation
 */
export function getEmptyEventFormDefaults(
  defaultMode: EventMode = 'OFFLINE' as EventMode,
  defaultVisibility: EventVisibility = 'PUBLIC' as EventVisibility
): Partial<CreateEventDTO> {
  return {
    mode: defaultMode,
    visibility: defaultVisibility,
    branding: {},
    timeline: [],
    prizes: [],
    sponsors: [],
  };
}
