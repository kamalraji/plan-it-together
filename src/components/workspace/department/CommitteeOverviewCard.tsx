import { Users, CheckCircle2, Clock, AlertTriangle, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Workspace } from '@/types';

interface CommitteeOverviewCardProps {
  committee: Workspace;
  onClick?: () => void;
}

// Mock data - in production, this would come from the committee's actual data
function getCommitteeStats(committeeId: string) {
  // Generate consistent mock data based on ID hash
  const hash = committeeId.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
  const totalTasks = 8 + (Math.abs(hash) % 12);
  const completedTasks = Math.floor(totalTasks * (0.3 + (Math.abs(hash) % 50) / 100));
  const inProgressTasks = Math.floor((totalTasks - completedTasks) * 0.6);
  const overdueTasks = Math.abs(hash) % 3;
  const memberCount = 3 + (Math.abs(hash) % 8);
  
  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    overdueTasks,
    memberCount,
    progress: Math.round((completedTasks / totalTasks) * 100),
  };
}

export function CommitteeOverviewCard({ committee, onClick }: CommitteeOverviewCardProps) {
  const stats = getCommitteeStats(committee.id);

  // Determine health status
  const healthStatus = stats.overdueTasks > 2 ? 'critical' : stats.overdueTasks > 0 ? 'warning' : 'healthy';
  const healthConfig = {
    critical: { color: 'text-destructive', bgColor: 'bg-destructive/10', label: 'Needs Attention' },
    warning: { color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10', label: 'At Risk' },
    healthy: { color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10', label: 'On Track' },
  };

  const health = healthConfig[healthStatus];

  return (
    <div 
      className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
      onClick={onClick}
    >
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
            <span className="font-medium text-foreground">{stats.progress}%</span>
          </div>
          <Progress value={stats.progress} className="h-1.5" />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-1.5 rounded bg-muted/50">
            <div className="flex items-center justify-center text-blue-600 dark:text-blue-400 mb-0.5">
              <CheckCircle2 className="h-3 w-3" />
            </div>
            <p className="text-xs font-bold text-foreground">{stats.completedTasks}</p>
            <p className="text-[10px] text-muted-foreground">Done</p>
          </div>
          <div className="text-center p-1.5 rounded bg-muted/50">
            <div className="flex items-center justify-center text-amber-600 dark:text-amber-400 mb-0.5">
              <Clock className="h-3 w-3" />
            </div>
            <p className="text-xs font-bold text-foreground">{stats.inProgressTasks}</p>
            <p className="text-[10px] text-muted-foreground">Active</p>
          </div>
          <div className="text-center p-1.5 rounded bg-muted/50">
            <div className={`flex items-center justify-center mb-0.5 ${stats.overdueTasks > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
              <AlertTriangle className="h-3 w-3" />
            </div>
            <p className={`text-xs font-bold ${stats.overdueTasks > 0 ? 'text-destructive' : 'text-foreground'}`}>{stats.overdueTasks}</p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
          <div className="text-center p-1.5 rounded bg-muted/50">
            <div className="flex items-center justify-center text-purple-600 dark:text-purple-400 mb-0.5">
              <Users className="h-3 w-3" />
            </div>
            <p className="text-xs font-bold text-foreground">{stats.memberCount}</p>
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
