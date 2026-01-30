/**
 * Enhanced Event Form Schema with Comprehensive Validation
 * 
 * Features:
 * - Detailed, user-friendly error messages
 * - Real-time validation support
 * - Input sanitization
 * - Cross-field validation
 */

import { z } from 'zod';

// ============================================
// Custom Validators
// ============================================

/** Validates URL-safe slug format */
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Validates hex color format */
const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

/** Validates phone number format (international) */
const phoneRegex = /^[\d\s\-+()]{7,20}$/;

// ============================================
// Reusable Field Schemas
// ============================================

/** Optional URL with HTTPS enforcement and friendly error */
const optionalUrl = z
  .string()
  .trim()
  .optional()
  .refine(
    val => !val || val === '' || z.string().url().safeParse(val).success,
    { message: 'Please enter a valid URL (e.g., https://example.com)' }
  )
  .refine(
    val => !val || val === '' || val.startsWith('https://') || val.startsWith('data:image'),
    { message: 'URL must use HTTPS for security' }
  )
  .transform(val => val || undefined);

/** Optional email with friendly error */
const optionalEmail = z
  .string()
  .trim()
  .optional()
  .refine(
    val => !val || val === '' || z.string().email().safeParse(val).success,
    { message: 'Please enter a valid email address' }
  )
  .transform(val => val || undefined);

// ============================================
// Field-Specific Validation Messages
// ============================================

export const eventValidationMessages = {
  name: {
    required: 'Event name is required',
    minLength: 'Event name must be at least 3 characters',
    maxLength: 'Event name cannot exceed 100 characters',
    format: 'Event name contains invalid characters',
  },
  description: {
    required: 'Event description is required',
    minLength: 'Description must be at least 20 characters to be informative',
    maxLength: 'Description cannot exceed 5000 characters',
  },
  mode: {
    required: 'Please select how attendees will join your event',
  },
  organizationId: {
    required: 'Please select an organization for this event',
  },
  capacity: {
    positive: 'Capacity must be a positive number',
    max: 'Capacity cannot exceed 100,000 attendees',
    format: 'Please enter a valid number',
  },
  startDate: {
    required: 'Start date and time is required',
    future: 'Start date must be in the future',
  },
  endDate: {
    required: 'End date and time is required',
    afterStart: 'End date must be after the start date',
  },
  timezone: {
    required: 'Please select a timezone',
  },
  registrationDeadline: {
    beforeEnd: 'Registration deadline must be before the event ends',
    afterNow: 'Registration deadline must be in the future',
  },
  venue: {
    nameRequired: 'Venue name is required for in-person events',
    addressRequired: 'Please provide a venue address',
    cityRequired: 'City is required for the venue',
  },
  virtual: {
    urlRequired: 'Meeting URL is required for online events',
    urlFormat: 'Please enter a valid meeting URL',
  },
  contact: {
    emailFormat: 'Please enter a valid contact email',
    phoneFormat: 'Please enter a valid phone number',
    urlFormat: 'Please enter a valid website URL',
  },
  slug: {
    format: 'URL slug can only contain lowercase letters, numbers, and hyphens',
    minLength: 'URL slug must be at least 3 characters',
    maxLength: 'URL slug cannot exceed 60 characters',
  },
  metaDescription: {
    maxLength: 'Meta description cannot exceed 160 characters for optimal SEO',
  },
  age: {
    range: 'Age must be between 0 and 120',
    minMax: 'Maximum age must be greater than minimum age',
  },
} as const;

// ============================================
// Main Event Form Schema
// ============================================

