import React from 'react';
import { Workspace, WorkspaceRole } from '@/types';
import { useEventSettingsAccess, CommitteeType } from '@/hooks/useEventSettingsAccess';
import { useWorkspacePageResponsibility } from '@/hooks/usePageBuildingResponsibilities';
import { TicketingSettingsPanel } from './TicketingSettingsPanel';
import { PromoCodesSettingsPanel } from './PromoCodesSettingsPanel';
import { SEOSettingsPanel } from './SEOSettingsPanel';
import { AccessibilitySettingsPanel } from './AccessibilitySettingsPanel';
import { AllEventSettingsPanel } from './AllEventSettingsPanel';
import { LandingPageSettingsPanel } from './LandingPageSettingsPanel';
import { AlertCircle, Settings, Ticket, BadgePercent, Search, Accessibility, Paintbrush, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EventSettingsTabContentProps {
  workspace: Workspace;
  userRole: WorkspaceRole | null | undefined;
}

// Map committee types to their assigned settings
const COMMITTEE_SETTINGS_MAP: Record<CommitteeType, { 
  label: string; 
  description: string; 
  icon: React.ReactNode;
  settingType: 'ticketing' | 'promo_codes' | 'seo' | 'accessibility' | 'landing_page';
}[]> = {
  registration: [
    { label: 'Ticketing', description: 'Manage ticket tiers, pricing, and registration forms', icon: <Ticket className="h-4 w-4" />, settingType: 'ticketing' }
  ],
  finance: [
    { label: 'Promo Codes', description: 'Create and manage discount codes and promotions', icon: <BadgePercent className="h-4 w-4" />, settingType: 'promo_codes' }
  ],
  marketing: [
    { label: 'SEO', description: 'Optimize search engine visibility and meta tags', icon: <Search className="h-4 w-4" />, settingType: 'seo' }
  ],
  logistics: [
    { label: 'Accessibility', description: 'Configure accessibility options and accommodations', icon: <Accessibility className="h-4 w-4" />, settingType: 'accessibility' }
  ],
  event: [
    { label: 'Accessibility', description: 'Configure accessibility options and accommodations', icon: <Accessibility className="h-4 w-4" />, settingType: 'accessibility' }
  ],
  content: [
    { label: 'Landing Page', description: 'Design and edit the event landing page', icon: <Paintbrush className="h-4 w-4" />, settingType: 'landing_page' }
  ],
  unknown: []
};

export const EventSettingsTabContent: React.FC<EventSettingsTabContentProps> = ({
  workspace,
  userRole,
}) => {
  const eventId = workspace.eventId;
  
  // Check if this workspace has page building responsibility
  const { data: pageResponsibility } = useWorkspacePageResponsibility(workspace.id);
  const hasPageBuildingResponsibility = pageResponsibility?.hasResponsibility ?? false;
  
  const access = useEventSettingsAccess(workspace, userRole, hasPageBuildingResponsibility);

  // No event linked to workspace
  if (!eventId) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Event Linked</h3>
            <p className="text-muted-foreground">
              This workspace is not linked to an event. Event settings are only available for workspaces associated with events.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Root workspace or member with full access - show all settings in tabs
  if (access.canAccessAllSettings) {
    return (
      <div className="bg-card rounded-lg shadow-sm border border-border p-4 sm:p-6">
        <AllEventSettingsPanel 
          eventId={eventId} 
          workspaceId={workspace.id}
          isRootOwner={access.isRootOwner}
        />
      </div>
    );
  }

  // Collect all assigned settings for this workspace
  const assignedSettings: Array<{
    key: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    component: React.ReactNode;
  }> = [];

  // Check committee-specific assignments
  const committeeSettings = COMMITTEE_SETTINGS_MAP[access.committeeType] || [];
  
  for (const setting of committeeSettings) {
    if (setting.settingType === 'ticketing' && access.canAccessTicketing) {
      assignedSettings.push({
        key: 'ticketing',
        label: setting.label,
        description: setting.description,
        icon: setting.icon,
        component: <TicketingSettingsPanel eventId={eventId} />
      });
    }
    if (setting.settingType === 'promo_codes' && access.canAccessPromoCodes) {
      assignedSettings.push({
        key: 'promo_codes',
        label: setting.label,
        description: setting.description,
        icon: setting.icon,
        component: <PromoCodesSettingsPanel eventId={eventId} />
      });
    }
    if (setting.settingType === 'seo' && access.canAccessSEO) {
      assignedSettings.push({
        key: 'seo',
        label: setting.label,
        description: setting.description,
        icon: setting.icon,
        component: <SEOSettingsPanel eventId={eventId} />
      });
    }
    if (setting.settingType === 'accessibility' && access.canAccessAccessibility) {
      assignedSettings.push({
        key: 'accessibility',
        label: setting.label,
        description: setting.description,
        icon: setting.icon,
        component: <AccessibilitySettingsPanel eventId={eventId} />
      });
    }
  }

  // Check landing page responsibility (can be assigned to any workspace)
  if (access.canAccessLandingPage && hasPageBuildingResponsibility) {
    assignedSettings.push({
      key: 'landing_page',
      label: 'Landing Page',
      description: 'Design and edit the event landing page',
      icon: <Paintbrush className="h-4 w-4" />,
      component: <LandingPageSettingsPanel eventId={eventId} workspaceId={workspace.id} isRootOwner={false} />
    });
  }

  // No assigned settings - show helpful message
  if (assignedSettings.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Info className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Event Settings Assigned</h3>
            <p className="text-muted-foreground mb-4">
              This workspace doesn't have any event settings responsibilities assigned yet.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 text-left">
              <h4 className="text-sm font-medium mb-2">How settings are assigned:</h4>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span><strong>Registration</strong> committees manage Ticketing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span><strong>Finance</strong> committees manage Promo Codes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span><strong>Marketing</strong> committees manage SEO</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span><strong>Logistics/Event</strong> committees manage Accessibility</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span><strong>Landing Page</strong> can be assigned by the ROOT workspace owner</span>
                </li>
              </ul>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Contact your event organizer to request access or to have settings delegated to this workspace.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Single assigned setting - show directly
  if (assignedSettings.length === 1) {
    const setting = assignedSettings[0];
    return (
      <div className="space-y-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {setting.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{setting.label}</h3>
                  <Badge variant="secondary" className="text-xs">Assigned</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{setting.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="bg-card rounded-lg shadow-sm border border-border p-4 sm:p-6">
          {setting.component}
        </div>
      </div>
    );
  }

  // Multiple assigned settings - show in tabs
  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <span className="font-medium">Assigned Event Settings</span>
            <Badge variant="secondary">{assignedSettings.length} settings</Badge>
          </div>
        </CardContent>
      </Card>
      
      <div className="bg-card rounded-lg shadow-sm border border-border p-4 sm:p-6">
        <Tabs defaultValue={assignedSettings[0].key} className="w-full">
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted/50 p-1">
            {assignedSettings.map((setting) => (
              <TabsTrigger 
                key={setting.key} 
                value={setting.key}
                className="flex items-center gap-2 data-[state=active]:bg-background"
              >
                {setting.icon}
                <span>{setting.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          
          {assignedSettings.map((setting) => (
            <TabsContent key={setting.key} value={setting.key} className="mt-6">
              {setting.component}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};
