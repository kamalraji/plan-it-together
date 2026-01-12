import React from 'react';
import { Workspace, WorkspaceRole } from '@/types';
import { useEventSettingsAccess } from '@/hooks/useEventSettingsAccess';
import { useWorkspacePageResponsibility } from '@/hooks/usePageBuildingResponsibilities';
import { TicketingSettingsPanel } from './TicketingSettingsPanel';
import { PromoCodesSettingsPanel } from './PromoCodesSettingsPanel';
import { SEOSettingsPanel } from './SEOSettingsPanel';
import { AccessibilitySettingsPanel } from './AccessibilitySettingsPanel';
import { AllEventSettingsPanel } from './AllEventSettingsPanel';
import { LandingPageSettingsPanel } from './LandingPageSettingsPanel';
import { AlertCircle, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface EventSettingsTabContentProps {
  workspace: Workspace;
  userRole: WorkspaceRole | null | undefined;
}

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

  // Content/Marketing committees with landing page responsibility
  if (access.canAccessLandingPage && (access.committeeType === 'content' || access.committeeType === 'marketing')) {
    return (
      <div className="bg-card rounded-lg shadow-sm border border-border p-4 sm:p-6">
        <LandingPageSettingsPanel 
          eventId={eventId} 
          workspaceId={workspace.id}
          isRootOwner={false}
        />
      </div>
    );
  }

  // Committee-specific panels based on detected type
  if (access.canAccessTicketing && access.committeeType === 'registration') {
    return (
      <div className="bg-card rounded-lg shadow-sm border border-border p-4 sm:p-6">
        <TicketingSettingsPanel eventId={eventId} />
      </div>
    );
  }

  if (access.canAccessPromoCodes && access.committeeType === 'finance') {
    return (
      <div className="bg-card rounded-lg shadow-sm border border-border p-4 sm:p-6">
        <PromoCodesSettingsPanel eventId={eventId} />
      </div>
    );
  }

  if (access.canAccessSEO && access.committeeType === 'marketing') {
    return (
      <div className="bg-card rounded-lg shadow-sm border border-border p-4 sm:p-6">
        <SEOSettingsPanel eventId={eventId} />
      </div>
    );
  }

  if (access.canAccessAccessibility && (access.committeeType === 'logistics' || access.committeeType === 'event')) {
    return (
      <div className="bg-card rounded-lg shadow-sm border border-border p-4 sm:p-6">
        <AccessibilitySettingsPanel eventId={eventId} />
      </div>
    );
  }

  // No access - should not reach here if navigation is properly filtered
  return (
    <Card>
      <CardContent className="py-12">
        <div className="text-center">
          <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Settings Available</h3>
          <p className="text-muted-foreground">
            This workspace type doesn't have specific event settings to manage.
            Contact the workspace owner if you need access to event configuration.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