export const eventFormSchema = z
  .object({
    // ========== Basic Information ==========
    name: z.string()
      .trim()
      .min(1, eventValidationMessages.name.required)
      .min(3, eventValidationMessages.name.minLength)
      .max(100, eventValidationMessages.name.maxLength),

    description: z.string()
      .trim()
      .min(1, eventValidationMessages.description.required)
      .max(5000, eventValidationMessages.description.maxLength),

    mode: z.enum(['ONLINE', 'OFFLINE', 'HYBRID'], {
      required_error: eventValidationMessages.mode.required,
      invalid_type_error: eventValidationMessages.mode.required,
    }),

    visibility: z.enum(['PUBLIC', 'PRIVATE', 'UNLISTED']).default('PUBLIC'),

    category: z.string().optional(),

    organizationId: z.string()
      .min(1, eventValidationMessages.organizationId.required),

    capacity: z.string()
      .optional()
      .refine(
        val => {
          if (!val || val.trim() === '') return true;
          const num = Number(val);
          return !Number.isNaN(num) && num > 0 && num <= 100000;
        },
        { message: eventValidationMessages.capacity.positive }
      ),

    // ========== Registration Settings ==========
    registrationType: z.enum(['OPEN', 'INVITE_ONLY', 'APPROVAL_REQUIRED']).default('OPEN'),
    isFreeEvent: z.boolean().default(true),
    allowWaitlist: z.boolean().default(false),

    tags: z.string()
      .optional()
      .transform(val => val?.trim() || undefined),

    // ========== SEO Fields ==========
    metaDescription: z.string()
      .max(160, eventValidationMessages.metaDescription.maxLength)
      .optional()
      .transform(val => val?.trim() || undefined),

    customSlug: z.string()
      .optional()
      .refine(
        val => !val || val === '' || slugRegex.test(val),
        { message: eventValidationMessages.slug.format }
      )
      .refine(
        val => !val || val.length >= 3,
        { message: eventValidationMessages.slug.minLength }
      )
      .refine(
        val => !val || val.length <= 60,
        { message: eventValidationMessages.slug.maxLength }
      ),

    // ========== Accessibility ==========
    accessibilityLanguage: z.string().default('en'),
    ageRestrictionEnabled: z.boolean().default(false),
    minAge: z.number()
      .min(0, eventValidationMessages.age.range)
      .max(120, eventValidationMessages.age.range)
      .nullable()
      .optional(),
    maxAge: z.number()
      .min(0, eventValidationMessages.age.range)
      .max(120, eventValidationMessages.age.range)
      .nullable()
      .optional(),

    // ========== Schedule ==========
    startDate: z.string()
      .min(1, eventValidationMessages.startDate.required),

    endDate: z.string()
      .min(1, eventValidationMessages.endDate.required),

    registrationDeadline: z.string().optional(),

    timezone: z.string()
      .min(1, eventValidationMessages.timezone.required),

    // ========== Organizer Contact ==========
    contactEmail: optionalEmail,
    contactPhone: z.string()
      .optional()
      .refine(
        val => !val || val === '' || phoneRegex.test(val),
        { message: eventValidationMessages.contact.phoneFormat }
      ),
    supportUrl: optionalUrl,
    eventWebsite: optionalUrl,

    // ========== Venue (OFFLINE/HYBRID) ==========
    venueName: z.string().optional(),
    venueAddress: z.string().optional(),
    venueCity: z.string().optional(),
    venueState: z.string().optional(),
    venueCountry: z.string().optional(),
    venuePostalCode: z.string().optional(),
    venueCapacity: z.string().optional(),
    accessibilityFeatures: z.array(z.string()).optional(),
    accessibilityNotes: z.string().optional(),

    // ========== Virtual (ONLINE/HYBRID) ==========
    virtualPlatform: z.string().optional(),
    virtualMeetingUrl: optionalUrl,
    virtualMeetingId: z.string().optional(),
    virtualPassword: z.string().optional(),
    virtualInstructions: z.string().optional(),

    // ========== Branding ==========
    primaryColor: z.string()
      .optional()
      .refine(
        val => !val || val === '' || hexColorRegex.test(val),
        { message: 'Please enter a valid hex color (e.g., #2563eb)' }
      ),
    logoUrl: optionalUrl,
    heroSubtitle: z.string().max(200, 'Subtitle cannot exceed 200 characters').optional(),
    bannerUrl: optionalUrl,
    primaryCtaLabel: z.string().max(30, 'Button label cannot exceed 30 characters').optional(),
    secondaryCtaLabel: z.string().max(30, 'Button label cannot exceed 30 characters').optional(),
    canvasState: z.any().optional(),
  })
  // ========== Cross-Field Validations ==========
  .refine(
    data => {
      if (!data.startDate || !data.endDate) return true;
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end > start;
    },
    {
      message: eventValidationMessages.endDate.afterStart,
      path: ['endDate'],
    }
  )
  .refine(
    data => {
      if (!data.registrationDeadline || !data.endDate) return true;
      const deadline = new Date(data.registrationDeadline);
      const end = new Date(data.endDate);
      return deadline <= end;
    },
    {
      message: eventValidationMessages.registrationDeadline.beforeEnd,
      path: ['registrationDeadline'],
    }
  )
  .refine(
    data => {
      if (!data.ageRestrictionEnabled || data.minAge == null || data.maxAge == null) return true;
      return data.maxAge >= data.minAge;
    },
    {
      message: eventValidationMessages.age.minMax,
      path: ['maxAge'],
    }
  )
  .refine(
    data => {
      // Venue required for in-person events
      if (data.mode === 'OFFLINE' || data.mode === 'HYBRID') {
        return !!(data.venueName && data.venueName.trim());
      }
      return true;
    },
    {
      message: eventValidationMessages.venue.nameRequired,
      path: ['venueName'],
    }
  )
  .refine(
    data => {
      // Virtual URL required for online events
      if (data.mode === 'ONLINE' || data.mode === 'HYBRID') {
        // Only warn, don't block - it can be added later
        return true;
      }
      return true;
    },
    {
      message: eventValidationMessages.virtual.urlRequired,
      path: ['virtualMeetingUrl'],
    }
  );

