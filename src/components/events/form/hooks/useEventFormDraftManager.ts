/**
 * Event Form Draft Manager Hook
 * Manages draft persistence and restoration
 */
import { useState, useCallback, useEffect } from 'react';
import { useEventDraft } from '@/hooks/useEventDraft';
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning';
import { useToast } from '@/hooks/use-toast';
import type { EventFormValues } from '@/lib/event-form-schema';
import type { UseFormReturn } from 'react-hook-form';

interface UseEventFormDraftManagerOptions {
  organizationId: string;
  eventId?: string;
  mode: 'create' | 'edit';
  form: UseFormReturn<EventFormValues>;
  isSubmitting: boolean;
}

export const useEventFormDraftManager = ({
  organizationId,
  eventId,
  mode,
  form,
  isSubmitting,
}: UseEventFormDraftManagerOptions) => {
  const { toast } = useToast();
  const { reset, getValues, formState, watch } = form;
  const formValues = watch();

  // Draft prompt state
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<Record<string, unknown> | null>(null);

  // Draft management
  const { saveDraft, clearDraft, isSaving: isDraftSaving, lastSaved, hasDraft } = useEventDraft({
    organizationId,
    eventId: mode === 'edit' ? eventId : undefined,
    onDraftRestored: (draft) => {
      setPendingDraft(draft);
      setShowDraftPrompt(true);
    },
  });

  // Handle draft restoration
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

  // Manual save draft
  const handleManualSaveDraft = useCallback(() => {
    if (organizationId) {
      saveDraft(formValues);
      toast({ title: 'Draft saved', description: 'Your progress has been saved.' });
    }
  }, [organizationId, saveDraft, formValues, toast]);

  return {
    // Draft state
    showDraftPrompt,
    pendingDraft,
    isDraftSaving,
    lastSaved,
    hasDraft,

    // Draft handlers
    handleRestoreDraft,
    handleDiscardDraft,
    handleManualSaveDraft,
    saveDraft,
    clearDraft,

    // Navigation blocking
    isBlocked,
    requestNavigation,
    confirmNavigation,
    cancelNavigation,
  };
};
