import React from 'react';
import { Event } from '@/types';
import { RegistrationSettingsCard } from './RegistrationSettingsCard';
import { AccessibilitySettingsCard } from './AccessibilitySettingsCard';
import { SEOSettingsCard } from './SEOSettingsCard';
import { DangerZoneCard } from './DangerZoneCard';

interface EventSettingsTabProps {
  event: Event;
  onUpdate: () => void;
}

export const EventSettingsTab: React.FC<EventSettingsTabProps> = ({ event, onUpdate }) => {
  const branding = (event.branding as Record<string, any>) || {};

  return (
    <div className="space-y-6">
      {/* Settings Grid - 2 columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration & Ticketing */}
        <RegistrationSettingsCard
          eventId={event.id}
          branding={branding}
          onUpdate={onUpdate}
        />

        {/* SEO & Discovery */}
        <SEOSettingsCard
          eventId={event.id}
          branding={branding}
          eventName={event.name}
          onUpdate={onUpdate}
        />
      </div>

      {/* Accessibility - Full width */}
      <AccessibilitySettingsCard
        eventId={event.id}
        branding={branding}
        onUpdate={onUpdate}
      />

      {/* Danger Zone - Full width */}
      <DangerZoneCard
        eventId={event.id}
        eventName={event.name}
        currentStatus={event.status}
        onUpdate={onUpdate}
      />
    </div>
  );
};
