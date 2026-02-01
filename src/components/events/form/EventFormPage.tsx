/**
 * Event Form Page - Modular Refactored Version
 * 
 * This is the main orchestrator component
 * All section-specific logic has been extracted to:
 * - src/components/events/form/sections/ - UI components
 * - src/components/events/form/hooks/ - State management
 * - src/components/events/form/utils/ - Helpers and constants
 * 
 * Industrial Features:
 * - URL deep linking (#section-schedule)
 * - LiveRegion accessibility announcements
 * - SectionErrorBoundary isolation
 * - Optimistic draft save with sync status
 */
import React, { useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEventManagementPaths } from '@/hooks/useEventManagementPaths';
import { useMyMemberOrganizations } from '@/hooks/useOrganization';
import { cn } from '@/lib/utils';

// Accessibility
import { LiveRegion, useLiveAnnouncement } from '@/components/accessibility/LiveRegion';

// Error Boundaries
import { SectionErrorBoundary } from '@/components/events/shared/SectionErrorBoundary';

// Form imports
import { Form } from '@/components/ui/form';
import { eventFormSchema, type EventFormValues } from '@/lib/event-form-schema';

// Enhanced form features
import { useEventDraft } from '@/hooks/useEventDraft';
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning';
import { useEventFormKeyboard } from '@/hooks/useEventFormKeyboard';
import { type SectionProgress, calculateSectionStatus } from '@/components/events/form/SectionProgressIndicator';
import { DraftRestorationPrompt } from '@/components/events/form/DraftRestorationPrompt';
import { UnsavedChangesDialog } from '@/components/events/form/UnsavedChangesDialog';
import { PostCreateOptionsDialog } from './PostCreateOptionsDialog';

// Extracted components
import { EventFormHeader } from './EventFormHeader';
import { EventFormActions } from './EventFormActions';
import { EventFormLoadingState } from './EventFormLoadingState';
import { EventFormServerError } from './EventFormServerError';

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

// Hooks
import { useEventFormLoader } from './hooks/useEventFormLoader';
import { useEventFormSubmit } from './hooks/useEventFormSubmit';

// Utils
import { getDefaultFormValues, getInitialSectionState, sectionFieldMap } from './utils/eventFormDefaults';

// Types
import type { EventImage } from './EventImageGallery';
import type { EventFAQ } from './EventFAQsSection';
import type { QuickTier, SectionState } from './types/eventForm.types';

interface EventFormPageProps {
  mode: 'create' | 'edit';
}

