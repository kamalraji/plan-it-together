import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface WaitlistEntry {
  id: string;
  eventId: string;
  ticketTierId: string | null;
  ticketTierName: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  position: number;
  priority: 'normal' | 'high' | 'vip';
  source: 'website' | 'referral' | 'manual';
  notes: string | null;
  status: 'waiting' | 'invited' | 'promoted' | 'expired' | 'removed';
  createdAt: Date;
}

export interface WaitlistStats {
  totalWaiting: number;
  priorityCount: number;
  avgWaitDays: number;
  invitedToday: number;
}

export interface TicketAvailability {
  tierId: string;
  tierName: string;
  available: number;
  waitlisted: number;
}

interface TicketTier {
  id: string;
  name: string;
}

interface UseWaitlistProps {
  eventId: string;
}

export function useWaitlist({ eventId }: UseWaitlistProps) {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [stats, setStats] = useState<WaitlistStats>({
    totalWaiting: 0,
    priorityCount: 0,
    avgWaitDays: 0,
    invitedToday: 0,
  });
  const [ticketAvailability, setTicketAvailability] = useState<TicketAvailability[]>([]);
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch waitlist entries
  const fetchWaitlist = useCallback(async () => {
    if (!eventId) return;

    try {
      const { data, error } = await supabase
        .from('event_waitlist')
        .select(`
          id,
          event_id,
          ticket_tier_id,
          full_name,
          email,
          phone,
          position,
          priority,
          source,
          notes,
          status,
          created_at,
          ticket_tiers (name)
        `)
        .eq('event_id', eventId)
        .eq('status', 'waiting')
        .order('position', { ascending: true });

      if (error) throw error;

      const entries: WaitlistEntry[] = (data || []).map((entry: any) => ({
        id: entry.id,
        eventId: entry.event_id,
        ticketTierId: entry.ticket_tier_id,
        ticketTierName: entry.ticket_tiers?.name || null,
        fullName: entry.full_name,
        email: entry.email,
        phone: entry.phone,
        position: entry.position,
        priority: entry.priority as 'normal' | 'high' | 'vip',
        source: entry.source as 'website' | 'referral' | 'manual',
        notes: entry.notes,
        status: entry.status as 'waiting',
        createdAt: new Date(entry.created_at),
      }));

      setWaitlist(entries);
    } catch (error) {
      console.error('Error fetching waitlist:', error);
    }
  }, [eventId]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!eventId) return;

    try {
      // Get all waiting entries for stats calculation
      const { data: waitingData, error: waitingError } = await supabase
        .from('event_waitlist')
        .select('priority, created_at')
        .eq('event_id', eventId)
        .eq('status', 'waiting');

      if (waitingError) throw waitingError;

      // Get invited today count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: invitedCount, error: invitedError } = await supabase
        .from('event_waitlist')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('status', 'invited')
        .gte('invited_at', today.toISOString());

      if (invitedError) throw invitedError;

      const entries = waitingData || [];
      const priorityCount = entries.filter(
        e => e.priority === 'high' || e.priority === 'vip'
      ).length;

      // Calculate average wait time in days
      const now = new Date();
      const totalDays = entries.reduce((sum, entry) => {
        const createdAt = new Date(entry.created_at);
        const diffTime = Math.abs(now.getTime() - createdAt.getTime());
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return sum + diffDays;
      }, 0);
      const avgWaitDays = entries.length > 0 ? totalDays / entries.length : 0;

      setStats({
        totalWaiting: entries.length,
        priorityCount,
        avgWaitDays: Math.round(avgWaitDays * 10) / 10,
        invitedToday: invitedCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [eventId]);

  // Fetch ticket tiers and availability
  const fetchTicketAvailability = useCallback(async () => {
    if (!eventId) return;

    try {
      // Get ticket tiers
      const { data: tiersData, error: tiersError } = await supabase
        .from('ticket_tiers')
        .select('id, name, quantity, sold_count')
        .eq('event_id', eventId)
        .eq('is_active', true);

      if (tiersError) throw tiersError;

      const tiers = tiersData || [];
      setTicketTiers(tiers.map(t => ({ id: t.id, name: t.name })));

      // Get waitlist counts per tier
      const { data: waitlistCounts, error: waitlistError } = await supabase
        .from('event_waitlist')
        .select('ticket_tier_id')
        .eq('event_id', eventId)
        .eq('status', 'waiting');

      if (waitlistError) throw waitlistError;

      const availability: TicketAvailability[] = tiers.map(tier => {
        const waitlisted = (waitlistCounts || []).filter(
          w => w.ticket_tier_id === tier.id
        ).length;
        const available = (tier.quantity || 9999) - (tier.sold_count || 0);

        return {
          tierId: tier.id,
          tierName: tier.name,
          available: Math.max(0, available),
          waitlisted,
        };
      });

      setTicketAvailability(availability);
    } catch (error) {
      console.error('Error fetching ticket availability:', error);
    }
  }, [eventId]);

  // Move entry up in queue
  const moveUp = async (entryId: string) => {
    const entry = waitlist.find(e => e.id === entryId);
    if (!entry || entry.position <= 1) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase.rpc('reorder_waitlist_positions', {
        p_event_id: eventId,
        p_entry_id: entryId,
        p_new_position: entry.position - 1,
      });

      if (error) throw error;
      await fetchWaitlist();
    } catch (error) {
      console.error('Error moving entry up:', error);
      toast.error('Failed to move entry');
    } finally {
      setIsProcessing(false);
    }
  };

  // Move entry down in queue
  const moveDown = async (entryId: string) => {
    const entry = waitlist.find(e => e.id === entryId);
    if (!entry || entry.position >= waitlist.length) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase.rpc('reorder_waitlist_positions', {
        p_event_id: eventId,
        p_entry_id: entryId,
        p_new_position: entry.position + 1,
      });

      if (error) throw error;
      await fetchWaitlist();
    } catch (error) {
      console.error('Error moving entry down:', error);
      toast.error('Failed to move entry');
    } finally {
      setIsProcessing(false);
    }
  };

  // Promote entry to confirmed registration
  const promoteEntry = async (entryId: string) => {
    const entry = waitlist.find(e => e.id === entryId);
    if (!entry) return;

    setIsProcessing(true);
    try {
      // Check availability
      const tierAvailability = ticketAvailability.find(
        t => t.tierId === entry.ticketTierId
      );
      if (tierAvailability && tierAvailability.available <= 0) {
        toast.error('No spots available for this ticket type');
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to promote entries');
        return;
      }

      // Create registration
      const { data: registration, error: regError } = await supabase
        .from('registrations')
        .insert({
          event_id: eventId,
          user_id: user.id,
          ticket_tier_id: entry.ticketTierId,
          status: 'CONFIRMED',
          quantity: 1,
          form_responses: {
            promoted_from_waitlist: true,
            waitlist_entry_id: entryId,
          },
        })
        .select('id')
        .single();

      if (regError) throw regError;

      // Create attendee record
      const { error: attendeeError } = await supabase
        .from('registration_attendees')
        .insert({
          registration_id: registration.id,
          full_name: entry.fullName,
          email: entry.email,
          phone: entry.phone,
          ticket_tier_id: entry.ticketTierId,
          is_primary: true,
        });

      if (attendeeError) throw attendeeError;

      // Update waitlist entry status
      const { error: updateError } = await supabase
        .from('event_waitlist')
        .update({
          status: 'promoted',
          promoted_at: new Date().toISOString(),
          registration_id: registration.id,
        })
        .eq('id', entryId);

      if (updateError) throw updateError;

      // Reorder remaining positions
      await reorderPositionsAfterRemoval(entry.position);

      toast.success('Attendee promoted!', {
        description: `${entry.fullName} has been moved to confirmed registrations`,
      });

      await Promise.all([fetchWaitlist(), fetchStats(), fetchTicketAvailability()]);
    } catch (error) {
      console.error('Error promoting entry:', error);
      toast.error('Failed to promote entry');
    } finally {
      setIsProcessing(false);
    }
  };

  // Remove entry from waitlist
  const removeEntry = async (entryId: string) => {
    const entry = waitlist.find(e => e.id === entryId);
    if (!entry) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('event_waitlist')
        .update({ status: 'removed' })
        .eq('id', entryId);

      if (error) throw error;

      // Reorder remaining positions
      await reorderPositionsAfterRemoval(entry.position);

      toast.info('Removed from waitlist', {
        description: `${entry.fullName} has been removed`,
      });

      await Promise.all([fetchWaitlist(), fetchStats()]);
    } catch (error) {
      console.error('Error removing entry:', error);
      toast.error('Failed to remove entry');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reorder positions after removal
  const reorderPositionsAfterRemoval = async (removedPosition: number) => {
    // Get entries that need position updates
    const { data } = await supabase
      .from('event_waitlist')
      .select('id, position')
      .eq('event_id', eventId)
      .eq('status', 'waiting')
      .gt('position', removedPosition)
      .order('position', { ascending: true });

    if (data) {
      for (let i = 0; i < data.length; i++) {
        await supabase
          .from('event_waitlist')
          .update({ position: removedPosition + i })
          .eq('id', data[i].id);
      }
    }
  };

  // Send invites to available spots
  const sendInvites = async () => {
    const totalAvailable = ticketAvailability.reduce((sum, t) => sum + t.available, 0);
    const toInvite = Math.min(totalAvailable, waitlist.length);

    if (toInvite === 0) {
      toast.info('No spots available to send invites');
      return;
    }

    setIsProcessing(true);
    try {
      const entriesToInvite = waitlist.slice(0, toInvite);
      
      const { error } = await supabase
        .from('event_waitlist')
        .update({
          status: 'invited',
          invited_at: new Date().toISOString(),
        })
        .in('id', entriesToInvite.map(e => e.id));

      if (error) throw error;

      toast.success('Invitations sent!', {
        description: `Sent to top ${toInvite} waitlisted attendees`,
      });

      await Promise.all([fetchWaitlist(), fetchStats()]);
    } catch (error) {
      console.error('Error sending invites:', error);
      toast.error('Failed to send invites');
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk promote selected entries
  const bulkPromote = async (entryIds: string[]) => {
    setIsProcessing(true);
    let successCount = 0;

    try {
      for (const entryId of entryIds) {
        const entry = waitlist.find(e => e.id === entryId);
        if (!entry) continue;

        try {
          // Get current user
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) continue;

          // Create registration
          const { data: registration, error: regError } = await supabase
            .from('registrations')
            .insert({
              event_id: eventId,
              user_id: user.id,
              ticket_tier_id: entry.ticketTierId,
              status: 'CONFIRMED',
              quantity: 1,
              form_responses: {
                promoted_from_waitlist: true,
                waitlist_entry_id: entryId,
              },
            })
            .select('id')
            .single();

          if (regError) continue;

          // Create attendee
          await supabase.from('registration_attendees').insert({
            registration_id: registration.id,
            full_name: entry.fullName,
            email: entry.email,
            phone: entry.phone,
            ticket_tier_id: entry.ticketTierId,
            is_primary: true,
          });

          // Update waitlist status
          await supabase
            .from('event_waitlist')
            .update({
              status: 'promoted',
              promoted_at: new Date().toISOString(),
              registration_id: registration.id,
            })
            .eq('id', entryId);

          successCount++;
        } catch (err) {
          console.error('Error promoting entry:', err);
        }
      }

      toast.success(`${successCount} attendees promoted!`);
      await Promise.all([fetchWaitlist(), fetchStats(), fetchTicketAvailability()]);
    } catch (error) {
      console.error('Error in bulk promote:', error);
      toast.error('Failed to promote some entries');
    } finally {
      setIsProcessing(false);
    }
  };

  // Add entry to waitlist
  const addToWaitlist = async (data: {
    fullName: string;
    email: string;
    phone?: string;
    ticketTierId?: string;
    priority?: 'normal' | 'high' | 'vip';
    notes?: string;
  }) => {
    setIsProcessing(true);
    try {
      // Get next position
      const nextPosition = waitlist.length + 1;

      const { error } = await supabase.from('event_waitlist').insert({
        event_id: eventId,
        ticket_tier_id: data.ticketTierId || null,
        full_name: data.fullName,
        email: data.email,
        phone: data.phone || null,
        position: nextPosition,
        priority: data.priority || 'normal',
        source: 'manual',
        notes: data.notes || null,
        status: 'waiting',
      });

      if (error) throw error;

      toast.success('Added to waitlist', {
        description: `${data.fullName} has been added at position #${nextPosition}`,
      });

      await Promise.all([fetchWaitlist(), fetchStats()]);
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      toast.error('Failed to add to waitlist');
    } finally {
      setIsProcessing(false);
    }
  };

  // Refetch all data
  const refetch = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchWaitlist(), fetchStats(), fetchTicketAvailability()]);
    setIsLoading(false);
  }, [fetchWaitlist, fetchStats, fetchTicketAvailability]);

  // Initial fetch
  useEffect(() => {
    if (eventId) {
      refetch();
    }
  }, [eventId, refetch]);

  return {
    waitlist,
    stats,
    ticketAvailability,
    ticketTiers,
    isLoading,
    isProcessing,
    moveUp,
    moveDown,
    promoteEntry,
    removeEntry,
    sendInvites,
    bulkPromote,
    addToWaitlist,
    refetch,
  };
}
