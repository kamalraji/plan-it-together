/**
 * Event Form State Hook
 * Manages form state, section visibility, and progress tracking
 */
import { useState, useMemo, useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { eventFormSchema, type EventFormValues } from '@/lib/event-form-schema';
import { 
  type SectionProgress, 
  calculateSectionStatus 
} from '@/components/events/form/SectionProgressIndicator';
import { 
  getDefaultFormValues, 
  getInitialSectionState,
  sectionFieldMap 
} from '../utils/eventFormDefaults';
import type { SectionState, EventImage, EventFAQ, QuickTier } from '../types/eventForm.types';

interface UseEventFormStateOptions {
  organizationId?: string;
  mode: 'create' | 'edit';
}

export const useEventFormState = ({ organizationId, mode }: UseEventFormStateOptions) => {
  // Form instance
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: getDefaultFormValues(organizationId),
  });

  const { control, formState, watch, getValues, reset } = form;
  const formValues = watch();

  // Section open states
  const [openSections, setOpenSections] = useState<SectionState>(getInitialSectionState());

  // Additional form state
  const [eventImages, setEventImages] = useState<EventImage[]>([]);
  const [eventFaqs, setEventFaqs] = useState<EventFAQ[]>([]);
  const [pendingTiers, setPendingTiers] = useState<QuickTier[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEvent, setIsLoadingEvent] = useState(mode === 'edit');
  const [serverError, setServerError] = useState<string | null>(null);

  // Watch mode for conditional sections
  const selectedMode = useWatch({ control, name: 'mode' });
  const showVenueSection = selectedMode === 'OFFLINE' || selectedMode === 'HYBRID';
  const showVirtualSection = selectedMode === 'ONLINE' || selectedMode === 'HYBRID';

  // Watch free event toggle
  const isFreeEvent = useWatch({ control, name: 'isFreeEvent' });

  // Section toggle handler
  const toggleSection = useCallback((section: keyof SectionState) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  }, []);

  // Section click handler (from progress indicator)
  const handleSectionClick = useCallback((sectionId: string) => {
    setOpenSections(prev => ({ ...prev, [sectionId]: true }));
    // Scroll to section
    setTimeout(() => {
      const el = document.getElementById(`section-${sectionId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  // Section progress calculation
  const sectionProgress: SectionProgress[] = useMemo(() => [
    {
      id: 'basic',
      label: 'Basic Info',
      status: calculateSectionStatus('basic', formValues, formState.errors, sectionFieldMap),
      required: true,
    },
    {
      id: 'schedule',
      label: 'Schedule',
      status: calculateSectionStatus('schedule', formValues, formState.errors, sectionFieldMap),
      required: true,
    },
    {
      id: 'organizer',
      label: 'Contact',
      status: calculateSectionStatus('organizer', formValues, formState.errors, sectionFieldMap),
      required: false,
    },
    {
      id: 'venue',
      label: 'Venue',
      status: showVenueSection
        ? calculateSectionStatus('venue', formValues, formState.errors, sectionFieldMap)
        : 'complete',
      required: showVenueSection,
    },
    {
      id: 'virtual',
      label: 'Virtual',
      status: showVirtualSection
        ? calculateSectionStatus('virtual', formValues, formState.errors, sectionFieldMap)
        : 'complete',
      required: showVirtualSection,
    },
    {
      id: 'branding',
      label: 'Branding',
      status: calculateSectionStatus('branding', formValues, formState.errors, sectionFieldMap),
      required: false,
    },
  ], [formValues, formState.errors, showVenueSection, showVirtualSection]);

  return {
    // Form
    form,
    formValues,
    formState,
    control,
    getValues,
    reset,

    // Section state
    openSections,
    toggleSection,
    handleSectionClick,
    sectionProgress,

    // Conditional visibility
    selectedMode,
    showVenueSection,
    showVirtualSection,
    isFreeEvent,

    // Additional state
    eventImages,
    setEventImages,
    eventFaqs,
    setEventFaqs,
    pendingTiers,
    setPendingTiers,

    // Loading/error state
    isSubmitting,
    setIsSubmitting,
    isLoadingEvent,
    setIsLoadingEvent,
    serverError,
    setServerError,
  };
};
