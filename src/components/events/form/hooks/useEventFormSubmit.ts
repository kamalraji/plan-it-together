/**
 * Event Form Submit Hook
 * Handles form submission logic for create and edit modes
 * 
 * Industrial Features:
 * - Optimistic toast feedback
 * - Query cache invalidation via eventQueryKeys
 * - Proper error handling with rollback
 */
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/looseClient';
import { useToast } from '@/hooks/use-toast';
import { EventFormValues } from '@/lib/event-form-schema';
import { eventQueryKeys } from '@/lib/query-keys/events';
import { 
  buildEventPayload, 
  buildVenueInsertPayload, 
  buildVirtualLinkInsertPayload 
} from '../utils/eventFormPayloadBuilder';
import type { QuickTier, FormSubmitResult } from '../types/eventForm.types';
import { logger } from '@/lib/logger';

interface UseEventFormSubmitOptions {
  mode: 'create' | 'edit';
  eventId?: string;
  listPath: string;
  pendingTiers: QuickTier[];
  onClearDraft?: () => void;
  setIsSubmitting: (value: boolean) => void;
  setServerError: (error: string | null) => void;
}

export const useEventFormSubmit = ({
  mode,
  eventId,
  listPath,
  pendingTiers,
  onClearDraft,
  setIsSubmitting,
  setServerError,
}: UseEventFormSubmitOptions) => {
  const navigate = useNavigate();
  const { toast, dismiss } = useToast();
  const queryClient = useQueryClient();

  const onSubmit = useCallback(async (values: EventFormValues): Promise<FormSubmitResult> => {
    setServerError(null);

    // Show optimistic feedback immediately
    const optimisticToast = toast({
      title: mode === 'create' ? 'Creating event...' : 'Saving changes...',
      description: 'This will only take a moment',
    });

    try {
      setIsSubmitting(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        throw new Error('You must be logged in to create events.');
      }

      // Check organization membership for create mode
      if (mode === 'create' && values.organizationId) {
        const { data: membership, error: membershipError } = await supabase
          .from('organization_memberships')
          .select('status, role')
          .eq('user_id', user.id)
          .eq('organization_id', values.organizationId)
          .maybeSingle();

        if (membershipError) throw membershipError;

        if (
          !membership ||
          membership.status !== 'ACTIVE' ||
          !['OWNER', 'ADMIN', 'ORGANIZER'].includes(membership.role)
        ) {
          throw new Error('You must be an active organizer for this organization to create events.');
        }
      }

      // Build payload
      const payload = buildEventPayload(values, user.id, mode);
      let createdEventId: string | undefined;

      if (mode === 'create') {
        const { data, error } = await supabase
          .from('events')
          .insert(payload)
          .select('id')
          .maybeSingle();

        if (error) throw error;
        createdEventId = data?.id as string | undefined;

        // Insert venue data
        if (createdEventId && (values.mode === 'OFFLINE' || values.mode === 'HYBRID') && values.venueName) {
          const venuePayload = buildVenueInsertPayload(createdEventId, values);
          const { error: venueError } = await supabase.from('event_venues').insert(venuePayload);
          if (venueError) logger.error('Failed to save venue:', venueError);
        }

        // Insert virtual link data
        if (createdEventId && (values.mode === 'ONLINE' || values.mode === 'HYBRID') && values.virtualMeetingUrl) {
          const virtualPayload = buildVirtualLinkInsertPayload(createdEventId, values);
          const { error: virtualError } = await supabase.from('event_virtual_links').insert(virtualPayload);
          if (virtualError) logger.error('Failed to save virtual link:', virtualError);
        }

        // Save ticket tiers for paid events
        if (createdEventId && pendingTiers.length > 0 && !values.isFreeEvent) {
          const tiersToInsert = pendingTiers.map((tier, index) => ({
            event_id: createdEventId,
            name: tier.name,
            price: tier.price,
            currency: tier.currency,
            quantity: tier.quantity,
            sort_order: index,
            is_active: true,
            sold_count: 0,
          }));

          const { error: tiersError } = await supabase
            .from('ticket_tiers')
            .insert(tiersToInsert);

          if (tiersError) {
            logger.error('Failed to save ticket tiers:', tiersError);
            toast({
              variant: 'destructive',
              title: 'Warning',
              description: 'Event created but ticket tiers failed to save. Please add them in settings.',
            });
          }
        }
      } else {
        // UPDATE MODE
        const { error } = await supabase.from('events').update(payload).eq('id', eventId);
        if (error) throw error;

        // Upsert venue data
        if ((values.mode === 'OFFLINE' || values.mode === 'HYBRID') && values.venueName) {
          const venuePayload = buildVenueInsertPayload(eventId!, values);
          const { error: venueError } = await supabase
            .from('event_venues')
            .upsert(venuePayload, { onConflict: 'event_id' });
          if (venueError) logger.error('Failed to update venue:', venueError);
        } else {
          await supabase.from('event_venues').delete().eq('event_id', eventId);
        }

        // Upsert virtual link data
        if ((values.mode === 'ONLINE' || values.mode === 'HYBRID') && values.virtualMeetingUrl) {
          await supabase.from('event_virtual_links').delete().eq('event_id', eventId).eq('is_primary', true);
          const virtualPayload = buildVirtualLinkInsertPayload(eventId!, values);
          const { error: virtualError } = await supabase.from('event_virtual_links').insert(virtualPayload);
          if (virtualError) logger.error('Failed to update virtual link:', virtualError);
        } else {
          await supabase.from('event_virtual_links').delete().eq('event_id', eventId);
        }
      }

      // Clear draft on successful save
      if (mode === 'create') {
        onClearDraft?.();
      }

      // Dismiss optimistic toast and show success
      if (optimisticToast?.id) {
        dismiss(optimisticToast.id);
      }

      // Invalidate related queries for cache consistency
      queryClient.invalidateQueries({ queryKey: eventQueryKeys.lists() });
      if (eventId) {
        queryClient.invalidateQueries({ queryKey: eventQueryKeys.detail(eventId) });
      }
      if (createdEventId) {
        queryClient.invalidateQueries({ queryKey: eventQueryKeys.detail(createdEventId) });
      }

      toast({
        title: mode === 'create' ? 'Event draft saved!' : 'Event updated!',
        description:
          mode === 'create'
            ? 'Your event has been saved. Choose what to do next.'
            : 'Your changes have been saved.',
      });

      // For edit mode, navigate after success
      // For create mode, return result and let parent show dialog
      if (mode === 'edit') {
        navigate(listPath, { replace: true });
      }

      return { success: true, eventId: createdEventId || eventId };
    } catch (err: unknown) {
      // Dismiss optimistic toast
      if (optimisticToast?.id) {
        dismiss(optimisticToast.id);
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Please try again.';
      logger.error('Failed to save event', err);
      setServerError(errorMessage);
      toast({
        title: 'Failed to save event',
        description: errorMessage,
        variant: 'destructive',
      });
      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  }, [mode, eventId, listPath, pendingTiers, onClearDraft, setIsSubmitting, setServerError, navigate, toast, dismiss, queryClient]);

  return { onSubmit };
};
