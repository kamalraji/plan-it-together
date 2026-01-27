/**
 * Event Form Payload Builder
 * Constructs the database payload from form values
 */
import { EventFormValues } from '@/lib/event-form-schema';

interface VenueData {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  capacity?: number;
  accessibilityFeatures: string[];
  accessibilityNotes?: string;
}

interface VirtualData {
  platform: string;
  meetingUrl: string;
  meetingId?: string;
  password?: string;
  instructions?: string;
}

interface ContactData {
  email: string;
  phone?: string;
  supportUrl?: string;
  eventWebsite?: string;
}

/**
 * Build venue data object from form values
 */
export const buildVenueData = (values: EventFormValues): VenueData | undefined => {
  if ((values.mode === 'OFFLINE' || values.mode === 'HYBRID') && values.venueName) {
    return {
      name: values.venueName.trim(),
      address: values.venueAddress?.trim() || '',
      city: values.venueCity?.trim() || '',
      state: values.venueState?.trim() || '',
      country: values.venueCountry?.trim() || '',
      postalCode: values.venuePostalCode?.trim() || '',
      capacity: values.venueCapacity ? Number(values.venueCapacity) : undefined,
      accessibilityFeatures: values.accessibilityFeatures || [],
      accessibilityNotes: values.accessibilityNotes?.trim() || undefined,
    };
  }
  return undefined;
};

/**
 * Build virtual links data object from form values
 */
export const buildVirtualData = (values: EventFormValues): VirtualData | undefined => {
  if ((values.mode === 'ONLINE' || values.mode === 'HYBRID') && values.virtualMeetingUrl) {
    return {
      platform: values.virtualPlatform || 'other',
      meetingUrl: values.virtualMeetingUrl,
      meetingId: values.virtualMeetingId?.trim() || undefined,
      password: values.virtualPassword || undefined,
      instructions: values.virtualInstructions?.trim() || undefined,
    };
  }
  return undefined;
};

/**
 * Build contact data object from form values
 */
export const buildContactData = (values: EventFormValues): ContactData | undefined => {
  if (values.contactEmail) {
    return {
      email: values.contactEmail.trim(),
      phone: values.contactPhone?.trim() || undefined,
      supportUrl: values.supportUrl || undefined,
      eventWebsite: values.eventWebsite || undefined,
    };
  }
  return undefined;
};

/**
 * Parse tags string into array
 */
export const parseTags = (tags?: string): string[] => {
  if (!tags) return [];
  return tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
};

/**
 * Build the complete event payload for database insertion/update
 */
export const buildEventPayload = (
  values: EventFormValues,
  userId: string,
  mode: 'create' | 'edit'
) => {
  const venueData = buildVenueData(values);
  const virtualLinksData = buildVirtualData(values);
  const contactData = buildContactData(values);
  const tagsArray = parseTags(values.tags);

  // Registration settings
  const registrationData = {
    type: values.registrationType || 'OPEN',
    isFree: values.isFreeEvent ?? true,
    allowWaitlist: values.allowWaitlist ?? false,
  };

  // Ticketing data
  const ticketingData = {
    registrationType: values.registrationType || 'OPEN',
    isFree: values.isFreeEvent ?? true,
    allowWaitlist: values.allowWaitlist ?? false,
  };

  // SEO data
  const seoData = {
    tags: tagsArray,
    metaDescription: values.metaDescription?.trim() || '',
    customSlug: values.customSlug?.trim() || '',
  };

  // Accessibility data
  const accessibilityData = {
    features: values.accessibilityFeatures || [],
    notes: values.accessibilityNotes?.trim() || '',
    language: values.accessibilityLanguage || 'en',
    ageRestriction: {
      enabled: values.ageRestrictionEnabled ?? false,
      minAge: values.minAge ?? null,
      maxAge: values.maxAge ?? null,
    },
  };

  const payload: Record<string, unknown> = {
    name: values.name.trim(),
    description: values.description.trim(),
    mode: values.mode,
    category: values.category || null,
    start_date: values.startDate,
    end_date: values.endDate,
    capacity: values.capacity && values.capacity.trim() !== '' ? Number(values.capacity) : null,
    organization_id: values.organizationId,
    visibility: values.visibility || 'PUBLIC',
    slug: values.customSlug?.trim() || null,

    // Dedicated columns
    timezone: values.timezone || 'UTC',
    registration_deadline: values.registrationDeadline || null,
    registration_type: values.registrationType || 'OPEN',
    is_free: values.isFreeEvent ?? true,
    allow_waitlist: values.allowWaitlist ?? false,
    contact_email: values.contactEmail?.trim() || null,
    contact_phone: values.contactPhone?.trim() || null,
    event_website: values.eventWebsite || null,
    min_age: values.ageRestrictionEnabled ? (values.minAge ?? null) : null,
    max_age: values.ageRestrictionEnabled ? (values.maxAge ?? null) : null,
    language: values.accessibilityLanguage || 'en',

    // Branding JSONB
    branding: {
      primaryColor: values.primaryColor,
      logoUrl: values.logoUrl || undefined,
      heroSubtitle: values.heroSubtitle?.trim() || undefined,
      bannerUrl: values.bannerUrl || undefined,
      primaryCtaLabel: values.primaryCtaLabel?.trim() || undefined,
      secondaryCtaLabel: values.secondaryCtaLabel?.trim() || undefined,
      // Legacy compatibility
      venue: venueData,
      virtualLinks: virtualLinksData,
      contact: contactData,
      registration: registrationData,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
      ticketing: ticketingData,
      seo: seoData,
      accessibility: accessibilityData,
      timezone: values.timezone,
      registrationDeadline: values.registrationDeadline || undefined,
    },
    owner_id: userId,
    canvas_state: values.canvasState ?? null,
  };

  if (mode === 'create') {
    payload.status = 'DRAFT';
  }

  return payload;
};

/**
 * Build venue insert payload for event_venues table
 */
export const buildVenueInsertPayload = (eventId: string, values: EventFormValues) => ({
  event_id: eventId,
  name: values.venueName?.trim() || '',
  address: values.venueAddress?.trim() || null,
  city: values.venueCity?.trim() || null,
  state: values.venueState?.trim() || null,
  country: values.venueCountry?.trim() || null,
  postal_code: values.venuePostalCode?.trim() || null,
  capacity: values.venueCapacity ? Number(values.venueCapacity) : null,
  accessibility_features: values.accessibilityFeatures || [],
  accessibility_notes: values.accessibilityNotes?.trim() || null,
});

/**
 * Build virtual link insert payload for event_virtual_links table
 */
export const buildVirtualLinkInsertPayload = (eventId: string, values: EventFormValues) => ({
  event_id: eventId,
  platform: (values.virtualPlatform as 'zoom' | 'teams' | 'meet' | 'webex' | 'discord' | 'other') || 'other',
  meeting_url: values.virtualMeetingUrl || '',
  meeting_id: values.virtualMeetingId?.trim() || null,
  password: values.virtualPassword || null,
  instructions: values.virtualInstructions?.trim() || null,
  is_primary: true,
});
