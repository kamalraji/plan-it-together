
import { useNavigate, useParams } from 'react-router-dom';
import { useWorkspacePageResponsibility } from '@/hooks/usePageBuildingResponsibilities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Paintbrush, ExternalLink, Clock, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageBuilderStatusCardProps {
  workspaceId: string;
  eventId?: string;
  className?: string;
}

export function PageBuilderStatusCard({ workspaceId, eventId, className }: PageBuilderStatusCardProps) {
  const navigate = useNavigate();
  const { orgSlug } = useParams<{ orgSlug: string }>();
  
  const { data: responsibility, isLoading } = useWorkspacePageResponsibility(workspaceId);

  if (isLoading) {
    return (
      <div className={cn("bg-card border border-border rounded-xl p-4 animate-pulse", className)}>
        <div className="h-4 bg-muted rounded w-1/3 mb-2" />
        <div className="h-3 bg-muted rounded w-2/3" />
      </div>
    );
  }

  const handleOpenPageBuilder = () => {
    if (!eventId || !orgSlug) return;
    navigate(`/${orgSlug}/eventmanagement/${eventId}/pagebuilder`);
  };

  const getPageTypeLabel = (type: string | null) => {
    if (!type) return 'Page';
    switch (type) {
      case 'LANDING_PAGE': return 'Landing Page';
      case 'REGISTRATION_PAGE': return 'Registration';
      case 'SCHEDULE_PAGE': return 'Schedule';
      case 'SPEAKERS_PAGE': return 'Speakers';
      default: return type;
    }
  };

  if (!responsibility?.hasResponsibility) {
    return (
      <div className={cn("bg-card border border-border rounded-xl p-4", className)}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg">
            <Lock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Page Builder</p>
            <p className="text-xs text-muted-foreground">Not assigned to this workspace</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-card border border-border rounded-xl p-4", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Paintbrush className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">Page Builder</p>
              <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20">
                Assigned
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {getPageTypeLabel(responsibility.responsibilityType)}
            </p>
          </div>
        </div>
        
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleOpenPageBuilder}
          className="gap-1.5 shrink-0"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Edit</span>
        </Button>
      </div>

      {/* Last edited info - placeholder for future */}
      <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>Ready to edit</span>
      </div>
    </div>
  );
}
