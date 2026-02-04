/**
 * EventChannelsPage - Participant-facing event channels page
 * 
 * Route: /event/:eventId/channels
 * Provides participants with access to event communication channels
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ParticipantChannelView } from '@/components/participant/ParticipantChannelView';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';

export default function EventChannelsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  // Fetch event details
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event-details', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          name,
          slug,
          start_date,
          end_date,
          branding,
          organization_id
        `)
        .eq('id', eventId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  // Check if user has confirmed registration
  const { data: registration, isLoading: regLoading } = useQuery({
    queryKey: ['my-registration', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;

      const { data, error } = await supabase
        .from('registrations')
        .select('id, status')
        .eq('event_id', eventId)
        .eq('user_id', userData.user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!eventId,
  });

  const isLoading = eventLoading || regLoading;
  const isConfirmed = registration?.status === 'CONFIRMED';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Event Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The event you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/events')}>
            Browse Events
          </Button>
        </div>
      </div>
    );
  }

  if (!isConfirmed) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/event/${event.slug || eventId}`)}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Event
          </Button>

          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <Users className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Registration Required</h1>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              You need a confirmed registration to access event channels. 
              Register for this event to join the conversation.
            </p>
            <Button onClick={() => navigate(`/event/${event.slug || eventId}`)}>
              Register for Event
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Event Header */}
      <div className="bg-card border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(`/event/${event.slug || eventId}`)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold truncate">{event.name}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {event.start_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(event.start_date), 'MMM d, yyyy')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Channel View */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <ParticipantChannelView 
          eventId={eventId!}
          onBack={() => navigate(`/event/${event.slug || eventId}`)}
        />
      </div>
    </div>
  );
}
