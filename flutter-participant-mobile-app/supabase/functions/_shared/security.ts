// ==============================================
// SHARED SECURITY UTILITIES FOR EDGE FUNCTIONS
// Industrial best practices: JWT validation, rate limiting, input validation
// ==============================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============= CORS CONFIGURATION =============
const ALLOWED_ORIGINS = [
  'https://id-preview--b4163da6-6707-4f04-a726-1e32f19b9042.lovable.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

export function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.some(o => origin.startsWith(o.replace('https://', '').replace('http://', '')))
    ? origin 
    : ALLOWED_ORIGINS[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}

// Legacy CORS headers for backward compatibility
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============= RATE LIMITING =============
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60000, // 1 minute
};

export function checkRateLimit(
  identifier: string,
  action: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): { allowed: boolean; remaining: number; resetAt: number } {
  const key = `${action}:${identifier}`;
  const now = Date.now();
  
  // Clean up old entries periodically
  if (Math.random() < 0.01) {
    cleanupRateLimits();
  }
  
  const entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetAt) {
    // New window
    const resetAt = now + config.windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt };
  }
  
  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }
  
  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}

function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// ============= JWT AUTHENTICATION =============
export interface AuthResult {
  authenticated: boolean;
  userId: string | null;
  email: string | null;
  error: string | null;
}

export async function validateAuth(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      authenticated: false,
      userId: null,
      email: null,
      error: 'Missing or invalid authorization header',
    };
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase configuration');
    return {
      authenticated: false,
      userId: null,
      email: null,
      error: 'Server configuration error',
    };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  try {
    const token = authHeader.replace('Bearer ', '');
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return {
        authenticated: false,
        userId: null,
        email: null,
        error: error?.message || 'Invalid token',
      };
    }

    return {
      authenticated: true,
      userId: data.user.id,
      email: data.user.email || null,
      error: null,
    };
  } catch (err) {
    console.error('Auth validation error:', err);
    return {
      authenticated: false,
      userId: null,
      email: null,
      error: 'Authentication failed',
    };
  }
}

// ============= INPUT VALIDATION =============
export function sanitizeString(value: unknown, maxLength: number = 500): string {
  if (typeof value !== 'string') return '';
  return value
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Basic XSS prevention
}

export function validateUUID(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

export function validateEmail(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value) && value.length <= 255;
}

export function validateChannelName(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  // Agora channel names: 1-64 chars, alphanumeric + underscore/hyphen
  return /^[a-zA-Z0-9_-]{1,64}$/.test(value);
}

// ============= RESPONSE HELPERS =============
export function errorResponse(
  message: string,
  status: number,
  headers: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...headers, 'Content-Type': 'application/json' } }
  );
}

export function successResponse(
  data: unknown,
  headers: Record<string, string>
): Response {
  return new Response(
    JSON.stringify(data),
    { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } }
  );
}

// ============= LOGGING & OBSERVABILITY =============

export interface LogContext {
  functionName: string;
  userId?: string | null;
  requestId?: string;
  startTime?: number;
}

let currentContext: LogContext | null = null;

export function initRequestContext(functionName: string, userId?: string | null): string {
  const requestId = crypto.randomUUID().slice(0, 8);
  currentContext = {
    functionName,
    userId,
    requestId,
    startTime: Date.now(),
  };
  return requestId;
}

export function logSecurityEvent(
  action: string,
  userId: string | null,
  metadata: Record<string, unknown>
): void {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    type: 'security',
    action,
    userId,
    requestId: currentContext?.requestId,
    functionName: currentContext?.functionName,
    ...metadata,
  }));
}

export function logInfo(message: string, metadata?: Record<string, unknown>): void {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'info',
    message,
    requestId: currentContext?.requestId,
    functionName: currentContext?.functionName,
    ...metadata,
  }));
}

export function logWarning(message: string, metadata?: Record<string, unknown>): void {
  console.warn(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'warn',
    message,
    requestId: currentContext?.requestId,
    functionName: currentContext?.functionName,
    ...metadata,
  }));
}

export function logError(message: string, error?: unknown, metadata?: Record<string, unknown>): void {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'error',
    message,
    error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
    requestId: currentContext?.requestId,
    functionName: currentContext?.functionName,
    ...metadata,
  }));
}

export function logRequestComplete(status: number, metadata?: Record<string, unknown>): void {
  const durationMs = currentContext?.startTime ? Date.now() - currentContext.startTime : undefined;
  const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
  
  console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    type: 'request_complete',
    status,
    durationMs,
    requestId: currentContext?.requestId,
    functionName: currentContext?.functionName,
    userId: currentContext?.userId,
    slow: durationMs && durationMs > 1000,
    ...metadata,
  }));
  
  currentContext = null;
}

// Performance threshold check
export function checkSlowOperation(operationName: string, startTime: number, thresholdMs: number = 500): void {
  const duration = Date.now() - startTime;
  if (duration > thresholdMs) {
    logWarning(`SLOW: ${operationName} took ${duration}ms`, {
      operation: operationName,
      durationMs: duration,
      thresholdMs,
    });
  }
}
