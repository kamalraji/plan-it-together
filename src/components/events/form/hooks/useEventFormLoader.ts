/**
 * Event Form Loader Hook
 * Handles loading event data for edit mode
 */
import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/looseClient';
import { useToast } from '@/hooks/use-toast';
import { UseFormReturn } from 'react-hook-form';
import { EventFormValues } from '@/lib/event-form-schema';
import { logger } from '@/lib/logger';
import { getBrowserTimezone } from '../utils/eventFormDefaults';

interface UseEventFormLoaderOptions {
  mode: 'create' | 'edit';
  eventId?: string;
  form: UseFormReturn<EventFormValues>;
  setIsLoadingEvent: (loading: boolean) => void;
}

interface EventBrandingData {
  registration?: { type?: string };
  seo?: { tags?: string[]; metaDescription?: string };
  contact?: { supportUrl?: string };
  primaryColor?: string;
  logoUrl?: string;
  heroSubtitle?: string;
  bannerUrl?: string;
  primaryCtaLabel?: string;
  secondaryCtaLabel?: string;
}

export const useEventFormLoader = ({
  mode,
  eventId,
  form,
  setIsLoadingEvent,
}: UseEventFormLoaderOptions) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const browserTimezone = getBrowserTimezone();

  const loadEvent = useCallback(async () => {
    if (mode !== 'edit' || !eventId) return;

    try {
      setIsLoadingEvent(true);

      const { data, error } = await supabase
        .from('events')
        .select(`
          id, name, description, mode, start_date, end_date, capacity, visibility, status, 
          created_at, updated_at, organization_id, branding, canvas_state, slug, category,
          timezone, registration_deadline, registration_type, is_free, allow_waitlist,
          contact_email, contact_phone, event_website, min_age, max_age, language
        `)
        .eq('id', eventId)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast({
          title: 'Event not found',
          description: 'The requested event could not be found.',
          variant: 'destructive',
        });
        navigate('../list');
        return;
      }

      // Fetch related data in parallel
      const [venueResult, virtualResult] = await Promise.all([
        supabase.from('event_venues').select('*').eq('event_id', eventId).maybeSingle(),
        supabase.from('event_virtual_links').select('*').eq('event_id', eventId).eq('is_primary', true).maybeSingle(),
      ]);

      const venueData = venueResult.data;
      const virtualData = virtualResult.data;
      const branding = data.branding as EventBrandingData | null;
      const eventData = data as Record<string, unknown>;

      form.reset({
        name: data.name ?? '',
        description: data.description ?? '',
        mode: (data.mode as 'ONLINE' | 'OFFLINE' | 'HYBRID') ?? 'ONLINE',
        visibility: (eventData.visibility as 'PUBLIC' | 'PRIVATE' | 'UNLISTED') ?? 'PUBLIC',
        category: (eventData.category as string) ?? '',
        organizationId: data.organization_id ?? '',
        capacity: data.capacity != null ? String(data.capacity) : '',
        registrationType: ((eventData.registration_type as string) ?? branding?.registration?.type ?? 'OPEN') as 'OPEN' | 'APPROVAL_REQUIRED' | 'INVITE_ONLY',
        isFreeEvent: (eventData.is_free as boolean) ?? true,
        allowWaitlist: (eventData.allow_waitlist as boolean) ?? false,
        tags: (branding?.seo?.tags ?? []).join(', '),
        metaDescription: branding?.seo?.metaDescription ?? '',
        customSlug: (eventData.slug as string) ?? '',
        accessibilityLanguage: (eventData.language as string) ?? 'en',
        ageRestrictionEnabled: (eventData.min_age as number) != null,
        minAge: (eventData.min_age as number) ?? null,
        maxAge: (eventData.max_age as number) ?? null,
        startDate: data.start_date ? new Date(data.start_date).toISOString().slice(0, 16) : '',
        endDate: data.end_date ? new Date(data.end_date).toISOString().slice(0, 16) : '',
        registrationDeadline: (eventData.registration_deadline as string)
          ? new Date(eventData.registration_deadline as string).toISOString().slice(0, 16)
          : '',
        timezone: (eventData.timezone as string) ?? browserTimezone,
        contactEmail: (eventData.contact_email as string) ?? '',
        contactPhone: (eventData.contact_phone as string) ?? '',
        supportUrl: branding?.contact?.supportUrl ?? '',
        eventWebsite: (eventData.event_website as string) ?? '',
        venueName: venueData?.name ?? '',
        venueAddress: venueData?.address ?? '',
        venueCity: venueData?.city ?? '',
        venueState: venueData?.state ?? '',
        venueCountry: venueData?.country ?? '',
        venuePostalCode: venueData?.postal_code ?? '',
        venueCapacity: venueData?.capacity != null ? String(venueData.capacity) : '',
        accessibilityFeatures: venueData?.accessibility_features ?? [],
        accessibilityNotes: venueData?.accessibility_notes ?? '',
        virtualPlatform: virtualData?.platform ?? '',
        virtualMeetingUrl: virtualData?.meeting_url ?? '',
        virtualMeetingId: virtualData?.meeting_id ?? '',
        virtualPassword: virtualData?.password ?? '',
        virtualInstructions: virtualData?.instructions ?? '',
        primaryColor: branding?.primaryColor ?? '#2563eb',
        logoUrl: branding?.logoUrl ?? '',
        heroSubtitle: branding?.heroSubtitle ?? '',
        bannerUrl: branding?.bannerUrl ?? '',
        primaryCtaLabel: branding?.primaryCtaLabel ?? '',
        secondaryCtaLabel: branding?.secondaryCtaLabel ?? '',
        canvasState: (eventData.canvas_state as unknown) ?? undefined,
      });
    } catch (err) {
      logger.error('Failed to load event', err);
      toast({
        title: 'Failed to load event',
        description: 'Please try again.',
        variant: 'destructive',
      });
      navigate('../list');
    } finally {
      setIsLoadingEvent(false);
    }
  }, [mode, eventId, form, setIsLoadingEvent, navigate, toast, browserTimezone]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  return { loadEvent };
};
