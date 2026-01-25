/**
 * Event Form Types
 * Type definitions for the event form components
 */
import { UseFormReturn } from 'react-hook-form';
import { EventFormValues } from '@/lib/event-form-schema';

export type EventMode = 'create' | 'edit';

export interface EventFormPageProps {
  mode: EventMode;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
}

export interface EventImage {
  id: string;
  url: string;
  caption?: string;
  is_primary: boolean;
  order: number;
}

export interface EventFAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export interface QuickTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
}

export interface SectionState {
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

export interface BaseSectionProps {
  form: UseFormReturn<EventFormValues>;
  isOpen: boolean;
  onToggle: () => void;
  isSubmitting?: boolean;
}

export interface BasicInfoSectionProps extends BaseSectionProps {
  currentOrganization?: Organization | null;
  isLoadingOrganizations?: boolean;
  pendingTiers: QuickTier[];
  onPendingTiersChange: (tiers: QuickTier[]) => void;
}

export interface VenueSectionProps extends BaseSectionProps {
  selectedMode: 'ONLINE' | 'OFFLINE' | 'HYBRID';
}

export interface VirtualSectionProps extends BaseSectionProps {
  selectedMode: 'ONLINE' | 'OFFLINE' | 'HYBRID';
}

export interface MediaSectionProps extends BaseSectionProps {
  eventImages: EventImage[];
  onEventImagesChange: (images: EventImage[]) => void;
}

export interface FAQsSectionProps extends BaseSectionProps {
  eventFaqs: EventFAQ[];
  onEventFaqsChange: (faqs: EventFAQ[]) => void;
}

export interface DraftState {
  isDraftSaving: boolean;
  lastSaved: Date | null;
  hasDraft: boolean;
  showDraftPrompt: boolean;
  pendingDraft: Record<string, unknown> | null;
}

export interface FormSubmitResult {
  success: boolean;
  eventId?: string;
  error?: string;
}
