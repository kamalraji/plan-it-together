import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';

interface RichTextDisplayProps {
  content: string | null | undefined;
  className?: string;
  fallback?: string;
  /** Truncate to N lines using CSS line-clamp */
  lineClamp?: number;
}

const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'b', 'i', 'ul', 'ol', 'li', 'a', 'h2', 'h3', 'blockquote'];
const ALLOWED_ATTR = ['href', 'target', 'rel', 'class'];

export function RichTextDisplay({
  content,
  className,
  fallback = '',
  lineClamp,
}: RichTextDisplayProps) {
  if (!content) {
    return fallback ? <span className={className}>{fallback}</span> : null;
  }

  const sanitizedHtml = DOMPurify.sanitize(content, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });

  return (
    <div
      className={cn(
        'rich-text-display prose prose-sm dark:prose-invert max-w-none',
        '[&>p]:m-0 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0',
        lineClamp && `line-clamp-${lineClamp}`,
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}

/**
 * Strip all HTML tags from a string, returning plain text.
 * Useful for search/filtering operations on rich text content.
 */
export function stripHtmlTags(html: string): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
}
