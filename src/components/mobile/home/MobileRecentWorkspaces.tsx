import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  ChevronRight, 
  Utensils, 
  Megaphone, 
  Users, 
  Palette,
  Mic,
  DollarSign,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Workspace {
  id: string;
  name: string;
  workspace_type: string;
  event_id: string;
  slug: string | null;
}

interface MobileRecentWorkspacesProps {
  workspaces: Workspace[];
  orgSlug: string;
}

const workspaceTypeIcons: Record<string, React.ElementType> = {
  CATERING: Utensils,
  MARKETING: Megaphone,
  VOLUNTEERS: Users,
  DESIGN: Palette,
  SPEAKERS: Mic,
  FINANCE: DollarSign,
  SECURITY: Shield,
};

const workspaceTypeColors: Record<string, { icon: string; bg: string }> = {
  CATERING: { icon: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  MARKETING: { icon: 'text-pink-600', bg: 'bg-pink-100 dark:bg-pink-900/30' },
  VOLUNTEERS: { icon: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  DESIGN: { icon: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  SPEAKERS: { icon: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  FINANCE: { icon: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  SECURITY: { icon: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
};

export const MobileRecentWorkspaces: React.FC<MobileRecentWorkspacesProps> = ({
  workspaces,
  orgSlug,
}) => {
  const navigate = useNavigate();

  if (workspaces.length === 0) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">My Workspaces</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground text-xs h-8"
          onClick={() => navigate(`/${orgSlug}/workspaces`)}
        >
          View All
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Workspace Grid */}
      <div className="grid grid-cols-2 gap-2 p-3">
        {workspaces.slice(0, 4).map((workspace) => {
          const Icon = workspaceTypeIcons[workspace.workspace_type] || Briefcase;
          const colors = workspaceTypeColors[workspace.workspace_type] || { 
            icon: 'text-muted-foreground', 
            bg: 'bg-muted dark:bg-foreground/80/50' 
          };

          return (
            <button
              key={workspace.id}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl",
                "border border-border bg-background hover:bg-accent/50",
                "transition-all duration-200 active:scale-95"
              )}
              onClick={() => navigate(`/${orgSlug}/workspaces/${workspace.id}`)}
            >
              <div className={cn("p-3 rounded-xl", colors.bg)}>
                <Icon className={cn("h-5 w-5", colors.icon)} />
              </div>
              <span className="text-xs font-medium text-foreground text-center line-clamp-2">
                {workspace.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Show More */}
      {workspaces.length > 4 && (
        <button
          className="w-full py-3 text-center text-sm text-primary font-medium hover:bg-accent/50 transition-colors border-t border-border"
          onClick={() => navigate(`/${orgSlug}/workspaces`)}
        >
          +{workspaces.length - 4} more workspaces
        </button>
      )}
    </div>
  );
};
