import DOMPurify from 'dompurify';

/**
 * DOMPurify configuration for landing pages built with GrapesJS.
 * Allows common HTML elements used in page builders while blocking
 * script execution and dangerous attributes.
 */
const LANDING_PAGE_CONFIG = {
  ALLOWED_TAGS: [
    // Text content
    'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'a', 'img', 'ul', 'ol', 'li', 'br', 'hr', 'strong', 'em', 'b', 'i', 'u', 's',
    'blockquote', 'pre', 'code', 'sup', 'sub', 'small',
    // Semantic sections
    'section', 'article', 'header', 'footer', 'nav', 'aside', 'main', 'figure', 'figcaption',
    // Tables
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'caption', 'colgroup', 'col',
    // Forms (for landing page lead capture)
    'button', 'form', 'input', 'label', 'select', 'option', 'textarea', 'fieldset', 'legend',
    // Media
    'video', 'audio', 'source', 'picture',
    // Layout (common in GrapesJS)
    'address', 'dl', 'dt', 'dd', 'details', 'summary',
  ],
  ALLOWED_ATTR: [
    // Core attributes
    'class', 'id', 'style', 'title', 'lang', 'dir',
    // Links
    'href', 'target', 'rel', 'download',
    // Images/media
    'src', 'srcset', 'sizes', 'alt', 'width', 'height', 'loading', 'decoding',
    'poster', 'controls', 'autoplay', 'loop', 'muted', 'playsinline', 'preload',
    // Forms
    'type', 'name', 'value', 'placeholder', 'required', 'disabled', 'readonly',
    'checked', 'selected', 'multiple', 'min', 'max', 'step', 'pattern', 'maxlength',
    'for', 'action', 'method', 'enctype', 'autocomplete', 'autofocus',
    // Tables
    'colspan', 'rowspan', 'scope', 'headers',
    // Accessibility
    'role', 'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-hidden',
    'aria-expanded', 'aria-controls', 'aria-current', 'tabindex',
  ],
  // Allow data-* attributes for GrapesJS component tracking
  ALLOW_DATA_ATTR: true,
  // Allow safe URI schemes
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  // Explicitly forbid dangerous tags
  FORBID_TAGS: ['script', 'iframe', 'embed', 'object', 'base', 'link', 'meta', 'style', 'svg', 'math'],
  // Forbid event handlers and dangerous attributes
  FORBID_ATTR: [
    'onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout', 'onmouseenter', 'onmouseleave',
    'onfocus', 'onblur', 'onchange', 'oninput', 'onsubmit', 'onreset', 'onkeydown', 'onkeyup', 'onkeypress',
    'onscroll', 'onresize', 'oncontextmenu', 'ondblclick', 'ondrag', 'ondrop',
    'formaction', 'xlink:href', 'xmlns',
  ],
  // Return string instead of DOM node
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_TRUSTED_TYPE: false,
};

/**
 * Sanitize HTML content from GrapesJS landing page builder.
 * Removes script tags, event handlers, and other XSS vectors while
 * preserving the visual structure and styling classes.
 */
export function sanitizeLandingPageHTML(html: string): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, LANDING_PAGE_CONFIG) as string;
}

/**
 * Sanitize CSS content from GrapesJS landing page builder.
 * Removes dangerous patterns like @import, javascript: URLs,
 * and browser-specific expression syntax.
 */
