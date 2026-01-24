/**
 * Event Types - Phase 4: TypeScript Types Alignment
 * 
 * Strong interfaces aligned with the normalized database schema.
 * These types correspond to the events table and related tables:
 * - event_venues
 * - event_virtual_links
 * - event_images
 * - event_faqs
 */

// ============================================
// Core Enums
// ============================================

export enum EventMode {
  OFFLINE = 'OFFLINE',
  ONLINE = 'ONLINE',
  HYBRID = 'HYBRID',
}

export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum EventVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  UNLISTED = 'UNLISTED',
}

export enum RegistrationType {
  OPEN = 'OPEN',
  INVITE_ONLY = 'INVITE_ONLY',
  APPROVAL_REQUIRED = 'APPROVAL_REQUIRED',
}

// ============================================
// Event Category (comprehensive list)
// ============================================

export enum EventCategory {
  // Tech & Innovation
  HACKATHON = 'HACKATHON',
  BOOTCAMP = 'BOOTCAMP',
  WORKSHOP = 'WORKSHOP',
  WEBINAR = 'WEBINAR',
  COMPETITION = 'COMPETITION',
  
  // Business & Professional
  CONFERENCE = 'CONFERENCE',
  MEETUP = 'MEETUP',
  STARTUP_PITCH = 'STARTUP_PITCH',
  HIRING_CHALLENGE = 'HIRING_CHALLENGE',
  NETWORKING = 'NETWORKING',
  TRADE_SHOW = 'TRADE_SHOW',
  EXPO = 'EXPO',
  SUMMIT = 'SUMMIT',
  PANEL_DISCUSSION = 'PANEL_DISCUSSION',
  DEMO_DAY = 'DEMO_DAY',
  
  // Academic & Education
  SEMINAR = 'SEMINAR',
  SYMPOSIUM = 'SYMPOSIUM',
  ORIENTATION = 'ORIENTATION',
  CAREER_FAIR = 'CAREER_FAIR',
  LECTURE = 'LECTURE',
  QUIZ = 'QUIZ',
  DEBATE = 'DEBATE',
  
  // Corporate
  PRODUCT_LAUNCH = 'PRODUCT_LAUNCH',
  TOWN_HALL = 'TOWN_HALL',
  TEAM_BUILDING = 'TEAM_BUILDING',
  TRAINING = 'TRAINING',
  AWARDS_CEREMONY = 'AWARDS_CEREMONY',
  OFFSITE = 'OFFSITE',
  
  // Cultural & Social
  CULTURAL_FEST = 'CULTURAL_FEST',
  SPORTS_EVENT = 'SPORTS_EVENT',
  ALUMNI_MEET = 'ALUMNI_MEET',
  CONCERT = 'CONCERT',
  EXHIBITION = 'EXHIBITION',
  FESTIVAL = 'FESTIVAL',
  SOCIAL_GATHERING = 'SOCIAL_GATHERING',
  
  // Non-Profit
  FUNDRAISER = 'FUNDRAISER',
  GALA = 'GALA',
  CHARITY_EVENT = 'CHARITY_EVENT',
  VOLUNTEER_DRIVE = 'VOLUNTEER_DRIVE',
  AWARENESS_CAMPAIGN = 'AWARENESS_CAMPAIGN',
  
  OTHER = 'OTHER',
}

// ============================================
// Database-aligned Types (normalized schema)
// ============================================

/**
 * Event Venue - stored in event_venues table
 * Linked to events via event_id
 */
export interface EventVenue {
  id: string;
  eventId: string;
  name: string;
  address: string;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  capacity: number | null;
  accessibilityFeatures: string[];
  accessibilityNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Virtual Link Configuration - stored in event_virtual_links table
 * Linked to events via event_id
 */
export interface EventVirtualLink {
  id: string;
  eventId: string;
  platform: VirtualPlatform;
  meetingUrl: string;
  meetingId: string | null;
  password: string | null;
  instructions: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export type VirtualPlatform = 'zoom' | 'teams' | 'meet' | 'webex' | 'other';

/**
 * Event Image - stored in event_images table
 * Supports gallery functionality with ordering and captions
 */
export interface EventImage {
  id: string;
  eventId: string;
  imageUrl: string;
  caption: string | null;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Event FAQ - stored in event_faqs table
 * Supports collapsible FAQ sections on landing pages
 */
export interface EventFAQ {
  id: string;
  eventId: string;
  question: string;
  answer: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Branding Configuration (JSONB in events)
// ============================================

/**
 * Visual branding stored in events.branding JSONB column
 * Contains visual customization only after normalization
 */
export interface EventBranding {
  // Visual identity
  logoUrl?: string;
  bannerUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  customCss?: string;
  
