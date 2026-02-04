import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders,
  validateAuth,
  checkRateLimit,
  sanitizeString,
  errorResponse,
  successResponse,
  logSecurityEvent,
} from "../_shared/security.ts";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ============= AUTHENTICATION =============
    const auth = await validateAuth(req);
    if (!auth.authenticated) {
      logSecurityEvent('giphy_proxy_auth_failed', null, { reason: auth.error });
      return errorResponse('Unauthorized: ' + auth.error, 401, corsHeaders);
    }

    // ============= RATE LIMITING =============
    const rateCheck = checkRateLimit(auth.userId!, 'giphy_proxy', { maxRequests: 60, windowMs: 60000 });
    if (!rateCheck.allowed) {
      logSecurityEvent('giphy_proxy_rate_limited', auth.userId, {});
      return errorResponse('Rate limit exceeded', 429, corsHeaders);
    }

    // ============= INPUT VALIDATION =============
    const GIPHY_API_KEY = Deno.env.get('GIPHY_API_KEY');
    
    if (!GIPHY_API_KEY) {
      console.error('GIPHY_API_KEY not configured');
      return errorResponse('Giphy API key not configured', 500, corsHeaders);
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'trending';
    const query = sanitizeString(url.searchParams.get('q') || '', 100);
    
    // Validate and sanitize limit/offset
    let limit = parseInt(url.searchParams.get('limit') || '25', 10);
    let offset = parseInt(url.searchParams.get('offset') || '0', 10);
    
    // Clamp values to reasonable ranges
    limit = Math.max(1, Math.min(limit, 50));
    offset = Math.max(0, Math.min(offset, 4999));
    
    const rating = 'pg-13';

    // ============= BUSINESS LOGIC =============
    let giphyUrl: string;
    
    if (action === 'search' && query) {
      giphyUrl = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&rating=${rating}&lang=en`;
    } else {
      giphyUrl = `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=${limit}&offset=${offset}&rating=${rating}`;
    }

    console.log(`Fetching from Giphy: action=${action}, query=${query}, limit=${limit}, offset=${offset}`);
    
    const response = await fetch(giphyUrl);
    const data = await response.json();

    if (!response.ok) {
      console.error('Giphy API error:', data);
      return errorResponse('Failed to fetch from Giphy', response.status, corsHeaders);
    }

    console.log(`Giphy returned ${data.data?.length || 0} results`);

    return successResponse(data, corsHeaders);
  } catch (error: unknown) {
    console.error('Error in giphy-proxy:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse('Internal server error: ' + message, 500, corsHeaders);
  }
});
