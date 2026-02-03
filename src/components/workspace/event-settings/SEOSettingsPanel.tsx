import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/looseClient';
import { SEOSettingsCard } from '@/components/events/settings/SEOSettingsCard';
import { Loader2 } from 'lucide-react';

interface SEOSettingsPanelProps {
  eventId: string;
}

export const SEOSettingsPanel: React.FC<SEOSettingsPanelProps> = ({ eventId }) => {
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
        <h2 className="text-lg font-semibold">SEO & Discovery</h2>
        <p className="text-sm text-muted-foreground">
          Optimize your event's visibility in search engines.
        </p>
      </div>

      <SEOSettingsCard 
        eventId={eventId} 
        branding={branding} 
        eventName={event.name}
        onUpdate={() => refetch()} 
      />
    </div>
  );
};
