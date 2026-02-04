import { WorkspaceHierarchyStats, WorkspaceWithStats } from '@/hooks/useAllWorkspacesData';
import { WorkspaceType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Layers, 
  Building2, 
  UsersRound, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
} from 'lucide-react';

interface WorkspaceHealthDashboardProps {
  stats: WorkspaceHierarchyStats;
  workspaces: WorkspaceWithStats[];
}

export function WorkspaceHealthDashboard({ stats, workspaces }: WorkspaceHealthDashboardProps) {
  // Find workspaces that might need attention
  const needsAttention = workspaces.filter(ws => {
    // No members
    if (ws.memberCount === 0 && ws.workspaceType !== WorkspaceType.ROOT) return true;
    // Very low task completion
    if (ws.taskCount > 0 && (ws.completedTaskCount / ws.taskCount) < 0.2) return true;
    return false;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Workspaces */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Workspaces
          </CardTitle>
          <Layers className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalWorkspaces}</div>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {stats.byType[WorkspaceType.DEPARTMENT] || 0} Depts
            </span>
            <span className="flex items-center gap-1">
              <UsersRound className="w-3 h-3" />
              {stats.byType[WorkspaceType.COMMITTEE] || 0} Comms
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {stats.byType[WorkspaceType.TEAM] || 0} Teams
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Total Members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Members
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalMembers}</div>
          <p className="text-xs text-muted-foreground mt-2">
            Across all workspaces in hierarchy
          </p>
        </CardContent>
      </Card>

      {/* Task Completion */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Task Completion
          </CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{stats.taskCompletionRate}%</span>
            <span className="text-sm text-muted-foreground">
              ({stats.completedTasks}/{stats.totalTasks})
            </span>
          </div>
          <Progress 
            value={stats.taskCompletionRate} 
            className="h-2 mt-3"
          />
        </CardContent>
      </Card>

      {/* Needs Attention */}
      <Card className={needsAttention.length > 0 ? 'border-amber-200 dark:border-amber-900' : ''}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Needs Attention
          </CardTitle>
          <AlertTriangle className={`h-4 w-4 ${needsAttention.length > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{needsAttention.length}</div>
          <p className="text-xs text-muted-foreground mt-2">
            {needsAttention.length === 0 
              ? 'All workspaces healthy' 
              : 'Workspaces with no members or low progress'
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
