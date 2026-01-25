/**
 * Event Form Page - Modular Refactored Version
 * 
 * This is the main orchestrator component (~400 lines vs original 2400+)
 * All section-specific logic has been extracted to:
 * - src/components/events/form/sections/ - UI components
 * - src/components/events/form/hooks/ - State management
 * - src/components/events/form/utils/ - Helpers and constants
 */
import React, { useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/looseClient';
import { useToast } from '@/hooks/use-toast';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEventManagementPaths } from '@/hooks/useEventManagementPaths';
import { useMyMemberOrganizations } from '@/hooks/useOrganization';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

// Form imports
import { Form } from '@/components/ui/form';
import { eventFormSchema, type EventFormValues } from '@/lib/event-form-schema';

// Enhanced form features
import { useEventDraft } from '@/hooks/useEventDraft';
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning';
import { useEventFormKeyboard, formatShortcut } from '@/hooks/useEventFormKeyboard';
import { SectionProgressIndicator, type SectionProgress, calculateSectionStatus } from '@/components/events/form/SectionProgressIndicator';
import { DraftStatusIndicator } from '@/components/events/form/DraftStatusIndicator';
import { DraftRestorationPrompt } from '@/components/events/form/DraftRestorationPrompt';
import { UnsavedChangesDialog } from '@/components/events/form/UnsavedChangesDialog';

// Section components
import {
  BasicInfoSection,
  ScheduleSection,
  OrganizerSection,
  VenueSection,
  VirtualSection,
  BrandingSection,
  MediaSection,
  FAQsSection,
  CTASection,
} from '@/components/events/form/sections';

// Utils
import { getDefaultFormValues, getInitialSectionState, sectionFieldMap } from '@/components/events/form/utils/eventFormDefaults';
import { useEventFormSubmit } from '@/components/events/form/hooks/useEventFormSubmit';

// Types
import type { EventImage, EventFAQ } from '@/components/events/form/EventImageGallery';
import type { QuickTier } from '@/components/events/form/TicketTierQuickAdd';

interface SectionState {
  basic: boolean;
  schedule: boolean;
  organizer: boolean;
  venue: boolean;
  virtual: boolean;
  branding: boolean;
  media: boolean;
  faqs: boolean;
  cta: boolean;
}

interface EventFormPageProps {
  mode: 'create' | 'edit';
}

