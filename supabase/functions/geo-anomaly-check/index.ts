import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  validateAuth,
  checkRateLimit,
  validateUUID,
  sanitizeString,
  errorResponse,
  successResponse,
  logSecurityEvent,
} from "../_shared/security.ts";

interface LoginAttempt {
  id: string;
  user_id: string;
  ip_address_hash: string;
  location_country: string;
  location_city: string;
  location_lat: number;
  location_lng: number;
  created_at: string;
}

interface GeoAnomalyResult {
  isAnomaly: boolean;
  anomalyType: string | null;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  recommendations: string[];
}

interface GeoCheckRequest {
  userId: string;
  currentIpHash?: string;
  currentCountry?: string;
  currentCity?: string;
  currentLat?: number;
  currentLng?: number;
  userAgent?: string;
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Check for impossible travel (speed > 800 km/h is suspicious)
function checkImpossibleTravel(
  currentLat: number,
  currentLng: number,
  previousLat: number,
  previousLng: number,
  timeDiffHours: number
): { impossible: boolean; speed: number } {
  const distance = calculateDistance(currentLat, currentLng, previousLat, previousLng);
  const speed = timeDiffHours > 0 ? distance / timeDiffHours : 0;
  
  return {
    impossible: speed > 800,
    speed: Math.round(speed),
  };
}

function validateRequest(body: unknown): { valid: true; data: GeoCheckRequest } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const b = body as Record<string, unknown>;
  
  if (!b.userId || !validateUUID(b.userId)) {
    return { valid: false, error: 'Valid userId (UUID) is required' };
  }

  // Validate latitude/longitude if provided
  if (b.currentLat !== undefined) {
    if (typeof b.currentLat !== 'number' || b.currentLat < -90 || b.currentLat > 90) {
      return { valid: false, error: 'currentLat must be between -90 and 90' };
    }
  }
  if (b.currentLng !== undefined) {
    if (typeof b.currentLng !== 'number' || b.currentLng < -180 || b.currentLng > 180) {
      return { valid: false, error: 'currentLng must be between -180 and 180' };
    }
  }

  return {
    valid: true,
    data: {
      userId: b.userId as string,
      currentIpHash: sanitizeString(b.currentIpHash, 128),
      currentCountry: sanitizeString(b.currentCountry, 100),
      currentCity: sanitizeString(b.currentCity, 100),
      currentLat: b.currentLat as number | undefined,
      currentLng: b.currentLng as number | undefined,
      userAgent: sanitizeString(b.userAgent, 500),
    },
  };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ============= AUTHENTICATION =============
    const auth = await validateAuth(req);
    if (!auth.authenticated) {
      logSecurityEvent('geo_check_auth_failed', null, { reason: auth.error });
      return errorResponse('Unauthorized: ' + auth.error, 401, corsHeaders);
    }

    // ============= RATE LIMITING =============
    const rateCheck = checkRateLimit(auth.userId!, 'geo_anomaly_check', { maxRequests: 30, windowMs: 60000 });
    if (!rateCheck.allowed) {
      logSecurityEvent('geo_check_rate_limited', auth.userId, {});
      return errorResponse('Rate limit exceeded', 429, corsHeaders);
    }

    // ============= INPUT VALIDATION =============
    const body = await req.json();
    const validation = validateRequest(body);
    if (!validation.valid) {
      return errorResponse(validation.error, 400, corsHeaders);
    }

    const { userId, currentIpHash, currentCountry, currentCity, currentLat, currentLng, userAgent } = validation.data;

    // Security check: User can only check their own anomalies
    if (userId !== auth.userId) {
      logSecurityEvent('geo_check_unauthorized_user', auth.userId, { attemptedUserId: userId });
      return errorResponse('Cannot check anomalies for other users', 403, corsHeaders);
    }

    // ============= BUSINESS LOGIC =============
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get recent login attempts for this user
    const { data: recentLogins, error } = await supabase
      .from('login_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('success', true)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching login attempts:', error);
      throw error;
    }

    const result: GeoAnomalyResult = {
      isAnomaly: false,
      anomalyType: null,
      riskLevel: 'low',
      details: 'No anomalies detected',
      recommendations: [],
    };

    // If no previous logins, this is a new location (medium risk)
    if (!recentLogins || recentLogins.length === 0) {
      result.isAnomaly = true;
      result.anomalyType = 'new_location';
      result.riskLevel = 'medium';
      result.details = 'First login from this location';
      result.recommendations.push('Verify this is your device');
    } else {
      const lastLogin = recentLogins[0] as LoginAttempt;
      const timeDiff = (new Date().getTime() - new Date(lastLogin.created_at).getTime()) / (1000 * 60 * 60);

      // Check for new country
      if (currentCountry && lastLogin.location_country && currentCountry !== lastLogin.location_country) {
        result.isAnomaly = true;
        result.anomalyType = 'new_country';
        result.riskLevel = 'high';
        result.details = `Login from new country: ${currentCountry} (previous: ${lastLogin.location_country})`;
        result.recommendations.push('Confirm this login is legitimate');
        result.recommendations.push('Consider enabling 2FA if not already active');
      }

      // Check for impossible travel
      if (currentLat && currentLng && lastLogin.location_lat && lastLogin.location_lng) {
        const travelCheck = checkImpossibleTravel(
          currentLat,
          currentLng,
          Number(lastLogin.location_lat),
          Number(lastLogin.location_lng),
          timeDiff
        );

        if (travelCheck.impossible) {
          result.isAnomaly = true;
          result.anomalyType = 'impossible_travel';
          result.riskLevel = 'critical';
          result.details = `Impossible travel detected: ${travelCheck.speed} km/h required`;
          result.recommendations.push('This may indicate account compromise');
          result.recommendations.push('Review recent account activity');
          result.recommendations.push('Consider changing your password');
        }
      }

      // Check for new IP address
      if (currentIpHash && lastLogin.ip_address_hash && currentIpHash !== lastLogin.ip_address_hash) {
        const knownIp = recentLogins.some(l => (l as LoginAttempt).ip_address_hash === currentIpHash);
        if (!knownIp && !result.isAnomaly) {
          result.isAnomaly = true;
          result.anomalyType = 'new_ip';
          result.riskLevel = 'medium';
          result.details = 'Login from new IP address';
          result.recommendations.push('Verify this is your device');
        }
      }
    }

    // Log this login attempt
    await supabase.from('login_attempts').insert({
      user_id: userId,
      ip_address_hash: currentIpHash,
      user_agent: userAgent,
      location_country: currentCountry,
      location_city: currentCity,
      location_lat: currentLat,
      location_lng: currentLng,
      success: true,
    });

    // If high/critical risk, create a security notification
    if (result.riskLevel === 'high' || result.riskLevel === 'critical') {
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'security_alert',
        title: 'Unusual Login Detected',
        message: result.details,
        metadata: {
          anomalyType: result.anomalyType,
          riskLevel: result.riskLevel,
          location: currentCity ? `${currentCity}, ${currentCountry}` : currentCountry,
        },
      });

      await supabase.from('security_activity_logs').insert({
        user_id: userId,
        activity_type: 'suspicious_login',
        description: result.details,
        metadata: {
          anomalyType: result.anomalyType,
          riskLevel: result.riskLevel,
          ipHash: currentIpHash,
        },
      });

      logSecurityEvent('geo_anomaly_detected', userId, { 
        anomalyType: result.anomalyType, 
        riskLevel: result.riskLevel 
      });
    }

    return successResponse(result, corsHeaders);
  } catch (error: unknown) {
    console.error('Error in geo-anomaly-check:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500, corsHeaders);
  }
});
