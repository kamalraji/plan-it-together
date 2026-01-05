import { Workspace } from '@/types';
import { useRootDashboard, getDepartmentColor } from '@/hooks/useRootDashboard';
import { TaskSummaryCards } from '../TaskSummaryCards';
import { TeamMemberRoster } from '../TeamMemberRoster';
import { HierarchyTreeCard } from '../HierarchyTreeCard';
import { WorkspaceHierarchyMiniMap } from '../WorkspaceHierarchyMiniMap';
import { Progress } from '@/components/ui/progress';
import { 
  Crown, 
  Building2, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Wallet,
  Calendar,
  Activity,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface RootDashboardProps {
  workspace: Workspace;
  orgSlug?: string;
  onViewTasks?: () => void;
}

export function RootDashboard({ workspace, orgSlug, onViewTasks }: RootDashboardProps) {
  const navigate = useNavigate();
  const { data, isLoading } = useRootDashboard(workspace.eventId);

  const handleDepartmentClick = (workspaceId: string) => {
    const basePath = orgSlug ? `/${orgSlug}/workspaces` : '/workspaces';
    navigate(`${basePath}/${workspace.eventId}?workspaceId=${workspaceId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse h-32 bg-muted rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse h-24 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const { departments, eventHealth, recentActivity, upcomingMilestones } = data;

  return (
    <div className="space-y-6">
      {/* Root Header Card */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-xl border border-primary/20 shadow-sm p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/20">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold text-foreground">{workspace.name}</h2>
              <span className="px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded-full">
                Event Workspace
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Complete oversight of all departments, committees, and teams
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{departments.length} Departments</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{eventHealth.totalMembers} Team Members</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                <span>{eventHealth.overallProgress.toFixed(0)}% Complete</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Health Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <span className="text-xs text-muted-foreground">Completed</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{eventHealth.tasksCompleted}</p>
          <p className="text-xs text-muted-foreground">of {eventHealth.totalTasks} tasks</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <span className="text-xs text-muted-foreground">In Progress</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{eventHealth.tasksInProgress}</p>
          <p className="text-xs text-muted-foreground">active tasks</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </div>
            <span className="text-xs text-muted-foreground">Blocked</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{eventHealth.tasksBlocked}</p>
          <p className="text-xs text-muted-foreground">need attention</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Wallet className="h-4 w-4 text-purple-500" />
            </div>
            <span className="text-xs text-muted-foreground">Budget</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{eventHealth.budgetUtilization.toFixed(0)}%</p>
          <p className="text-xs text-muted-foreground">utilized</p>
        </div>
      </div>

      {/* Task Summary */}
      <TaskSummaryCards workspace={workspace} onViewTasks={onViewTasks} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Departments Performance */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Department Performance
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {departments.map((dept) => {
              const colors = getDepartmentColor(dept.departmentId);
              const progress = dept.tasksTotal > 0 
                ? (dept.tasksCompleted / dept.tasksTotal) * 100 
                : 0;

              return (
                <div
                  key={dept.workspaceId}
                  onClick={() => handleDepartmentClick(dept.workspaceId)}
                  className={`bg-card rounded-xl border ${colors.border} p-4 cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${colors.bg}`}>
                        <Building2 className={`h-4 w-4 ${colors.icon}`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground text-sm">{dept.departmentName}</h4>
                        <p className="text-xs text-muted-foreground">{dept.committeeCount} committees</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium ${colors.text}`}>
                      {progress.toFixed(0)}%
                    </span>
                  </div>

                  <Progress value={progress} className="h-1.5 mb-3" />

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{dept.memberCount}</p>
                      <p className="text-xs text-muted-foreground">Members</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-600">{dept.tasksCompleted}</p>
                      <p className="text-xs text-muted-foreground">Done</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-blue-600">{dept.tasksInProgress}</p>
                      <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                  </div>

                  {dept.budgetAllocated > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Budget</span>
                        <span className="font-medium text-foreground">
                          ${dept.budgetUsed.toLocaleString()} / ${dept.budgetAllocated.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {departments.length === 0 && (
              <div className="col-span-2 text-center py-8 text-muted-foreground">
                <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No departments created yet</p>
                <p className="text-xs">Create departments to organize your event</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Activity & Milestones */}
        <div className="space-y-4">
          {/* Upcoming Milestones */}
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-primary" />
              Upcoming Milestones
            </h3>
            {upcomingMilestones.length > 0 ? (
              <div className="space-y-3">
                {upcomingMilestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${
                      milestone.status === 'overdue' ? 'bg-red-500' :
                      milestone.status === 'in_progress' ? 'bg-blue-500' :
                      'bg-muted-foreground'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{milestone.title}</p>
                      <p className="text-xs text-muted-foreground">{milestone.workspaceName}</p>
                      {milestone.dueDate && (
                        <p className="text-xs text-muted-foreground">
                          Due {formatDistanceToNow(new Date(milestone.dueDate), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No upcoming milestones</p>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-primary" />
              Recent Activity
            </h3>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.actorName && `${activity.actorName} • `}
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            )}
          </div>

          {/* Mini-Map - Quick Position Indicator */}
          <WorkspaceHierarchyMiniMap
            workspaceId={workspace.id}
            eventId={workspace.eventId}
            orgSlug={orgSlug}
            orientation="vertical"
            showLabels={true}
          />

          {/* Hierarchy Tree */}
          {workspace.eventId && (
            <HierarchyTreeCard
              eventId={workspace.eventId}
              currentWorkspaceId={workspace.id}
              onWorkspaceSelect={handleDepartmentClick}
            />
          )}
        </div>
      </div>

      {/* Team Members */}
      <TeamMemberRoster workspace={workspace} showActions={false} maxMembers={8} />
    </div>
  );
}
