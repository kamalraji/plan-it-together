/**
 * Event Query Keys Factory
 * Centralized query key management for all event-related queries
 * 
 * Industrial standard: TanStack Query key factory pattern
 * https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
 */

import type { RegistrationFilters } from '@/hooks/useEventRegistrations';

export interface EventFilters {
  organizationId?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AnalyticsFilters {
  range?: '7d' | '30d' | '90d' | 'all';
  chart?: 'registrations' | 'revenue' | 'checkins';
}

/**
 * Centralized event query keys following TanStack Query best practices
 */
export const eventQueryKeys = {
  // Base keys
  all: ['events'] as const,
  
  // List operations
  lists: () => [...eventQueryKeys.all, 'list'] as const,
  list: (filters?: EventFilters) => [...eventQueryKeys.lists(), filters] as const,
  
  // Detail operations
  details: () => [...eventQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventQueryKeys.details(), id] as const,
  
  // Event sub-resources
  registrations: (eventId: string, filters?: RegistrationFilters) => 
    [...eventQueryKeys.detail(eventId), 'registrations', filters] as const,
  
  registrationStats: (eventId: string) => 
    [...eventQueryKeys.detail(eventId), 'registration-stats'] as const,
  
  analytics: (eventId: string, filters?: AnalyticsFilters) => 
    [...eventQueryKeys.detail(eventId), 'analytics', filters] as const,
  
  timeline: (eventId: string) => 
    [...eventQueryKeys.detail(eventId), 'timeline'] as const,
  
  tierBreakdown: (eventId: string) => 
    [...eventQueryKeys.detail(eventId), 'tier-breakdown'] as const,
  
  attendees: (eventId: string) => 
    [...eventQueryKeys.detail(eventId), 'attendees'] as const,
  
  attendance: (eventId: string) => 
    [...eventQueryKeys.detail(eventId), 'attendance'] as const,
  
  attendanceHourly: (eventId: string) => 
    [...eventQueryKeys.attendance(eventId), 'hourly'] as const,
  
  tickets: (eventId: string) => 
    [...eventQueryKeys.detail(eventId), 'tickets'] as const,
  
  ticketTiers: (eventId: string) => 
    [...eventQueryKeys.tickets(eventId), 'tiers'] as const,
  
  sessions: (eventId: string) => 
    [...eventQueryKeys.detail(eventId), 'sessions'] as const,
  
  branding: (eventId: string) => 
    [...eventQueryKeys.detail(eventId), 'branding'] as const,
  
  settings: (eventId: string) => 
    [...eventQueryKeys.detail(eventId), 'settings'] as const,
  
  promoCodes: (eventId: string) => 
    [...eventQueryKeys.detail(eventId), 'promo-codes'] as const,
  
  waitlist: (eventId: string) => 
    [...eventQueryKeys.detail(eventId), 'waitlist'] as const,
  
  faqs: (eventId: string) => 
    [...eventQueryKeys.detail(eventId), 'faqs'] as const,
  
  // Drafts (user-scoped)
  drafts: () => [...eventQueryKeys.all, 'drafts'] as const,
  draft: (organizationId: string, eventId?: string) => 
    [...eventQueryKeys.drafts(), organizationId, eventId ?? 'new'] as const,
  
  // Page builder
  pageBuilder: (eventId: string) => 
    [...eventQueryKeys.detail(eventId), 'page-builder'] as const,
  
  // Public event access
  public: () => [...eventQueryKeys.all, 'public'] as const,
  publicDetail: (slug: string) => 
    [...eventQueryKeys.public(), slug] as const,
} as const;

// Type export for use in hooks
export type EventQueryKeys = typeof eventQueryKeys;