export const EventFormPage: React.FC<EventFormPageProps> = ({ mode }) => {
  const { eventId, orgSlug } = useParams<{ eventId?: string; orgSlug?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { listPath } = useEventManagementPaths();
  const { data: myOrganizations = [], isLoading: isLoadingOrganizations } = useMyMemberOrganizations();

  // Find current organization
  const currentOrganization = myOrganizations.find((org: { slug: string }) => org.slug === orgSlug);
  const organizationId = currentOrganization?.id || '';

  // Core form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEvent, setIsLoadingEvent] = useState(mode === 'edit');
  const [serverError, setServerError] = useState<string | null>(null);
  const [isRequestingAccess, setIsRequestingAccess] = useState(false);
  const [openSections, setOpenSections] = useState<SectionState>(getInitialSectionState());
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);

  // Additional form data
  const [eventImages, setEventImages] = useState<EventImage[]>([]);
  const [eventFaqs, setEventFaqs] = useState<EventFAQ[]>([]);
  const [pendingTiers, setPendingTiers] = useState<QuickTier[]>([]);

  // Browser timezone detection
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Form initialization
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: getDefaultFormValues(organizationId),
  });

  const { handleSubmit, reset, control, formState, watch, getValues } = form;
  const formValues = watch();

  // Watch mode for conditional sections
  const selectedMode = useWatch({ control, name: 'mode' });
  const showVenueSection = selectedMode === 'OFFLINE' || selectedMode === 'HYBRID';
  const showVirtualSection = selectedMode === 'ONLINE' || selectedMode === 'HYBRID';

  // Draft management
  const [pendingDraft, setPendingDraft] = useState<Record<string, unknown> | null>(null);

  const { saveDraft, clearDraft, isSaving: isDraftSaving, lastSaved, hasDraft } = useEventDraft({
    organizationId,
    eventId: mode === 'edit' ? eventId : undefined,
    onDraftRestored: (draft) => {
      setPendingDraft(draft);
      setShowDraftPrompt(true);
    },
  });

  // Draft handlers
  const handleRestoreDraft = useCallback(() => {
    if (pendingDraft) {
      reset({ ...getValues(), ...pendingDraft });
      setShowDraftPrompt(false);
      setPendingDraft(null);
      toast({ title: 'Draft restored', description: 'Your previous work has been restored.' });
    }
  }, [pendingDraft, reset, getValues, toast]);

  const handleDiscardDraft = useCallback(() => {
    clearDraft();
    setShowDraftPrompt(false);
    setPendingDraft(null);
  }, [clearDraft]);

  // Auto-save on form changes
  useEffect(() => {
    if (mode === 'create' && organizationId && formState.isDirty) {
      saveDraft(formValues);
    }
  }, [formValues, organizationId, mode, formState.isDirty, saveDraft]);

  // Unsaved changes warning
  const { isBlocked, requestNavigation, confirmNavigation, cancelNavigation } = useUnsavedChangesWarning({
    isDirty: formState.isDirty && !isSubmitting,
    enabled: mode === 'create',
  });

  const safeNavigate = useCallback((path: string) => {
    requestNavigation(() => navigate(path));
  }, [requestNavigation, navigate]);

  // Keyboard shortcuts
  useEventFormKeyboard({
    onSave: () => {
      const formEl = document.getElementById('event-form') as HTMLFormElement | null;
      if (formEl) formEl.requestSubmit();
    },
    onSaveDraft: () => {
      if (organizationId) {
        saveDraft(formValues);
        toast({ title: 'Draft saved', description: 'Your progress has been saved.' });
      }
    },
    onCancel: () => safeNavigate(listPath),
    disabled: isSubmitting,
  });

  // Calculate step numbers based on visible sections
  const getStepNumber = (section: string): number => {
    const baseSteps = ['basic', 'schedule', 'organizer'];
    const conditionalSteps = [];
    if (showVenueSection) conditionalSteps.push('venue');
    if (showVirtualSection) conditionalSteps.push('virtual');
    const allSteps = [...baseSteps, ...conditionalSteps, 'branding', 'media', 'faqs', 'cta'];
    return allSteps.indexOf(section) + 1;
  };

  // Section progress
  const sectionProgress: SectionProgress[] = React.useMemo(() => [
    { id: 'basic', label: 'Basic Info', status: calculateSectionStatus('basic', formValues, formState.errors, sectionFieldMap), required: true },
    { id: 'schedule', label: 'Schedule', status: calculateSectionStatus('schedule', formValues, formState.errors, sectionFieldMap), required: true },
    { id: 'organizer', label: 'Contact', status: calculateSectionStatus('organizer', formValues, formState.errors, sectionFieldMap), required: false },
    { id: 'venue', label: 'Venue', status: showVenueSection ? calculateSectionStatus('venue', formValues, formState.errors, sectionFieldMap) : 'complete', required: showVenueSection },
    { id: 'virtual', label: 'Virtual', status: showVirtualSection ? calculateSectionStatus('virtual', formValues, formState.errors, sectionFieldMap) : 'complete', required: showVirtualSection },
    { id: 'branding', label: 'Branding', status: calculateSectionStatus('branding', formValues, formState.errors, sectionFieldMap), required: false },
  ], [formValues, formState.errors, showVenueSection, showVirtualSection]);

  const handleSectionClick = (sectionId: string) => {
    setOpenSections(prev => ({ ...prev, [sectionId]: true }));
    setTimeout(() => {
      const el = document.getElementById(`section-${sectionId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const toggleSection = (section: keyof SectionState) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Auto-set organization
  useEffect(() => {
    if (mode === 'create' && currentOrganization && !form.getValues('organizationId')) {
      form.setValue('organizationId', currentOrganization.id);
    }
  }, [currentOrganization, mode, form]);

  // Load event for edit mode
  useEffect(() => {
    const loadEvent = async () => {
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
          toast({ title: 'Event not found', description: 'The requested event could not be found.', variant: 'destructive' });
          navigate('../list');
          return;
        }

        // Fetch related data
        const { data: venueData } = await supabase.from('event_venues').select('*').eq('event_id', eventId).maybeSingle();
        const { data: virtualData } = await supabase.from('event_virtual_links').select('*').eq('event_id', eventId).eq('is_primary', true).maybeSingle();

        const branding = data.branding as Record<string, unknown> | null;

        reset({
          name: data.name ?? '',
          description: data.description ?? '',
          mode: (data.mode as 'ONLINE' | 'OFFLINE' | 'HYBRID') ?? 'ONLINE',
          visibility: ((data as Record<string, unknown>).visibility as 'PUBLIC' | 'PRIVATE' | 'UNLISTED') ?? 'PUBLIC',
          category: ((data as Record<string, unknown>).category as string) ?? '',
          organizationId: data.organization_id ?? '',
          capacity: data.capacity != null ? String(data.capacity) : '',
          registrationType: ((data as Record<string, unknown>).registration_type as string) ?? (branding?.registration as { type?: string })?.type ?? 'OPEN',
          isFreeEvent: ((data as Record<string, unknown>).is_free as boolean) ?? true,
          allowWaitlist: ((data as Record<string, unknown>).allow_waitlist as boolean) ?? false,
          tags: ((branding?.seo as { tags?: string[] })?.tags ?? []).join(', '),
          metaDescription: (branding?.seo as { metaDescription?: string })?.metaDescription ?? '',
          customSlug: ((data as Record<string, unknown>).slug as string) ?? '',
          accessibilityLanguage: ((data as Record<string, unknown>).language as string) ?? 'en',
          ageRestrictionEnabled: ((data as Record<string, unknown>).min_age as number) != null,
          minAge: ((data as Record<string, unknown>).min_age as number) ?? null,
          maxAge: ((data as Record<string, unknown>).max_age as number) ?? null,
          startDate: data.start_date ? new Date(data.start_date).toISOString().slice(0, 16) : '',
          endDate: data.end_date ? new Date(data.end_date).toISOString().slice(0, 16) : '',
          registrationDeadline: ((data as Record<string, unknown>).registration_deadline as string)
            ? new Date((data as Record<string, unknown>).registration_deadline as string).toISOString().slice(0, 16)
            : '',
          timezone: ((data as Record<string, unknown>).timezone as string) ?? browserTimezone ?? 'Asia/Kolkata',
          contactEmail: ((data as Record<string, unknown>).contact_email as string) ?? '',
          contactPhone: ((data as Record<string, unknown>).contact_phone as string) ?? '',
          supportUrl: (branding?.contact as { supportUrl?: string })?.supportUrl ?? '',
          eventWebsite: ((data as Record<string, unknown>).event_website as string) ?? '',
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
          primaryColor: (branding?.primaryColor as string) ?? '#2563eb',
          logoUrl: (branding?.logoUrl as string) ?? '',
          heroSubtitle: (branding?.heroSubtitle as string) ?? '',
          bannerUrl: (branding?.bannerUrl as string) ?? '',
          primaryCtaLabel: (branding?.primaryCtaLabel as string) ?? '',
          secondaryCtaLabel: (branding?.secondaryCtaLabel as string) ?? '',
          canvasState: ((data as Record<string, unknown>).canvas_state as unknown) ?? undefined,
        });
      } catch (err) {
        logger.error('Failed to load event', err);
        toast({ title: 'Failed to load event', description: 'Please try again.', variant: 'destructive' });
        navigate('../list');
      } finally {
        setIsLoadingEvent(false);
      }
    };

    loadEvent();
  }, [mode, eventId, navigate, reset, toast, browserTimezone]);

  // Form submit handler
  const { onSubmit } = useEventFormSubmit({
    mode,
    eventId,
    listPath,
    pendingTiers,
    onClearDraft: clearDraft,
    setIsSubmitting,
    setServerError,
  });

  const pageTitle = mode === 'create' ? 'Create Event' : 'Edit Event';

  if (isLoadingEvent) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Draft Restoration Prompt */}
      {showDraftPrompt && (
        <div className="mx-auto max-w-4xl px-4 pt-4 sm:px-6">
          <DraftRestorationPrompt
            onRestore={handleRestoreDraft}
            onDiscard={handleDiscardDraft}
          />
        </div>
      )}

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        open={isBlocked}
        onConfirm={confirmNavigation}
        onCancel={cancelNavigation}
      />

      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {mode === 'create' 
                  ? 'Fill in the details to create your event draft'
                  : 'Update your event information'
                }
              </p>
            </div>
            <div className="flex items-center gap-3">
              <DraftStatusIndicator
                isSaving={isDraftSaving}
                lastSaved={lastSaved}
                hasDraft={hasDraft}
              />
              <SectionProgressIndicator
                sections={sectionProgress}
                onSectionClick={handleSectionClick}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="mx-auto max-w-4xl px-4 pb-24 sm:px-6">
        <Form {...form}>
          <form
            id="event-form"
            onSubmit={handleSubmit(onSubmit)}
            className={cn(
              'mt-6 space-y-1 divide-y divide-border/50 rounded-2xl border border-border/50 bg-card shadow-sm',
              isSubmitting && 'pointer-events-none opacity-60'
            )}
          >
            {/* Server Error */}
            {serverError && (
              <div className="p-4 sm:p-6">
                <Alert variant="destructive">
                  <AlertTitle>Failed to save event</AlertTitle>
                  <AlertDescription>
                    <p>{serverError}</p>
                    {serverError.includes('organizer/admin permissions') && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-3 border-destructive text-destructive hover:bg-destructive/10"
                        disabled={isRequestingAccess}
                        onClick={async () => {
                          if (isRequestingAccess) return;
                          setIsRequestingAccess(true);
                          try {
                            const { error } = await supabase.functions.invoke('self-approve-organizer');
                            if (error) throw error;
                            toast({ title: 'Organizer access requested', description: 'Your request has been recorded.' });
                          } catch {
                            toast({ title: 'Failed to request access', variant: 'destructive' });
                          } finally {
                            setIsRequestingAccess(false);
                          }
                        }}
                      >
                        {isRequestingAccess ? 'Requesting…' : 'Request organizer access'}
                      </Button>
                    )}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Form Sections */}
            <div id="section-basic">
              <BasicInfoSection
                form={form}
                isOpen={openSections.basic}
                onToggle={() => toggleSection('basic')}
                isSubmitting={isSubmitting}
                isLoadingOrganizations={isLoadingOrganizations}
                currentOrganization={currentOrganization}
                pendingTiers={pendingTiers}
                onPendingTiersChange={setPendingTiers}
              />
            </div>

            <div id="section-schedule">
              <ScheduleSection
                form={form}
                isOpen={openSections.schedule}
                onToggle={() => toggleSection('schedule')}
              />
            </div>

            <div id="section-organizer">
              <OrganizerSection
                form={form}
                isOpen={openSections.organizer}
                onToggle={() => toggleSection('organizer')}
              />
            </div>

            {showVenueSection && (
              <div id="section-venue">
                <VenueSection
                  form={form}
                  isOpen={openSections.venue}
                  onToggle={() => toggleSection('venue')}
                  stepNumber={getStepNumber('venue')}
                  selectedMode={selectedMode}
                />
              </div>
            )}

            {showVirtualSection && (
              <div id="section-virtual">
                <VirtualSection
                  form={form}
                  isOpen={openSections.virtual}
                  onToggle={() => toggleSection('virtual')}
                  stepNumber={getStepNumber('virtual')}
                  selectedMode={selectedMode}
                />
              </div>
            )}

            <div id="section-branding">
              <BrandingSection
                form={form}
                isOpen={openSections.branding}
                onToggle={() => toggleSection('branding')}
                stepNumber={getStepNumber('branding')}
              />
            </div>

            <div id="section-media">
              <MediaSection
                isOpen={openSections.media}
                onToggle={() => toggleSection('media')}
                stepNumber={getStepNumber('media')}
                eventImages={eventImages}
                onEventImagesChange={setEventImages}
                isSubmitting={isSubmitting}
              />
            </div>

            <div id="section-faqs">
              <FAQsSection
                isOpen={openSections.faqs}
                onToggle={() => toggleSection('faqs')}
                stepNumber={getStepNumber('faqs')}
                eventFaqs={eventFaqs}
                onEventFaqsChange={setEventFaqs}
                isSubmitting={isSubmitting}
              />
            </div>

            <div id="section-cta">
              <CTASection
                form={form}
                isOpen={openSections.cta}
                onToggle={() => toggleSection('cta')}
                stepNumber={getStepNumber('cta')}
              />
            </div>

            {/* Form Actions */}
            <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm border-t border-border/50 p-4 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground hidden sm:block">
                  {mode === 'create' ? 'Fill required fields to continue' : 'Changes save immediately'}
                </p>
                <div className="flex items-center gap-3 ml-auto">
                  <Button type="button" variant="ghost" onClick={() => safeNavigate(listPath)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
                    {isSubmitting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Saving...
                      </>
                    ) : (
                      mode === 'create' ? 'Create Event' : 'Save Changes'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default EventFormPage;
