/**
 * Type-safe Supabase query utilities
 * Provides wrappers that eliminate `as any` usage
 */

import { supabase } from '@/integrations/supabase/client';
import { AppError, ErrorCode, fromSupabaseError } from './errors';
import { logger } from './logger';

// =============================================================================
// QUERY ERROR HANDLING
// =============================================================================

/**
 * Handle a Supabase query error and throw an AppError
 */
export function handleQueryError(
  error: { message?: string; code?: string; details?: string } | null,
  context: string
): never {
  const appError = error 
    ? fromSupabaseError(error, { context })
    : new AppError('Unknown query error', ErrorCode.QUERY_ERROR, 500, { context });
  
  logger.error(`Query error in ${context}`, appError, { context });
  throw appError;
}

/**
 * Wrap a Supabase query with error handling
 */
export async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: { message?: string; code?: string } | null }>,
  context: string
): Promise<T> {
  const { data, error } = await queryFn();
  
  if (error) {
    handleQueryError(error, context);
  }
  
  if (data === null) {
    throw new AppError('No data returned', ErrorCode.NOT_FOUND, 404, { context });
  }
  
  return data;
}

/**
 * Wrap a Supabase query that may return null
 */
export async function safeQueryNullable<T>(
  queryFn: () => Promise<{ data: T | null; error: { message?: string; code?: string } | null }>,
  context: string
): Promise<T | null> {
  const { data, error } = await queryFn();
  
  if (error) {
    handleQueryError(error, context);
  }
  
  return data;
}

/**
 * Wrap a Supabase mutation with error handling
 */
export async function safeMutation<T>(
  mutationFn: () => Promise<{ data: T | null; error: { message?: string; code?: string } | null }>,
  context: string
): Promise<T> {
  const { data, error } = await mutationFn();
  
  if (error) {
    handleQueryError(error, context);
  }
  
  if (data === null) {
    throw new AppError('Mutation returned no data', ErrorCode.QUERY_ERROR, 500, { context });
  }
  
  return data;
}

// =============================================================================
// AUTH HELPERS
// =============================================================================

/**
 * Get current authenticated user or throw
 */
export async function requireAuth(): Promise<{ id: string; email?: string }> {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new AppError(
      'Authentication required',
      ErrorCode.UNAUTHORIZED,
      401,
      { error: error?.message }
    );
  }
  
  return { id: user.id, email: user.email };
}

/**
 * Get current user ID or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// =============================================================================
// PAGINATION HELPERS
// =============================================================================

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Calculate pagination range for Supabase query
 */
export function getPaginationRange(params: PaginationParams): { from: number; to: number } {
  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;
  return { from, to };
}

/**
 * Create paginated result from query data
 */
export function createPaginatedResult<T>(
  data: T[],
  totalCount: number,
  params: PaginationParams
): PaginatedResult<T> {
  const totalPages = Math.ceil(totalCount / params.pageSize);
  return {
    data,
    totalCount,
    page: params.page,
    pageSize: params.pageSize,
    totalPages,
    hasMore: params.page < totalPages,
  };
}

// =============================================================================
// BRANDING/JSON HELPERS
// =============================================================================

/**
 * Safely parse a JSON column value
 */
export function parseJsonColumn<T>(
  value: unknown,
  defaultValue: T
): T {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  
  if (typeof value === 'object') {
    return value as T;
  }
  
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return defaultValue;
    }
  }
  
  return defaultValue;
}

/**
 * Type for event branding JSON column
 */
export interface EventBranding {
  primaryColor?: string;
  accentColor?: string;
  logo?: string;
  banner?: string;
  favicon?: string;
  customCSS?: string;
  socialLinks?: Record<string, string>;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
  };
  registration?: {
    customFields?: Array<{
      id: string;
      label: string;
      type: string;
      required?: boolean;
      options?: string[];
    }>;
    termsUrl?: string;
    privacyUrl?: string;
  };
  [key: string]: unknown;
}

/**
 * Parse event branding column
 */
export function parseEventBranding(branding: unknown): EventBranding {
  return parseJsonColumn<EventBranding>(branding, {});
}

// =============================================================================
// RELATION EXTRACTORS
// =============================================================================

/**
 * Safely extract a nested relation from query result
 * Handles both single objects and arrays
 */
export function extractRelation<T>(
  data: T | T[] | null | undefined
): T | null {
  if (data === null || data === undefined) return null;
  if (Array.isArray(data)) return data[0] ?? null;
  return data;
}

/**
 * Safely extract array relation from query result
 */
export function extractArrayRelation<T>(
  data: T | T[] | null | undefined
): T[] {
  if (data === null || data === undefined) return [];
  if (Array.isArray(data)) return data;
  return [data];
}

/**
 * Type-safe property accessor for nested objects
 */
export function getNestedValue<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K
): T[K] | undefined {
  if (obj === null || obj === undefined) return undefined;
  return obj[key];
}
