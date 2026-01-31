
# Fix: Event Description Displaying Raw HTML Tags

## Problem Summary

The event "symposium" displays `<p> testing</p>` as raw text instead of rendering it as formatted HTML. This occurs because:

1. The event description field uses TipTap RichTextEditor (outputs HTML)
2. The HTML is stored in the database (e.g., `<p>Testing</p>`)
3. Components render descriptions as plain text using `{event.description}`, showing raw HTML tags

## Root Cause Analysis

**Database content for "Symposium" event:**
```json
{
  "name": "Symposium",
  "description": "<p>Testing</p>"
}
```

**Current rendering (broken):**
```tsx
<p className="text-sm text-muted-foreground">
  {event.description}  // Shows: <p>Testing</p>
</p>
```

---

## Solution Overview

Create a reusable `RichTextDisplay` component that safely renders HTML content using `dangerouslySetInnerHTML` with DOMPurify sanitization, then update all affected components.

---

## Implementation Details

### 1. Create RichTextDisplay Component

Create `src/components/ui/rich-text-display.tsx`:

```tsx
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
        lineClamp && `line-clamp-${lineClamp}`,
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}

export function stripHtmlTags(html: string): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
}
```

### 2. Update Affected Components

Replace `{event.description}` with `<RichTextDisplay content={event.description} />` in:

| Component | Location | Change |
|-----------|----------|--------|
| `FlagshipEventCard.tsx` | Line 155-157 | Use `RichTextDisplay` with `lineClamp={2}` |
| `ParticipantEventsPage.tsx` | Line 651-652 | Use `RichTextDisplay` with `lineClamp={2}` |
| `EventLandingPage.tsx` | Line 311, 453 | Use `RichTextDisplay` for full description |
| `EventDetailPage.tsx` | Line 358 | Use `RichTextDisplay` for event description |
| `EventListPage.tsx` | Lines 410, 469 | Use `RichTextDisplay` with `lineClamp={2}` |
| `ParticipantDashboard.tsx` | Lines 648, 782, 1052 | Use `RichTextDisplay` with `lineClamp={2}` |
| `VendorCoordination.tsx` | Line 217 | Use `RichTextDisplay` |

### 3. Update Search Functionality

For components that search event descriptions, use `stripHtmlTags` to search plain text:

```tsx
// Before
event.description?.toLowerCase().includes(searchQuery.toLowerCase())

// After
import { stripHtmlTags } from '@/components/ui/rich-text-display';
stripHtmlTags(event.description ?? '').toLowerCase().includes(searchQuery.toLowerCase())
```

Affected files:
- `ParticipantEventsPage.tsx` (line 180-181)
- `EventListPage.tsx` (line 100)
- `ParticipantDashboard.tsx` (line 243)

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/ui/rich-text-display.tsx` | Reusable HTML-safe description renderer |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/landing/FlagshipEventCard.tsx` | Import and use `RichTextDisplay` |
| `src/components/events/ParticipantEventsPage.tsx` | Import `RichTextDisplay`, update rendering and search |
| `src/components/events/EventLandingPage.tsx` | Use `RichTextDisplay` for description sections |
| `src/components/routing/services/EventDetailPage.tsx` | Use `RichTextDisplay` |
| `src/components/routing/services/EventListPage.tsx` | Use `RichTextDisplay`, update search |
| `src/components/dashboard/ParticipantDashboard.tsx` | Use `RichTextDisplay`, update search |
| `src/components/marketplace/VendorCoordination.tsx` | Use `RichTextDisplay` |

---

## Code Examples

### FlagshipEventCard.tsx (Before)
```tsx
{event.description && (
  <p className="text-sm text-muted-foreground line-clamp-2">
    {event.description}
  </p>
)}
```

### FlagshipEventCard.tsx (After)
```tsx
import { RichTextDisplay } from '@/components/ui/rich-text-display';

{event.description && (
  <RichTextDisplay 
    content={event.description} 
    lineClamp={2}
    className="text-sm text-muted-foreground"
  />
)}
```

---

## Technical Notes

### Security
- Uses DOMPurify with strict allowlist matching `sanitizeText()` in `src/utils/sanitize.ts`
- Only allows safe tags: `p`, `br`, `strong`, `em`, `b`, `i`, `ul`, `ol`, `li`, `a`
- Strips all event handlers and dangerous attributes

### Tailwind CSS
- Uses `@tailwindcss/typography` plugin's `prose` classes for consistent styling
- `line-clamp-*` utilities for truncation

### Performance
- Minimal overhead: DOMPurify is already bundled and used elsewhere
- No additional network requests

---

## Testing Checklist

- [ ] Create an event with rich text description (bold, lists, links)
- [ ] Verify description renders correctly in Flagship Events Carousel
- [ ] Verify description renders correctly on Participant Events Page
- [ ] Verify description renders correctly on Event Landing Page
- [ ] Verify search still works with HTML-containing descriptions
- [ ] Verify XSS protection (try inserting `<script>alert('xss')</script>`)
