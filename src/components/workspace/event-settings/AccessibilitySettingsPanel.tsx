import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/looseClient';
import { AccessibilitySettingsCard } from '@/components/events/settings/AccessibilitySettingsCard';
import { Loader2 } from 'lucide-react';

interface AccessibilitySettingsPanelProps {
  eventId: string;
}

export const AccessibilitySettingsPanel: React.FC<AccessibilitySettingsPanelProps> = ({ eventId }) => {
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
        <h2 className="text-lg font-semibold">Accessibility & Requirements</h2>
        <p className="text-sm text-muted-foreground">
          Configure accessibility features and age requirements for your event.
        </p>
      </div>

      <AccessibilitySettingsCard 
        eventId={eventId} 
        branding={branding} 
        onUpdate={() => refetch()} 
      />
    </div>
  );
};
