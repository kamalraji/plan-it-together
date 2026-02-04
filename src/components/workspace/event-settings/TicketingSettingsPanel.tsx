import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/looseClient';
import { RegistrationSettingsCard } from '@/components/events/settings/RegistrationSettingsCard';
import { Loader2 } from 'lucide-react';

interface TicketingSettingsPanelProps {
  eventId: string;
}

export const TicketingSettingsPanel: React.FC<TicketingSettingsPanelProps> = ({ eventId }) => {
  const { data: event, isLoading, refetch } = useQuery({
    queryKey: ['event-branding', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, branding')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Event not found
      </div>
    );
  }

  const branding = (event.branding as Record<string, any>) || {};

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Registration & Ticketing</h2>
        <p className="text-sm text-muted-foreground">
          Manage registration settings, ticket tiers, and group purchases for this event.
        </p>
      </div>

      <RegistrationSettingsCard 
        eventId={eventId} 
        branding={branding} 
        onUpdate={() => refetch()} 
      />
    </div>
  );
};
