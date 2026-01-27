import React from 'react';
import { PromoCodeManager } from '@/components/events/settings/PromoCodeManager';

interface PromoCodesSettingsPanelProps {
  eventId: string;
}

export const PromoCodesSettingsPanel: React.FC<PromoCodesSettingsPanelProps> = ({ eventId }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Promo Codes</h2>
        <p className="text-sm text-muted-foreground">
          Create and manage discount codes for this event.
        </p>
      </div>

      <PromoCodeManager eventId={eventId} />
    </div>
  );
};
