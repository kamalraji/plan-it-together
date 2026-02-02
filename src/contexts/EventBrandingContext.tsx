import React, { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EventBranding {
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  bannerUrl?: string;
  heroSubtitle?: string;
  primaryCtaLabel?: string;
  secondaryCtaLabel?: string;
  customCss?: string;
  // Social links
  socialLinks?: {
    website?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    facebook?: string;
  };
  // SEO
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
  };
  // Registration settings
  registration?: {
    type?: 'open' | 'approval' | 'invite_only';
    waitlistEnabled?: boolean;
    groupTicketsEnabled?: boolean;
    maxGroupSize?: number;
  };
  // Accessibility
  accessibility?: {
    signLanguageAvailable?: boolean;
    wheelchairAccessible?: boolean;
    audioDescriptionAvailable?: boolean;
    closedCaptioningAvailable?: boolean;
  };
}

interface EventBrandingContextValue {
  branding: EventBranding | null;
  isLoading: boolean;
  eventId: string | null;
  eventName: string | null;
  // Computed CSS variables for easy consumption
  cssVariables: React.CSSProperties;
}

const EventBrandingContext = createContext<EventBrandingContextValue>({
  branding: null,
  isLoading: false,
  eventId: null,
  eventName: null,
  cssVariables: {},
});

interface EventBrandingProviderProps {
  eventId: string;
  children: React.ReactNode;
  /**
   * Optional fallback branding to use while loading or if no branding is set
   */
  fallbackBranding?: Partial<EventBranding>;
}

function parseHslFromHex(hex: string): string | null {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  
  if (cleanHex.length !== 6) return null;
  
  const r = parseInt(cleanHex.slice(0, 2), 16) / 255;
  const g = parseInt(cleanHex.slice(2, 4), 16) / 255;
  const b = parseInt(cleanHex.slice(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function EventBrandingProvider({
  eventId,
  children,
  fallbackBranding = {},
}: EventBrandingProviderProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['event-branding-context', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, branding')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const branding = useMemo(() => {
    if (!data?.branding) return fallbackBranding as EventBranding;
    
    const rawBranding = data.branding as Record<string, any>;
    
    return {
      primaryColor: rawBranding.primaryColor,
      secondaryColor: rawBranding.secondaryColor,
      logoUrl: rawBranding.logoUrl,
      bannerUrl: rawBranding.bannerUrl,
      heroSubtitle: rawBranding.heroSubtitle,
      primaryCtaLabel: rawBranding.primaryCtaLabel,
      secondaryCtaLabel: rawBranding.secondaryCtaLabel,
      customCss: rawBranding.customCss,
      socialLinks: rawBranding.socialLinks,
      seo: rawBranding.seo,
      registration: rawBranding.registration,
      accessibility: rawBranding.accessibility,
      ...fallbackBranding,
    } as EventBranding;
  }, [data?.branding, fallbackBranding]);

  const cssVariables = useMemo((): React.CSSProperties => {
    const vars: Record<string, string> = {};
    
    if (branding?.primaryColor) {
      const hsl = parseHslFromHex(branding.primaryColor);
      if (hsl) {
        vars['--event-primary'] = hsl;
        vars['--event-primary-foreground'] = '0 0% 100%';
      }
    }
    
    if (branding?.secondaryColor) {
      const hsl = parseHslFromHex(branding.secondaryColor);
      if (hsl) {
        vars['--event-secondary'] = hsl;
        vars['--event-secondary-foreground'] = '0 0% 100%';
      }
    }
    
    return vars as React.CSSProperties;
  }, [branding]);

  const contextValue = useMemo(
    () => ({
      branding,
      isLoading,
      eventId: data?.id ?? null,
      eventName: data?.name ?? null,
      cssVariables,
    }),
    [branding, isLoading, data, cssVariables]
  );

  return (
    <EventBrandingContext.Provider value={contextValue}>
      <div style={cssVariables}>{children}</div>
    </EventBrandingContext.Provider>
  );
}

export function useEventBranding() {
  const context = useContext(EventBrandingContext);
  return context;
}

/**
 * Hook to get a specific branding property with fallback
 */
export function useEventBrandingValue<K extends keyof EventBranding>(
  key: K,
  fallback?: EventBranding[K]
): EventBranding[K] | undefined {
  const { branding } = useEventBranding();
  return branding?.[key] ?? fallback;
}

/**
 * Hook to check if event has specific accessibility features
 */
export function useEventAccessibility() {
  const { branding } = useEventBranding();
  
  return {
    signLanguageAvailable: branding?.accessibility?.signLanguageAvailable ?? false,
    wheelchairAccessible: branding?.accessibility?.wheelchairAccessible ?? false,
    audioDescriptionAvailable: branding?.accessibility?.audioDescriptionAvailable ?? false,
    closedCaptioningAvailable: branding?.accessibility?.closedCaptioningAvailable ?? false,
    hasAnyAccessibilityFeatures: Object.values(branding?.accessibility ?? {}).some(Boolean),
  };
}

/**
 * Hook to get registration settings
 */
export function useEventRegistrationSettings() {
  const { branding } = useEventBranding();
  
  return {
    type: branding?.registration?.type ?? 'open',
    waitlistEnabled: branding?.registration?.waitlistEnabled ?? false,
    groupTicketsEnabled: branding?.registration?.groupTicketsEnabled ?? false,
    maxGroupSize: branding?.registration?.maxGroupSize ?? 10,
  };
}
