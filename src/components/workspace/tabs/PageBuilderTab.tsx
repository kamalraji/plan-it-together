
import { useNavigate, useParams } from 'react-router-dom';
import { Workspace } from '@/types';
import { useWorkspacePageResponsibility } from '@/hooks/usePageBuildingResponsibilities';
import { Button } from '@/components/ui/button';
import { Paintbrush, Lock, ExternalLink, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PageBuilderTabProps {
  workspace: Workspace;
}

export function PageBuilderTab({ workspace }: PageBuilderTabProps) {
  const navigate = useNavigate();
  const { orgSlug } = useParams<{ orgSlug: string }>();
  
  const { data: responsibility, isLoading } = useWorkspacePageResponsibility(workspace.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!responsibility?.hasResponsibility) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-6">
        <div className="p-4 bg-muted rounded-full mb-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No Page Building Responsibility
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          This workspace hasn't been assigned page building responsibilities yet. 
          Contact the Root workspace owner to request access.
        </p>
      </div>
    );
  }

  const handleOpenPageBuilder = () => {
    if (!workspace.eventId || !orgSlug) return;
    navigate(`/${orgSlug}/eventmanagement/${workspace.eventId}/pagebuilder`);
  };

  const getPageTypeLabel = (type: string) => {
    switch (type) {
      case 'LANDING_PAGE': return 'Landing Page';
      case 'REGISTRATION_PAGE': return 'Registration Page';
      case 'SCHEDULE_PAGE': return 'Schedule Page';
      case 'SPEAKERS_PAGE': return 'Speakers Page';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Paintbrush className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Page Builder</h2>
              <p className="text-sm text-muted-foreground">
                Edit and manage the event {getPageTypeLabel(responsibility.responsibilityType || '')}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
            Assigned
          </Badge>
        </div>

        {/* Responsibility Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Page Type</p>
            <p className="text-sm font-medium text-foreground">
              {getPageTypeLabel(responsibility.responsibilityType || '')}
            </p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Event ID</p>
            <p className="text-sm font-medium text-foreground font-mono">
              {responsibility.eventId?.slice(0, 8)}...
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-6">
          <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-600 mb-1">Collaborative Editing</p>
            <p className="text-muted-foreground">
              All changes made in the page builder are tracked with your workspace attribution. 
              Other team members can see who made changes and when.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <Button onClick={handleOpenPageBuilder} className="w-full sm:w-auto gap-2">
          <ExternalLink className="h-4 w-4" />
          Open Page Builder
        </Button>
      </div>

      {/* Tips Section */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Quick Tips</h3>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            Drag and drop components from the left panel to build your page
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            Use the right panel to customize styles and properties
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            Preview your changes before saving using the Preview button
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            Choose from pre-built templates to get started quickly
          </li>
        </ul>
      </div>
    </div>
  );
}
