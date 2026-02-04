import { Users, CheckCircle2, Clock, AlertTriangle, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Workspace } from '@/types';
import { useCommitteeStats } from '@/hooks/useCommitteeStats';
import { LiveRegion, useLiveAnnouncement } from '@/components/accessibility/LiveRegion';
import { useEffect } from 'react';

interface CommitteeOverviewCardProps {
  committee: Workspace;
  onClick?: () => void;
}

export function CommitteeOverviewCard({ committee, onClick }: CommitteeOverviewCardProps) {
  const { data: stats, isLoading } = useCommitteeStats(committee.id);
  const { message: liveMessage, announce } = useLiveAnnouncement();
  
  // Default stats while loading or if no data
  const displayStats = stats || {
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    teamMembers: 0,
    completionRate: 0,
  };
  
  // Announce when data loads
  useEffect(() => {
    if (!isLoading && stats) {
      announce(`${committee.name} committee loaded. ${stats.completedTasks} of ${stats.totalTasks} tasks complete`);
    }
  }, [isLoading, stats, committee.name, announce]);

  // Determine health status based on real data
  const healthStatus = displayStats.overdueTasks > 2 ? 'critical' : displayStats.overdueTasks > 0 ? 'warning' : 'healthy';
  const healthConfig = {
    critical: { color: 'text-destructive', bgColor: 'bg-destructive/10', label: 'Needs Attention' },
    warning: { color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10', label: 'At Risk' },
    healthy: { color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10', label: 'On Track' },
  };

  const health = healthConfig[healthStatus];

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-4 animate-pulse">
        <div className="h-4 bg-muted rounded w-3/4 mb-2" />
        <div className="h-3 bg-muted rounded w-1/2 mb-4" />
        <div className="h-2 bg-muted rounded w-full mb-3" />
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onClick={onClick}
      role="article"
      aria-label={`${committee.name} committee. ${displayStats.completedTasks} of ${displayStats.totalTasks} tasks complete. Status: ${health.label}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <LiveRegion message={liveMessage} priority="polite" />
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-foreground truncate">{committee.name}</h4>
              <Badge variant="outline" className="text-[10px] px-1.5">
                Committee
              </Badge>
            </div>
            <div className={`flex items-center gap-1 mt-1 ${health.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${health.bgColor} ${health.color}`} 
                style={{ backgroundColor: healthStatus === 'healthy' ? 'rgb(16 185 129)' : healthStatus === 'warning' ? 'rgb(245 158 11)' : 'rgb(239 68 68)' }} 
              />
              <span className="text-xs font-medium">{health.label}</span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">{displayStats.completionRate}%</span>
          </div>
          <Progress value={displayStats.completionRate} className="h-1.5" />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-1.5 rounded bg-muted/50">
            <div className="flex items-center justify-center text-blue-600 dark:text-blue-400 mb-0.5">
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            </div>
            <p className="text-xs font-bold text-foreground">{displayStats.completedTasks}</p>
            <p className="text-[10px] text-muted-foreground">Done</p>
          </div>
          <div className="text-center p-1.5 rounded bg-muted/50">
            <div className="flex items-center justify-center text-amber-600 dark:text-amber-400 mb-0.5">
              <Clock className="h-3 w-3" aria-hidden="true" />
            </div>
            <p className="text-xs font-bold text-foreground">{displayStats.inProgressTasks}</p>
            <p className="text-[10px] text-muted-foreground">Active</p>
          </div>
          <div className="text-center p-1.5 rounded bg-muted/50">
            <div className={`flex items-center justify-center mb-0.5 ${displayStats.overdueTasks > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
              <AlertTriangle className="h-3 w-3" aria-hidden="true" />
            </div>
            <p className={`text-xs font-bold ${displayStats.overdueTasks > 0 ? 'text-destructive' : 'text-foreground'}`}>{displayStats.overdueTasks}</p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
          <div className="text-center p-1.5 rounded bg-muted/50">
            <div className="flex items-center justify-center text-purple-600 dark:text-purple-400 mb-0.5">
              <Users className="h-3 w-3" aria-hidden="true" />
            </div>
            <p className="text-xs font-bold text-foreground">{displayStats.teamMembers}</p>
            <p className="text-[10px] text-muted-foreground">Members</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CommitteeGridProps {
  committees: Workspace[];
  onCommitteeClick?: (committee: Workspace) => void;
  emptyMessage?: string;
}

export function CommitteeGrid({ committees, onCommitteeClick, emptyMessage = "No committees yet" }: CommitteeGridProps) {
  if (committees.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <Users className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        <p className="text-xs text-muted-foreground mt-1">Create committees to organize your department's work</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {committees.map((committee) => (
        <CommitteeOverviewCard 
          key={committee.id} 
          committee={committee} 
          onClick={() => onCommitteeClick?.(committee)}
        />
      ))}
    </div>
  );
}
