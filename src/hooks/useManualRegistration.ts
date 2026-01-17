import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TicketTier {
  id: string;
  name: string;
  price: number;
  quantity: number | null;
  sold_count: number;
  available: number;
  is_active: boolean;
  sale_start: string | null;
  sale_end: string | null;
}

interface ManualRegistrationData {
  fullName: string;
  email: string;
  phone?: string;
  ticketTierId: string;
  notes?: string;
  sendConfirmation: boolean;
}

interface BulkInviteData {
  emails: string[];
  ticketTierId: string;
}

export function useManualRegistration(eventId: string | null) {
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTicketTiers = useCallback(async () => {
    if (!eventId) {
      setTicketTiers([]);
      setIsLoading(false);
      return;
    }

    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('ticket_tiers')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;

      const tiersWithAvailability = (data || []).map(tier => {
        const quantity = tier.quantity ?? 9999; // Default to unlimited if null
        return {
          ...tier,
          quantity,
          available: quantity - (tier.sold_count || 0),
          // Check if within sale window
          isWithinSaleWindow: 
            (!tier.sale_start || new Date(tier.sale_start) <= new Date(now)) &&
            (!tier.sale_end || new Date(tier.sale_end) >= new Date(now))
        };
      }).filter(tier => tier.isWithinSaleWindow);

      setTicketTiers(tiersWithAvailability);
    } catch (error) {
      console.error('Error fetching ticket tiers:', error);
      toast.error('Failed to load ticket types');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchTicketTiers();
  }, [fetchTicketTiers]);

  const checkDuplicateRegistration = async (email: string): Promise<boolean> => {
    if (!eventId) return false;

    // Check registration_attendees for the email
    const { data: attendeeData } = await supabase
      .from('registration_attendees')
      .select('id, registration:registrations!inner(event_id, status)')
      .eq('email', email.toLowerCase())
      .limit(1);

    const existingAttendee = attendeeData?.find(
      (a: any) => a.registration?.event_id === eventId && a.registration?.status === 'CONFIRMED'
    );

    return !!existingAttendee;
  };

  const createManualRegistration = async (data: ManualRegistrationData): Promise<boolean> => {
    if (!eventId) {
      toast.error('No event associated with this workspace');
      return false;
    }

    setIsSubmitting(true);

    try {
      // Check for duplicate
      const isDuplicate = await checkDuplicateRegistration(data.email);
      if (isDuplicate) {
        toast.error('This email is already registered for this event');
        return false;
      }

      // Check ticket availability
      const tier = ticketTiers.find(t => t.id === data.ticketTierId);
      if (!tier || tier.available <= 0) {
        toast.error('Selected ticket type is sold out');
        return false;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to add attendees');
        return false;
      }

      // Create registration
      const { data: registration, error: regError } = await supabase
        .from('registrations')
        .insert({
          event_id: eventId,
          user_id: user.id, // The registering staff member
          ticket_tier_id: data.ticketTierId,
          quantity: 1,
          status: 'CONFIRMED',
          form_responses: {
            manual_registration: true,
            registered_by: user.id,
            notes: data.notes || null
          },
          subtotal: tier.price,
          total_amount: tier.price,
          discount_amount: 0
        })
        .select()
        .single();

      if (regError) throw regError;

      // Create attendee record
      const { error: attendeeError } = await supabase
        .from('registration_attendees')
        .insert({
          registration_id: registration.id,
          full_name: data.fullName,
          email: data.email.toLowerCase(),
          phone: data.phone || null,
          ticket_tier_id: data.ticketTierId,
          is_primary: true,
          custom_fields: { notes: data.notes || null }
        });

      if (attendeeError) throw attendeeError;

      // Update sold count
      const { error: updateError } = await supabase
        .from('ticket_tiers')
        .update({ sold_count: tier.sold_count + 1 })
        .eq('id', data.ticketTierId);

      if (updateError) {
        console.error('Failed to update sold count:', updateError);
      }

      // Send confirmation email if requested
      if (data.sendConfirmation) {
        try {
          // Get event details for email
          const { data: eventData } = await supabase
            .from('events')
            .select('name, start_date, end_date')
            .eq('id', eventId)
            .single();

          await supabase.functions.invoke('send-registration-confirmation', {
            body: {
              attendeeName: data.fullName,
              attendeeEmail: data.email,
              eventName: eventData?.name || 'Event',
              eventDate: eventData?.start_date,
              ticketType: tier.name,
              registrationId: registration.id
            }
          });
        } catch (emailError) {
          console.warn('Failed to send confirmation email:', emailError);
          // Don't fail the registration if email fails
        }
      }

      // Refresh ticket tiers to update availability
      await fetchTicketTiers();

      return true;
    } catch (error) {
      console.error('Error creating registration:', error);
      toast.error('Failed to add attendee');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendBulkInvitations = async (data: BulkInviteData): Promise<{ sent: number; failed: number }> => {
    if (!eventId) {
      toast.error('No event associated with this workspace');
      return { sent: 0, failed: data.emails.length };
    }

    setIsSubmitting(true);
    let sent = 0;
    let failed = 0;

    try {
      const tier = ticketTiers.find(t => t.id === data.ticketTierId);
      if (!tier) {
        toast.error('Invalid ticket type selected');
        return { sent: 0, failed: data.emails.length };
      }

      // Get event details
      const { data: eventData } = await supabase
        .from('events')
        .select('name, start_date, landing_page_slug')
        .eq('id', eventId)
        .single();

      for (const email of data.emails) {
        try {
          // Check if already registered
          const isDuplicate = await checkDuplicateRegistration(email);
          if (isDuplicate) {
            failed++;
            continue;
          }

          // Send invitation email
          await supabase.functions.invoke('send-registration-confirmation', {
            body: {
              attendeeEmail: email,
              eventName: eventData?.name || 'Event',
              eventDate: eventData?.start_date,
              ticketType: tier.name,
              isInvitation: true,
              registrationLink: eventData?.landing_page_slug 
                ? `/e/${eventData.landing_page_slug}` 
                : `/events/${eventId}`
            }
          });

          sent++;
        } catch (error) {
          console.error(`Failed to send invitation to ${email}:`, error);
          failed++;
        }
      }

      return { sent, failed };
    } catch (error) {
      console.error('Error sending bulk invitations:', error);
      return { sent, failed: data.emails.length - sent };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    ticketTiers,
    isLoading,
    isSubmitting,
    createManualRegistration,
    sendBulkInvitations,
    refreshTicketTiers: fetchTicketTiers
  };
}
