import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  validateAuth,
  checkRateLimit,
  validateUUID,
  errorResponse,
  successResponse,
  logSecurityEvent,
} from "../_shared/security.ts";

// HaveIBeenPwned API uses k-anonymity: we only send first 5 chars of SHA1 hash
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

async function checkPasswordBreach(password: string): Promise<{ breached: boolean; count: number }> {
  const sha1Hash = await hashPassword(password);
  const prefix = sha1Hash.substring(0, 5);
  const suffix = sha1Hash.substring(5);

  try {
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'User-Agent': 'Thittam1Hub-Security-Check',
      },
    });

    if (!response.ok) {
      console.error('HaveIBeenPwned API error:', response.status);
      return { breached: false, count: 0 };
    }

    const text = await response.text();
    const lines = text.split('\n');

    for (const line of lines) {
      const [hashSuffix, countStr] = line.split(':');
      if (hashSuffix.trim() === suffix) {
        return { breached: true, count: parseInt(countStr.trim(), 10) };
      }
    }

    return { breached: false, count: 0 };
  } catch (error) {
    console.error('Error checking password breach:', error);
    return { breached: false, count: 0 };
  }
}

// Hash password for storage comparison (SHA-256)
async function hashForStorage(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

interface PasswordCheckRequest {
  password: string;
  userId?: string;
  checkHistory?: boolean;
}

function validateRequest(body: unknown): { valid: true; data: PasswordCheckRequest } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const b = body as Record<string, unknown>;

  if (!b.password || typeof b.password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }

  // Validate password length (reasonable limits)
  if (b.password.length < 1 || b.password.length > 128) {
    return { valid: false, error: 'Password must be between 1 and 128 characters' };
  }

  // Validate userId if provided
  if (b.userId !== undefined && !validateUUID(b.userId)) {
    return { valid: false, error: 'Invalid userId format' };
  }

  return {
    valid: true,
    data: {
      password: b.password as string,
      userId: b.userId as string | undefined,
      checkHistory: b.checkHistory === true,
    },
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ============= AUTHENTICATION =============
    const auth = await validateAuth(req);
    if (!auth.authenticated) {
      logSecurityEvent('password_breach_check_auth_failed', null, { reason: auth.error });
      return errorResponse('Unauthorized: ' + auth.error, 401, corsHeaders);
    }

    // ============= RATE LIMITING (stricter for password checks) =============
    const rateCheck = checkRateLimit(auth.userId!, 'password_breach_check', { maxRequests: 10, windowMs: 60000 });
    if (!rateCheck.allowed) {
      logSecurityEvent('password_breach_check_rate_limited', auth.userId, {});
      return errorResponse('Rate limit exceeded. Try again later.', 429, corsHeaders);
    }

    // ============= INPUT VALIDATION =============
    const body = await req.json();
    const validation = validateRequest(body);
    if (!validation.valid) {
      return errorResponse(validation.error, 400, corsHeaders);
    }

    const { password, userId, checkHistory } = validation.data;

    // Security check: User can only check their own password history
    if (userId && userId !== auth.userId) {
      logSecurityEvent('password_breach_check_unauthorized_user', auth.userId, { attemptedUserId: userId });
      return errorResponse('Cannot check password history for other users', 403, corsHeaders);
    }

    // ============= BUSINESS LOGIC =============
    // Check against HaveIBeenPwned
    const breachResult = await checkPasswordBreach(password);

    let historyMatch = false;
    let historyCount = 0;

    // Check against password history if userId provided
    if (userId && checkHistory) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const passwordHash = await hashForStorage(password);

      // Get last 5 passwords
      const { data: history, error } = await supabase
        .from('password_history')
        .select('password_hash')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && history) {
        for (const entry of history) {
          if (entry.password_hash === passwordHash) {
            historyMatch = true;
            historyCount++;
          }
        }
      }
    }

    const response = {
      breached: breachResult.breached,
      breachCount: breachResult.count,
      inHistory: historyMatch,
      historyMatches: historyCount,
      safe: !breachResult.breached && !historyMatch,
      recommendations: [] as string[],
    };

    if (breachResult.breached) {
      response.recommendations.push(
        `This password has appeared in ${breachResult.count.toLocaleString()} data breaches. Choose a different password.`
      );
    }

    if (historyMatch) {
      response.recommendations.push(
        'This password was recently used. Please choose a new password.'
      );
    }

    // Log the check (without the password!)
    logSecurityEvent('password_breach_checked', auth.userId, { 
      breached: breachResult.breached, 
      inHistory: historyMatch 
    });

    return successResponse(response, corsHeaders);
  } catch (error: unknown) {
    console.error('Error in check-password-breach:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500, corsHeaders);
  }
});