export const EventFormPage: React.FC<EventFormPageProps> = ({ mode }) => {
  const { eventId, orgSlug } = useParams<{ eventId?: string; orgSlug?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { listPath } = useEventManagementPaths();
  const { data: myOrganizations = [], isLoading: isLoadingOrganizations } = useMyMemberOrganizations();

  // Find current organization
  const currentOrganization = myOrganizations.find((org: { slug: string }) => org.slug === orgSlug);
  const organizationId = currentOrganization?.id || '';

  // Accessibility announcements
  const { message: announcement, announce } = useLiveAnnouncement();

  // Core form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEvent, setIsLoadingEvent] = useState(mode === 'edit');
  const [serverError, setServerError] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<SectionState>(getInitialSectionState());
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  
  // Post-creation dialog state
  const [showPostCreate, setShowPostCreate] = useState(false);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [createdEventName, setCreatedEventName] = useState<string>('');

  // Additional form data
  const [eventImages, setEventImages] = useState<EventImage[]>([]);
  const [eventFaqs, setEventFaqs] = useState<EventFAQ[]>([]);
  const [pendingTiers, setPendingTiers] = useState<QuickTier[]>([]);

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

  // Load event data for edit mode
  useEventFormLoader({
    mode,
    eventId,
    form,
    setIsLoadingEvent,
  });

  // Draft management
  const [pendingDraft, setPendingDraft] = useState<Record<string, unknown> | null>(null);

  const { saveDraft, clearDraft, isSaving: isDraftSaving, lastSaved, hasDraft, syncStatus } = useEventDraft({
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

  // Announce validation errors for screen readers
  useEffect(() => {
    const errorCount = Object.keys(formState.errors).length;
    if (errorCount > 0 && formState.isSubmitted) {
      announce(`Form has ${errorCount} validation error${errorCount > 1 ? 's' : ''}. Please review highlighted fields.`);
    }
  }, [formState.errors, formState.isSubmitted, announce]);

  // URL hash deep linking - parse on mount and navigate to section
  useEffect(() => {
    const hash = location.hash.replace('#section-', '');
    if (hash && Object.prototype.hasOwnProperty.call(openSections, hash)) {
      setOpenSections(prev => ({ ...prev, [hash]: true }));
      setTimeout(() => {
        const el = document.getElementById(`section-${hash}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [location.hash]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Section click handler with URL hash update
  const handleSectionClick = useCallback((sectionId: string) => {
    setOpenSections(prev => ({ ...prev, [sectionId]: true }));
    window.history.replaceState(null, '', `#section-${sectionId}`);
    setTimeout(() => {
      const el = document.getElementById(`section-${sectionId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  // Toggle section with URL hash update and focus management
  const toggleSection = useCallback((section: keyof SectionState) => {
    setOpenSections(prev => {
      const isOpening = !prev[section];
      if (isOpening) {
        window.history.replaceState(null, '', `#section-${section}`);
        // Focus first input in section after animation
        setTimeout(() => {
          const sectionEl = document.getElementById(`section-${section}`);
          const firstInput = sectionEl?.querySelector('input, select, textarea');
          (firstInput as HTMLElement)?.focus();
        }, 300);
      }
      return { ...prev, [section]: !prev[section] };
    });
  }, []);

  // Auto-set organization
  useEffect(() => {
    if (mode === 'create' && currentOrganization && !form.getValues('organizationId')) {
      form.setValue('organizationId', currentOrganization.id);
    }
  }, [currentOrganization, mode, form]);

  // Form submit handler with post-creation dialog
  const { onSubmit: baseOnSubmit } = useEventFormSubmit({
    mode,
    eventId,
    listPath,
    pendingTiers,
    onClearDraft: clearDraft,
    setIsSubmitting,
    setServerError,
  });

  // Wrap submit to show post-creation dialog
  const onSubmit = useCallback(async (values: EventFormValues) => {
    const result = await baseOnSubmit(values);
    if (result.success && mode === 'create' && result.eventId) {
      setCreatedEventId(result.eventId);
      setCreatedEventName(values.name);
      setShowPostCreate(true);
    }
    return result;
  }, [baseOnSubmit, mode]);

  // Post-create dialog handlers
  const handleContinueEditing = useCallback(() => {
    setShowPostCreate(false);
    if (createdEventId) {
      // Use correct event edit path based on org context
      const editPath = orgSlug
        ? `/${orgSlug}/eventmanagement/${createdEventId}/edit`
        : `/dashboard/eventmanagement/${createdEventId}/edit`;
      navigate(editPath, { replace: true });
    }
  }, [createdEventId, orgSlug, navigate]);

  const handleCreateWorkspace = useCallback(() => {
    setShowPostCreate(false);
    if (createdEventId) {
      // Use correct workspace create path with event pre-selection
      const workspacePath = orgSlug 
        ? `/${orgSlug}/workspaces/create/${createdEventId}`
        : `/dashboard/workspaces/create/${createdEventId}`;
      navigate(workspacePath, { replace: true });
    }
  }, [createdEventId, orgSlug, navigate]);

  const handleViewEvent = useCallback(() => {
    setShowPostCreate(false);
    if (createdEventId) {
      // Navigate to public event page - this would need the slug
      navigate(`/event/${createdEventId}`, { replace: true });
    }
  }, [createdEventId, navigate]);

  if (isLoadingEvent) {
    return <EventFormLoadingState />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Accessibility: Live region for screen reader announcements */}
      <LiveRegion message={announcement} priority="assertive" />

      {/* Post-Creation Options Dialog */}
      <PostCreateOptionsDialog
        open={showPostCreate}
        eventName={createdEventName}
        onContinueEditing={handleContinueEditing}
        onCreateWorkspace={handleCreateWorkspace}
        onViewEvent={handleViewEvent}
      />

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
      <EventFormHeader
        mode={mode}
        isDraftSaving={isDraftSaving}
        lastSaved={lastSaved}
        hasDraft={hasDraft}
        syncStatus={syncStatus}
        sectionProgress={sectionProgress}
        onSectionClick={handleSectionClick}
      />

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
            {serverError && <EventFormServerError error={serverError} />}

            {/* Form Sections with Error Boundaries */}
            <div id="section-basic">
              <SectionErrorBoundary sectionName="Basic Info">
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
              </SectionErrorBoundary>
            </div>

            <div id="section-schedule">
              <SectionErrorBoundary sectionName="Schedule">
                <ScheduleSection
                  form={form}
                  isOpen={openSections.schedule}
                  onToggle={() => toggleSection('schedule')}
                />
              </SectionErrorBoundary>
            </div>

            <div id="section-organizer">
              <SectionErrorBoundary sectionName="Organizer Contact">
                <OrganizerSection
                  form={form}
                  isOpen={openSections.organizer}
                  onToggle={() => toggleSection('organizer')}
                />
              </SectionErrorBoundary>
            </div>

            {showVenueSection && (
              <div id="section-venue">
                <SectionErrorBoundary sectionName="Venue">
                  <VenueSection
                    form={form}
                    isOpen={openSections.venue}
                    onToggle={() => toggleSection('venue')}
                    stepNumber={getStepNumber('venue')}
                    selectedMode={selectedMode}
                  />
                </SectionErrorBoundary>
              </div>
            )}

            {showVirtualSection && (
              <div id="section-virtual">
                <SectionErrorBoundary sectionName="Virtual">
                  <VirtualSection
                    form={form}
                    isOpen={openSections.virtual}
                    onToggle={() => toggleSection('virtual')}
                    stepNumber={getStepNumber('virtual')}
                    selectedMode={selectedMode}
                  />
                </SectionErrorBoundary>
              </div>
            )}

            <div id="section-branding">
              <SectionErrorBoundary sectionName="Branding">
                <BrandingSection
                  form={form}
                  isOpen={openSections.branding}
                  onToggle={() => toggleSection('branding')}
                  stepNumber={getStepNumber('branding')}
                />
              </SectionErrorBoundary>
            </div>

            <div id="section-media">
              <SectionErrorBoundary sectionName="Media">
                <MediaSection
                  isOpen={openSections.media}
                  onToggle={() => toggleSection('media')}
                  stepNumber={getStepNumber('media')}
                  images={eventImages}
                  onImagesChange={setEventImages}
                  isSubmitting={isSubmitting}
                />
              </SectionErrorBoundary>
            </div>

            <div id="section-faqs">
              <SectionErrorBoundary sectionName="FAQs">
                <FAQsSection
                  isOpen={openSections.faqs}
                  onToggle={() => toggleSection('faqs')}
                  stepNumber={getStepNumber('faqs')}
                  faqs={eventFaqs}
                  onFaqsChange={setEventFaqs}
                  isSubmitting={isSubmitting}
                />
              </SectionErrorBoundary>
            </div>

            <div id="section-cta">
              <SectionErrorBoundary sectionName="Call to Action">
                <CTASection
                  form={form}
                  isOpen={openSections.cta}
                  onToggle={() => toggleSection('cta')}
                  stepNumber={getStepNumber('cta')}
                />
              </SectionErrorBoundary>
            </div>

            {/* Form Actions */}
            <EventFormActions
              mode={mode}
              isSubmitting={isSubmitting}
              onCancel={() => safeNavigate(listPath)}
            />
          </form>
        </Form>
      </div>
    </div>
  );
};

export default EventFormPage;