export function sanitizeLandingPageCSS(css: string): string {
  if (!css) return '';
  
  let sanitized = css;
  
  // Remove @import to prevent loading external stylesheets
  sanitized = sanitized.replace(/@import\s+[^;]+;/gi, '/* @import removed */');
  
  // Remove @charset (not needed inline and could cause issues)
  sanitized = sanitized.replace(/@charset\s+[^;]+;/gi, '');
  
  // Remove javascript: protocol from url()
  sanitized = sanitized.replace(/url\s*\(\s*['"]?\s*javascript:/gi, 'url(about:invalid');
  
  // Remove data: URIs that could contain scripts (allow images)
  sanitized = sanitized.replace(/url\s*\(\s*['"]?\s*data:(?!image\/)/gi, 'url(about:invalid');
  
  // Remove expression() (IE-specific, XSS vector)
  sanitized = sanitized.replace(/expression\s*\(/gi, 'invalid(');
  
  // Remove behavior property (IE-specific, can load HTC files)
  sanitized = sanitized.replace(/behavior\s*:/gi, 'invalid:');
  
  // Remove -moz-binding (Firefox-specific, XBL injection)
  sanitized = sanitized.replace(/-moz-binding\s*:/gi, 'invalid:');
  
  // Remove -webkit-binding and similar
  sanitized = sanitized.replace(/-webkit-binding\s*:/gi, 'invalid:');
  
  // Remove @namespace (can be abused)
  sanitized = sanitized.replace(/@namespace\s+[^;{]+[;{]/gi, '/* @namespace removed */');
  
  return sanitized;
}

/**
 * Simple text sanitization for user-generated content
 * Use for: comments, task descriptions, announcements
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  }) as string;
}

/**
 * Email template sanitization
 * Allows more formatting but still prevents XSS
 */
export function sanitizeEmailContent(html: string): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'ul', 'ol', 'li', 'a',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'hr', 'span', 'div',
      'table', 'tr', 'td', 'th', 'thead', 'tbody', 'img',
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'class', 'style', 'src', 'alt', 'width', 'height',
      'align', 'valign', 'colspan', 'rowspan', 'border', 'cellpadding', 'cellspacing',
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    FORBID_TAGS: ['script', 'iframe', 'embed', 'object', 'base', 'link', 'meta'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    ALLOW_DATA_ATTR: false,
  }) as string;
}

/**
 * URL validation and sanitization
 * Returns sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  
  const trimmed = url.trim();
  
  // Allow relative paths
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }
  
  // Only allow HTTPS, HTTP, mailto, and tel protocols
  const allowedProtocols = ['https:', 'http:', 'mailto:', 'tel:'];
  
  try {
    const parsed = new URL(trimmed);
    if (allowedProtocols.includes(parsed.protocol)) {
      return parsed.toString();
    }
  } catch {
    // Invalid URL
  }
  
  return '';
}

/**
 * Validate that a URL uses HTTPS (for production resources)
 */
export function isSecureUrl(url: string): boolean {
  if (!url) return false;
  
  // Relative paths are considered secure
  if (url.startsWith('/') && !url.startsWith('//')) {
    return true;
  }
  
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate and sanitize external resource URLs
 * Use for: sponsor logos, speaker photos, resource attachments
 */
export function validateExternalUrl(
  url: string, 
  options?: { 
    requireHttps?: boolean;
    allowedDomains?: string[];
  }
): { valid: boolean; url: string; error?: string } {
  const { requireHttps = true, allowedDomains } = options || {};
  
  if (!url) {
    return { valid: false, url: '', error: 'URL is required' };
  }
  
  const sanitized = sanitizeUrl(url);
  
  if (!sanitized) {
    return { valid: false, url: '', error: 'Invalid URL format' };
  }
  
  // Relative paths don't need further validation
  if (sanitized.startsWith('/')) {
    return { valid: true, url: sanitized };
  }
  
  try {
    const parsed = new URL(sanitized);
    
    if (requireHttps && parsed.protocol !== 'https:') {
      return { valid: false, url: '', error: 'URL must use HTTPS' };
    }
    
    if (allowedDomains && allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some(domain => 
        parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
      );
      if (!isAllowed) {
        return { valid: false, url: '', error: `Domain not allowed. Allowed: ${allowedDomains.join(', ')}` };
      }
    }
    
    return { valid: true, url: sanitized };
  } catch {
    return { valid: false, url: '', error: 'Invalid URL' };
  }
}

/**
 * Strip all HTML tags from content (for plain text contexts)
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] }) as string;
}