  // Hero section customization
  heroSubtitle?: string;
  primaryCtaLabel?: string;
  secondaryCtaLabel?: string;
  
  // Template reference
  workspaceTemplateId?: string;
  
  // Legacy fields for backward compatibility
  // These are now stored in dedicated columns but kept here for fallback
  timezone?: string;
  registrationDeadline?: string;
  registrationType?: string;
  isFreeEvent?: boolean;
  allowWaitlist?: boolean;
  contactEmail?: string;
  contactPhone?: string;
  eventWebsite?: string;
  minAge?: number | null;
  maxAge?: number | null;
  language?: string;
  tags?: string[];
  metaDescription?: string;
  customSlug?: string;
  venue?: LegacyVenueConfig;
  virtualLinks?: LegacyVirtualConfig;
}

/** @deprecated Use EventVenue instead */
export interface LegacyVenueConfig {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  capacity?: number;
  facilities?: string[];
  accessibilityFeatures?: string[];
  accessibilityNotes?: string;
}

/** @deprecated Use EventVirtualLink instead */
export interface LegacyVirtualConfig {
  meetingUrl?: string;
  meetingId?: string;
  password?: string;
  platform?: VirtualPlatform;
  instructions?: string;
}

// ============================================
// Complete Event Entity
// ============================================

/**
 * Complete Event type aligned with normalized database schema
 * Includes all dedicated columns and related entities
 */
export interface Event {
  // Primary fields
  id: string;
  name: string;
  description: string;
  slug?: string | null;
  
  // Core configuration
  mode: EventMode;
  status: EventStatus;
  visibility: EventVisibility;
  category?: EventCategory | string | null;
  
  // Schedule
  startDate: string;
  endDate: string;
  timezone?: string;
  
  // Capacity & Registration (normalized columns - optional for backward compat)
  capacity?: number | null;
  registrationDeadline?: string | null;
  registrationType?: RegistrationType | string;
  isFree?: boolean;
  allowWaitlist?: boolean;
  
  // Contact information (normalized columns - optional)
  contactEmail?: string | null;
  contactPhone?: string | null;
  eventWebsite?: string | null;
  
  // Audience restrictions (normalized columns - optional)
  minAge?: number | null;
  maxAge?: number | null;
  language?: string | null;
  
  // Ownership
  organizerId: string;
  organizationId?: string | null;
  
  // Access control
  inviteLink: string | null;
  landingPageUrl: string;
  
  // Visual branding (JSONB)
  branding: EventBranding;
  
  // Canvas & Landing page builder
  canvasState?: any;
  landingPageData?: {
    html: string;
    css: string;
    meta?: {
      title?: string;
      description?: string;
    };
  } | null;
  
  // Related entities (from joined tables)
  venue?: EventVenue | null;
  virtualLinks?: EventVirtualLink[];
  images?: EventImage[];
  faqs?: EventFAQ[];
  
  // Rich content elements
  timeline?: TimelineItem[];
  agenda?: AgendaItem[];
  prizes?: PrizeInfo[];
  sponsors?: SponsorInfo[];
  
  // Organization reference
  organization?: EventOrganization | null;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Supporting Types
// ============================================

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  type: 'session' | 'break' | 'networking' | 'presentation';
  speaker?: string;
  location?: string;
}

export interface AgendaItem {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  speaker?: string;
  location?: string;
  materials?: string[];
}

export interface PrizeInfo {
  id: string;
  title: string;
  description: string;
  value?: string;
  position: number;
  category?: string;
}

export interface SponsorInfo {
  id: string;
  name: string;
  logoUrl: string;
  website?: string;
  tier: 'title' | 'platinum' | 'gold' | 'silver' | 'bronze';
  description?: string;
}

export interface EventOrganization {
  id: string;
  name: string;
  logoUrl?: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  branding?: {
    logoUrl?: string;
    bannerUrl?: string;
    primaryColor?: string;
  };
}

// ============================================
// DTOs for Create/Update Operations
// ============================================

/**
 * DTO for creating a new event
 */
export interface CreateEventDTO {
  name: string;
  description: string;
  mode: EventMode;
  visibility?: EventVisibility;
  category?: EventCategory;
  
