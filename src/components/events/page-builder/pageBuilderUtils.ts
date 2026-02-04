/**
 * Utility functions for the Event Page Builder
 */

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function extractTitleFromHtml(html: string): string | null {
  const match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  return match ? stripTags(match[1]) : null;
}

export function extractDescriptionFromHtml(html: string): string | null {
  const match = html.match(/<p[^>]*>(.*?)<\/p>/i);
  return match ? stripTags(match[1]) : null;
}

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, '').trim();
}
