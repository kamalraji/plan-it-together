import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";
import {
  corsHeaders,
  validateAuth,
  checkRateLimit,
  errorResponse,
  successResponse,
  logSecurityEvent,
} from "../_shared/security.ts";

interface LinkPreview {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  favicon: string | null;
  domain: string | null;
}

// Blocklist of internal/private IP ranges to prevent SSRF
const BLOCKED_HOSTS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^0\./,
  /^::1$/,
  /^fe80:/i,
  /^fc00:/i,
  /^fd00:/i,
];

function isBlockedHost(hostname: string): boolean {
  return BLOCKED_HOSTS.some(pattern => pattern.test(hostname));
}

function getMetaContent(doc: ReturnType<typeof DOMParser.prototype.parseFromString>, selectors: string[]): string | null {
  for (const selector of selectors) {
    const element = doc?.querySelector(selector);
    if (element) {
      const content = element.getAttribute('content') || element.textContent;
      if (content?.trim()) {
        return content.trim();
      }
    }
  }
  return null;
}

function resolveUrl(base: string, relative: string | null): string | null {
  if (!relative) return null;
  try {
    if (relative.startsWith('http://') || relative.startsWith('https://')) {
      return relative;
    }
    if (relative.startsWith('//')) {
      return 'https:' + relative;
    }
    const baseUrl = new URL(base);
    if (relative.startsWith('/')) {
      return `${baseUrl.protocol}//${baseUrl.host}${relative}`;
    }
    return new URL(relative, base).href;
  } catch {
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ============= AUTHENTICATION =============
    const auth = await validateAuth(req);
    if (!auth.authenticated) {
      logSecurityEvent('link_preview_auth_failed', null, { reason: auth.error });
      return errorResponse('Unauthorized: ' + auth.error, 401, corsHeaders);
    }

    // ============= RATE LIMITING =============
    const rateCheck = checkRateLimit(auth.userId!, 'link_preview', { maxRequests: 30, windowMs: 60000 });
    if (!rateCheck.allowed) {
      logSecurityEvent('link_preview_rate_limited', auth.userId, {});
      return errorResponse('Rate limit exceeded', 429, corsHeaders);
    }

    // ============= INPUT VALIDATION =============
    const { url } = await req.json();
    
    if (!url || typeof url !== 'string') {
      return errorResponse('URL is required', 400, corsHeaders);
    }

    // Validate URL format
    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
    } catch {
      return errorResponse('Invalid URL format', 400, corsHeaders);
    }

    // Security: Only allow http/https protocols
    if (!['http:', 'https:'].includes(targetUrl.protocol)) {
      return errorResponse('Only HTTP and HTTPS URLs are allowed', 400, corsHeaders);
    }

    // Security: Block internal/private IPs (SSRF prevention)
    if (isBlockedHost(targetUrl.hostname)) {
      logSecurityEvent('link_preview_ssrf_blocked', auth.userId, { hostname: targetUrl.hostname });
      return errorResponse('URL not allowed', 400, corsHeaders);
    }

    console.log(`Fetching link preview for: ${url}`);

    // ============= BUSINESS LOGIC =============
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkPreviewBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    
    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`Failed to fetch URL: ${response.status}`);
      return errorResponse(`Failed to fetch URL: ${response.status}`, response.status, corsHeaders);
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    if (!doc) {
      return errorResponse('Failed to parse HTML', 500, corsHeaders);
    }

    // Extract Open Graph and standard meta tags
    const title = getMetaContent(doc, [
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
      'title',
    ]);

    const description = getMetaContent(doc, [
      'meta[property="og:description"]',
      'meta[name="twitter:description"]',
      'meta[name="description"]',
    ]);

    const image = resolveUrl(url, getMetaContent(doc, [
      'meta[property="og:image"]',
      'meta[property="og:image:url"]',
      'meta[name="twitter:image"]',
      'meta[name="twitter:image:src"]',
    ]));

    const siteName = getMetaContent(doc, [
      'meta[property="og:site_name"]',
      'meta[name="application-name"]',
    ]) || targetUrl.hostname;

    // Extract favicon
    let favicon = resolveUrl(url, getMetaContent(doc, [
      'link[rel="icon"]',
      'link[rel="shortcut icon"]',
      'link[rel="apple-touch-icon"]',
    ]));
    
    // Default favicon path
    if (!favicon) {
      favicon = `${targetUrl.protocol}//${targetUrl.host}/favicon.ico`;
    }

    const preview: LinkPreview = {
      url,
      title: title?.substring(0, 200) || null,
      description: description?.substring(0, 500) || null,
      image,
      siteName,
      favicon,
      domain: targetUrl.hostname,
    };

    console.log(`Link preview extracted: title="${title?.substring(0, 50)}..."`);

    return successResponse(preview, corsHeaders);
  } catch (error: unknown) {
    console.error('Error in link-preview:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return errorResponse('Request timeout', 504, corsHeaders);
    }
    
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse('Internal server error: ' + message, 500, corsHeaders);
  }
});