  // Schedule
  startDate: string;
  endDate: string;
  timezone: string;
  
  // Registration
  capacity?: number;
  registrationDeadline?: string;
  registrationType?: RegistrationType;
  isFree?: boolean;
  allowWaitlist?: boolean;
  
  // Contact
  contactEmail?: string;
  contactPhone?: string;
  eventWebsite?: string;
  
  // Audience
  minAge?: number | null;
  maxAge?: number | null;
  language?: string;
  
  // Ownership
  organizationId?: string;
  
  // Branding
  branding?: Partial<EventBranding>;
  
  // Venue (for OFFLINE/HYBRID)
  venue?: CreateEventVenueDTO;
  
  // Virtual (for ONLINE/HYBRID)
  virtualLinks?: CreateEventVirtualLinkDTO[];
}

export interface CreateEventVenueDTO {
  name: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
  accessibilityFeatures?: string[];
  accessibilityNotes?: string;
}

export interface CreateEventVirtualLinkDTO {
  platform: VirtualPlatform;
  meetingUrl: string;
  meetingId?: string;
  password?: string;
  instructions?: string;
  isPrimary?: boolean;
}

export interface CreateEventImageDTO {
  imageUrl: string;
  caption?: string;
  sortOrder?: number;
  isPrimary?: boolean;
}

export interface CreateEventFAQDTO {
  question: string;
  answer: string;
  sortOrder?: number;
}

/**
 * DTO for updating an existing event
 */
export type UpdateEventDTO = Partial<CreateEventDTO>;

// ============================================
// Form-specific Types
// ============================================

/**
 * Form values for the EventFormPage component
 * Maps to the Zod schema validation
 */
export interface EventFormValues {
  // Basic info
  name: string;
  description: string;
  mode: 'ONLINE' | 'OFFLINE' | 'HYBRID';
  visibility?: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
  category?: string;
  organizationId: string;
  capacity?: string;
  
  // Registration settings
  registrationType?: 'OPEN' | 'INVITE_ONLY' | 'APPROVAL_REQUIRED';
  isFreeEvent?: boolean;
  allowWaitlist?: boolean;
  tags?: string;
  
  // SEO
  metaDescription?: string;
  customSlug?: string;
  
  // Accessibility
  accessibilityLanguage?: string;
  ageRestrictionEnabled?: boolean;
  minAge?: number | null;
  maxAge?: number | null;
  
  // Schedule
  startDate: string;
  endDate: string;
  registrationDeadline?: string;
  timezone: string;
  
  // Contact
  contactEmail?: string;
  contactPhone?: string;
  supportUrl?: string;
  eventWebsite?: string;
  
  // Venue (OFFLINE/HYBRID)
  venueName?: string;
  venueAddress?: string;
  venueCity?: string;
  venueState?: string;
  venueCountry?: string;
  venuePostalCode?: string;
  venueCapacity?: string;
  accessibilityFeatures?: string[];
  accessibilityNotes?: string;
  
  // Virtual (ONLINE/HYBRID)
  virtualPlatform?: string;
  virtualMeetingUrl?: string;
  virtualMeetingId?: string;
  virtualPassword?: string;
  virtualInstructions?: string;
  
  // Branding
  primaryColor?: string;
  logoUrl?: string;
  heroSubtitle?: string;
  bannerUrl?: string;
  primaryCtaLabel?: string;
  secondaryCtaLabel?: string;
  canvasState?: any;
}

// ============================================
// Utility Types
// ============================================

/**
 * Event with all related entities loaded
 */
export type EventWithRelations = Event & {
  venue: EventVenue | null;
  virtualLinks: EventVirtualLink[];
  images: EventImage[];
  faqs: EventFAQ[];
  organization: EventOrganization | null;
};

/**
 * Minimal event summary for lists/cards
 */
export interface EventSummary {
  id: string;
  name: string;
  slug: string | null;
  mode: EventMode;
  status: EventStatus;
  startDate: string;
  endDate: string;
  category: EventCategory | null;
  isFree: boolean;
  bannerUrl?: string;
  organizationName?: string;
}

/**
 * Event search/filter parameters
 */
export interface EventSearchParams {
  query?: string;
  category?: EventCategory;
  mode?: EventMode;
  status?: EventStatus;
  visibility?: EventVisibility;
  organizationId?: string;
  isFree?: boolean;
  startDateFrom?: string;
  startDateTo?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'startDate' | 'createdAt' | 'name';
  sortOrder?: 'asc' | 'desc';
}
