/**
 * useDeepLink Hook
 * Industrial-standard deep linking utilities for event navigation
 * 
 * Features:
 * - Generate shareable deep links to specific event states
 * - Parse deep link parameters on page load
 * - Support for tier selection, promo codes, section navigation
 */

import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

interface EventLinkOptions {
  /** Tab to navigate to (e.g., 'schedule', 'register') */
  tab?: string;
  /** Section ID for anchor navigation */
  section?: string;
  /** Ticket tier ID to pre-select */
  tier?: string;
  /** Promo code to pre-apply */
  promo?: string;
  /** Registration status filter */
  status?: string;
  /** Page number for pagination */
  page?: number;
}

interface WorkspaceLinkOptions {
  /** Tab to navigate to */
  tab?: string;
  /** Task ID to open in detail view */
  taskId?: string;
  /** View mode (kanban, list, calendar) */
  view?: string;
  /** Filter preset */
  filter?: string;
}

interface ParsedEventLink {
  tier: string | null;
  promo: string | null;
  section: string | null;
  tab: string | null;
  status: string | null;
  page: number | null;
}

interface ParsedWorkspaceLink {
  tab: string | null;
  taskId: string | null;
  view: string | null;
  filter: string | null;
}

/**
 * Hook for creating and parsing deep links
 */
export function useDeepLink() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  /**
   * Create a deep link to an event page
   */
  const createEventLink = useCallback((
    eventSlug: string, 
    options: EventLinkOptions = {}
  ): string => {
    const params = new URLSearchParams();
    
    if (options.tier) params.set('tier', options.tier);
    if (options.promo) params.set('promo', options.promo);
    if (options.status) params.set('status', options.status);
    if (options.page && options.page > 1) params.set('page', String(options.page));
    
    const base = `/event/${eventSlug}`;
    const path = options.tab ? `${base}/${options.tab}` : base;
    const query = params.toString() ? `?${params}` : '';
    const hash = options.section ? `#${options.section}` : '';
    
    return `${path}${query}${hash}`;
  }, []);

  /**
   * Create a deep link to a console event management page
   */
  const createEventManagementLink = useCallback((
    eventId: string,
    options: EventLinkOptions = {},
    orgSlug?: string
  ): string => {
    const params = new URLSearchParams();
    
    if (options.tab) params.set('tab', options.tab);
    if (options.status) params.set('status', options.status);
    if (options.page && options.page > 1) params.set('page', String(options.page));
    
    const base = orgSlug 
      ? `/${orgSlug}/eventmanagement/${eventId}`
      : `/console/events/${eventId}`;
    const query = params.toString() ? `?${params}` : '';
    
    return `${base}${query}`;
  }, []);

  /**
   * Create a deep link to a workspace
   */
  const createWorkspaceLink = useCallback((
    eventSlug: string,
    workspacePath: string,
    options: WorkspaceLinkOptions = {},
    orgSlug?: string
  ): string => {
    const params = new URLSearchParams();
    
    if (options.tab) params.set('tab', options.tab);
    if (options.taskId) params.set('taskId', options.taskId);
    if (options.view) params.set('view', options.view);
    if (options.filter) params.set('filter', options.filter);
    
    const base = orgSlug 
      ? `/${orgSlug}/workspaces/${eventSlug}/${workspacePath}`
      : `/dashboard/workspaces/${eventSlug}/${workspacePath}`;
    const query = params.toString() ? `?${params}` : '';
    
    return `${base}${query}`;
  }, []);

  /**
   * Create a shareable registration link with promo code
   */
  const createRegistrationLink = useCallback((
    eventSlug: string,
    options: { tier?: string; promo?: string } = {}
  ): string => {
    const params = new URLSearchParams();
    
    if (options.tier) params.set('tier', options.tier);
    if (options.promo) params.set('promo', options.promo);
    
    const query = params.toString() ? `?${params}` : '';
    
    return `/event/${eventSlug}/register${query}`;
  }, []);

  /**
   * Parse current event link parameters
   */
  const parseEventLink = useMemo((): ParsedEventLink => {
    const pageParam = searchParams.get('page');
    return {
      tier: searchParams.get('tier'),
      promo: searchParams.get('promo'),
      section: location.hash ? location.hash.slice(1) : null,
      tab: searchParams.get('tab'),
      status: searchParams.get('status'),
      page: pageParam ? Number(pageParam) : null,
    };
  }, [searchParams, location.hash]);

  /**
   * Parse current workspace link parameters
   */
  const parseWorkspaceLink = useMemo((): ParsedWorkspaceLink => {
    return {
      tab: searchParams.get('tab'),
      taskId: searchParams.get('taskId'),
      view: searchParams.get('view'),
      filter: searchParams.get('filter'),
    };
  }, [searchParams]);

  /**
   * Navigate to an event with deep link options
   */
  const navigateToEvent = useCallback((
    eventSlug: string,
    options: EventLinkOptions = {}
  ) => {
    navigate(createEventLink(eventSlug, options));
  }, [navigate, createEventLink]);

  /**
   * Navigate to event management with deep link options
   */
  const navigateToEventManagement = useCallback((
    eventId: string,
    options: EventLinkOptions = {},
    orgSlug?: string
  ) => {
    navigate(createEventManagementLink(eventId, options, orgSlug));
  }, [navigate, createEventManagementLink]);

  /**
   * Copy link to clipboard
   */
  const copyLinkToClipboard = useCallback(async (link: string): Promise<boolean> => {
    try {
      const fullUrl = `${window.location.origin}${link}`;
      await navigator.clipboard.writeText(fullUrl);
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    // Link creators
    createEventLink,
    createEventManagementLink,
    createWorkspaceLink,
    createRegistrationLink,
    
    // Parsers
    parseEventLink,
    parseWorkspaceLink,
    
    // Navigation
    navigateToEvent,
    navigateToEventManagement,
    
    // Utilities
    copyLinkToClipboard,
  };
}

export type { EventLinkOptions, WorkspaceLinkOptions, ParsedEventLink, ParsedWorkspaceLink };