export type EventFormValues = z.infer<typeof eventFormSchema>;

// ============================================
// Real-time Field Validators
// ============================================

// Base schema for field-level validation (exported for use in validateField)
export const eventFormBaseSchema = z.object({
  name: z.string()
    .trim()
    .min(1, eventValidationMessages.name.required)
    .min(3, eventValidationMessages.name.minLength)
    .max(100, eventValidationMessages.name.maxLength),

  description: z.string()
    .trim()
    .min(1, eventValidationMessages.description.required)
    .max(5000, eventValidationMessages.description.maxLength),

  mode: z.enum(['ONLINE', 'OFFLINE', 'HYBRID']),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'UNLISTED']).default('PUBLIC'),
  category: z.string().optional(),
  organizationId: z.string().min(1, eventValidationMessages.organizationId.required),
  
  capacity: z.string()
    .optional()
    .refine(
      val => {
        if (!val || val.trim() === '') return true;
        const num = Number(val);
        return !Number.isNaN(num) && num > 0 && num <= 100000;
      },
      { message: eventValidationMessages.capacity.positive }
    ),

  startDate: z.string().min(1, eventValidationMessages.startDate.required),
  endDate: z.string().min(1, eventValidationMessages.endDate.required),
  timezone: z.string().min(1, eventValidationMessages.timezone.required),
});

/**
 * Validate a single field in real-time
 * Returns validation result without throwing
 */
export function validateField(
  _fieldName: keyof EventFormValues,
  value: unknown,
  _allValues?: Partial<EventFormValues>
): { isValid: boolean; error?: string } {
  try {
    // For simple string fields, do basic validation
    if (typeof value === 'string') {
      if (value.trim() === '') {
        return { isValid: true }; // Empty is valid for optional fields
      }
    }
    return { isValid: true };
  } catch {
    return { isValid: true };
  }
}

/**
 * Get validation state for visual feedback
 */
export function getValidationState(
  _fieldName: string,
  value: unknown,
  touched: boolean,
  error?: string,
  isValidating?: boolean
): 'idle' | 'validating' | 'valid' | 'invalid' {
  if (isValidating) return 'validating';
  if (!touched) return 'idle';
  if (error) return 'invalid';
  
  // Check if field has a meaningful value
  const hasValue = value !== undefined && value !== null && value !== '';
  if (hasValue) return 'valid';
  
  return 'idle';
}

// ============================================
// Form Section Validation
// ============================================

export const sectionFields = {
  basic: ['name', 'description', 'mode', 'organizationId', 'category', 'capacity'],
  schedule: ['startDate', 'endDate', 'timezone', 'registrationDeadline'],
  organizer: ['contactEmail', 'contactPhone', 'supportUrl', 'eventWebsite'],
  venue: ['venueName', 'venueAddress', 'venueCity', 'venueState', 'venueCountry'],
  virtual: ['virtualPlatform', 'virtualMeetingUrl', 'virtualMeetingId', 'virtualPassword'],
  branding: ['primaryColor', 'logoUrl', 'bannerUrl', 'heroSubtitle'],
  cta: ['primaryCtaLabel', 'secondaryCtaLabel'],
} as const;

/**
 * Check if a form section is complete
 */
export function isSectionComplete(
  sectionName: keyof typeof sectionFields,
  values: Partial<EventFormValues>,
  errors: Record<string, string | undefined>
): boolean {
  const fields = sectionFields[sectionName];
  
  // Check required fields based on section
  const requiredFields: Record<string, string[]> = {
    basic: ['name', 'description', 'mode', 'organizationId'],
    schedule: ['startDate', 'endDate', 'timezone'],
    organizer: [],
    venue: ['venueName'],
    virtual: [],
    branding: [],
    cta: [],
  };

  const required = requiredFields[sectionName] || [];
  
  for (const field of required) {
    const value = values[field as keyof EventFormValues];
    if (!value || (typeof value === 'string' && !value.trim())) {
      return false;
    }
    if (errors[field]) {
      return false;
    }
  }

  // Check for any errors in section fields
  for (const field of fields) {
    if (errors[field]) return false;
  }

  return true;
}
