import React from 'react';
import { Event } from '@/types';
import { RegistrationSettingsCard } from './RegistrationSettingsCard';
import { AccessibilitySettingsCard } from './AccessibilitySettingsCard';
import { SEOSettingsCard } from './SEOSettingsCard';
import { DangerZoneCard } from './DangerZoneCard';
import { useUrlTab } from '@/hooks/useUrlState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Shield, Search } from 'lucide-react';

interface EventSettingsTabProps {
  event: Event;
  onUpdate: () => void;
}

const SETTINGS_TABS = ['general', 'security', 'seo'] as const;
type SettingsTabValue = typeof SETTINGS_TABS[number];

export const EventSettingsTab: React.FC<EventSettingsTabProps> = ({ event, onUpdate }) => {
  const branding = (event.branding as Record<string, any>) || {};
  const [activeTab, setActiveTab] = useUrlTab<SettingsTabValue>('settingsTab', 'general', SETTINGS_TABS);

  return (
    <div className="space-y-6">
      {/* Settings Navigation Tabs - URL preserved */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SettingsTabValue)} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Access</span>
          </TabsTrigger>
          <TabsTrigger value="seo" className="gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">SEO</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="mt-6 space-y-6">
          <RegistrationSettingsCard
            eventId={event.id}
            branding={branding}
            onUpdate={onUpdate}
          />
        </TabsContent>

        {/* Security & Access Tab */}
        <TabsContent value="security" className="mt-6 space-y-6">
          <AccessibilitySettingsCard
            eventId={event.id}
            branding={branding}
            onUpdate={onUpdate}
          />
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="mt-6 space-y-6">
          <SEOSettingsCard
            eventId={event.id}
            branding={branding}
            eventName={event.name}
            onUpdate={onUpdate}
          />
        </TabsContent>
      </Tabs>

      {/* Danger Zone - Always visible at bottom */}
      <DangerZoneCard
        eventId={event.id}
        eventName={event.name}
        currentStatus={event.status}
        onUpdate={onUpdate}
      />
    </div>
  );
};
