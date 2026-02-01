import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/looseClient';
import { RegistrationSettingsCard } from '@/components/events/settings/RegistrationSettingsCard';
import { PromoCodeManager } from '@/components/events/settings/PromoCodeManager';
import { SEOSettingsCard } from '@/components/events/settings/SEOSettingsCard';
import { AccessibilitySettingsCard } from '@/components/events/settings/AccessibilitySettingsCard';
import { LandingPageSettingsPanel } from './LandingPageSettingsPanel';
import { CertificatesSettingsPanel } from './CertificatesSettingsPanel';
import { EventOverviewPanel } from './EventOverviewPanel';
import { EventStatusHistory } from '@/components/events/publish/EventStatusHistory';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TicketIcon, Tag, SearchIcon, AccessibilityIcon, Paintbrush, Award, LayoutDashboard, Clock } from 'lucide-react';

interface AllEventSettingsPanelProps {
  eventId: string;
  workspaceId: string;
  isRootOwner?: boolean;
}

export const AllEventSettingsPanel: React.FC<AllEventSettingsPanelProps> = ({ 
  eventId, 
  workspaceId,
  isRootOwner = true,
}) => {
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
        <h2 className="text-lg font-semibold">Event Space</h2>
        <p className="text-sm text-muted-foreground">
          Manage your event lifecycle, publishing, and configuration from this central hub.
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <div className="overflow-x-auto -mx-1 px-1">
          <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-8">
            <TabsTrigger value="overview" className="flex items-center gap-2 whitespace-nowrap">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="landing-page" className="flex items-center gap-2 whitespace-nowrap">
              <Paintbrush className="h-4 w-4" />
              <span className="hidden sm:inline">Landing Page</span>
            </TabsTrigger>
            <TabsTrigger value="ticketing" className="flex items-center gap-2 whitespace-nowrap">
              <TicketIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Ticketing</span>
            </TabsTrigger>
            <TabsTrigger value="promo" className="flex items-center gap-2 whitespace-nowrap">
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">Promo Codes</span>
            </TabsTrigger>
            <TabsTrigger value="seo" className="flex items-center gap-2 whitespace-nowrap">
              <SearchIcon className="h-4 w-4" />
              <span className="hidden sm:inline">SEO</span>
            </TabsTrigger>
            <TabsTrigger value="accessibility" className="flex items-center gap-2 whitespace-nowrap">
              <AccessibilityIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Accessibility</span>
            </TabsTrigger>
            <TabsTrigger value="certificates" className="flex items-center gap-2 whitespace-nowrap">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Certificates</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2 whitespace-nowrap">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <EventOverviewPanel
            eventId={eventId}
            workspaceId={workspaceId}
            isRootOwner={isRootOwner}
          />
        </TabsContent>

        <TabsContent value="landing-page" className="mt-6 space-y-6">
          <LandingPageSettingsPanel 
            eventId={eventId} 
            workspaceId={workspaceId}
            isRootOwner={isRootOwner}
          />
        </TabsContent>

        <TabsContent value="ticketing" className="mt-6 space-y-6">
          <RegistrationSettingsCard 
            eventId={eventId} 
            branding={branding} 
            onUpdate={() => refetch()} 
          />
        </TabsContent>

        <TabsContent value="promo" className="mt-6 space-y-6">
          <PromoCodeManager eventId={eventId} />
        </TabsContent>

        <TabsContent value="seo" className="mt-6 space-y-6">
          <SEOSettingsCard 
            eventId={eventId} 
            branding={branding} 
            eventName={event.name}
            onUpdate={() => refetch()} 
          />
        </TabsContent>

        <TabsContent value="accessibility" className="mt-6 space-y-6">
          <AccessibilitySettingsCard 
            eventId={eventId} 
            branding={branding} 
            onUpdate={() => refetch()} 
          />
        </TabsContent>

        <TabsContent value="certificates" className="mt-6 space-y-6">
          <CertificatesSettingsPanel 
            eventId={eventId}
            workspaceId={workspaceId}
            isRootOwner={isRootOwner}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-6 space-y-6">
          <EventStatusHistory eventId={eventId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
