import React from 'react';
import { useRootPublishRequirements } from '@/hooks/useRootPublishRequirements';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, Layout, Ticket, Search, Accessibility, ShieldCheck, Loader2 } from 'lucide-react';

interface PublishRequirementsCardProps {
  eventId: string;
}

/**
 * Read-only card displaying ROOT workspace publish requirements.
 * Used by child workspaces to see what's required before publishing.
 */
export const PublishRequirementsCard: React.FC<PublishRequirementsCardProps> = ({ eventId }) => {
  const { data, isLoading } = useRootPublishRequirements(eventId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data?.rootWorkspaceId) {
    return null;
  }

  const { publishRequirements, requiresApproval, approverRoles, rootWorkspaceName } = data;

  const requirements = [
    { 
      key: 'landingPage', 
      label: 'Landing Page', 
      required: publishRequirements.requireLandingPage,
      icon: Layout 
    },
    { 
      key: 'ticketing', 
      label: 'Ticketing & Registration', 
      required: publishRequirements.requireTicketingConfig,
      icon: Ticket 
    },
    { 
      key: 'seo', 
      label: 'SEO Settings', 
      required: publishRequirements.requireSEO,
      icon: Search 
    },
    { 
      key: 'accessibility', 
      label: 'Accessibility', 
      required: publishRequirements.requireAccessibility,
      icon: Accessibility 
    },
  ];

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Publish Requirements</CardTitle>
          <Badge variant="outline" className="text-xs ml-auto">Read-only</Badge>
        </div>
        <CardDescription className="text-xs">
          Configured by {rootWorkspaceName || 'ROOT workspace'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Requirements List */}
        <div className="space-y-2">
          {requirements.map(({ key, label, required, icon: Icon }) => (
            <div 
              key={key} 
              className="flex items-center gap-3 text-sm"
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1">{label}</span>
              <Badge 
                variant={required ? 'default' : 'secondary'}
                className={required ? 'bg-primary/10 text-primary hover:bg-primary/20' : ''}
              >
                {required ? 'Required' : 'Optional'}
              </Badge>
            </div>
          ))}
        </div>

        {/* Approval Info */}
        <div className="pt-2 mt-2 border-t">
          <div className="flex items-center gap-2 text-sm">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Approval Required:</span>
            <Badge variant={requiresApproval ? 'default' : 'secondary'}>
              {requiresApproval ? 'Yes' : 'No'}
            </Badge>
          </div>
          {requiresApproval && approverRoles.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1 ml-6">
              Approvers: {approverRoles.map(r => r.replace(/_/g, ' ')).join(', ')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
