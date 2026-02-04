import { useEffect } from 'react';

interface JsonLdFactory {
  (canonicalUrl: string): unknown;
}

interface UseSeoOptions {
  title: string;
  description: string;
  /** Path part of the canonical URL, e.g. "/" or "/login" */
  canonicalPath: string;
  /** Path to an OG/Twitter image, e.g. "/images/thittam1hub-og.png" */
  ogImagePath?: string;
  /** Schema.org JSON-LD factory for this page. Receives the resolved canonical URL. */
  jsonLdId?: string;
  jsonLdFactory?: JsonLdFactory;
  /** Open Graph type, defaults to `website`. */
  ogType?: 'website' | 'article';
}

function upsertMetaByName(name: string, content: string) {
  let meta = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', name);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

function upsertMetaByProperty(property: string, content: string) {
  let meta = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('property', property);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

function upsertLinkRel(rel: string, href: string) {
  let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

export function useSeo({
  title,
  description,
  canonicalPath,
  ogImagePath,
  jsonLdId,
  jsonLdFactory,
  ogType = 'website',
}: UseSeoOptions) {
  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;

    const canonicalUrl = `${window.location.origin}${canonicalPath}`;
    const imageUrl = `${window.location.origin}${ogImagePath || '/placeholder.svg'}`;

    // Basic SEO
    document.title = title;
    upsertMetaByName('description', description);

    // Open Graph
    upsertMetaByProperty('og:title', title);
    upsertMetaByProperty('og:description', description);
    upsertMetaByProperty('og:url', canonicalUrl);
    upsertMetaByProperty('og:type', ogType);
    upsertMetaByProperty('og:image', imageUrl);

    // Twitter cards (standard large image summary)
    upsertMetaByName('twitter:card', 'summary_large_image');
    upsertMetaByName('twitter:title', title);
    upsertMetaByName('twitter:description', description);
    upsertMetaByName('twitter:image', imageUrl);

    // Canonical link
    upsertLinkRel('canonical', canonicalUrl);

    // Optional JSON-LD structured data
    if (jsonLdFactory && jsonLdId) {
      const existing = document.getElementById(jsonLdId);
      if (existing) {
        existing.remove();
      }

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = jsonLdId;
      script.text = JSON.stringify(jsonLdFactory(canonicalUrl));
      document.head.appendChild(script);
    }
  }, [
    title,
    description,
    canonicalPath,
    ogImagePath,
    jsonLdFactory,
    jsonLdId,
    ogType,
  ]);
}
