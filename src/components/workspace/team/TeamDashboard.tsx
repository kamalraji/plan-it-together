import { Workspace, WorkspaceRole } from '@/types';
import { TaskSummaryCards } from '../TaskSummaryCards';
import { TeamMemberRoster } from '../TeamMemberRoster';
import { WorkspaceHierarchyMiniMap } from '../WorkspaceHierarchyMiniMap';
import { useTeamWorkload, usePersonalProgress } from '@/hooks/useTeamDashboard';
import { useAuth } from '@/hooks/useAuth';
import { Progress } from '@/components/ui/progress';
import { User, Clock, AlertCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TimeTracker } from './TimeTracker';
import { TimesheetView } from './TimesheetView';
import { WorkloadReport } from './WorkloadReport';

interface TeamDashboardProps {
  workspace: Workspace;
  orgSlug?: string;
  userRole?: WorkspaceRole | null;
  onViewTasks: () => void;
  onLogHours?: () => void;
  onSubmitForApproval?: () => void;
}

export function TeamDashboard({ 
  workspace, 
  orgSlug, 
  onViewTasks,
}: TeamDashboardProps) {
  const { user } = useAuth();
  const { workload, isLoading: isWorkloadLoading } = useTeamWorkload(workspace.id);
  const { progress, isLoading: isProgressLoading } = usePersonalProgress(workspace.id, user?.id);

  return (
    <div className="space-y-6">
      {/* Mini-Map - Shows position in hierarchy */}
      <section id="hierarchy">
        <WorkspaceHierarchyMiniMap
          workspaceId={workspace.id}
          eventId={workspace.eventId}
          orgSlug={orgSlug}
          orientation="horizontal"
          showLabels={true}
          className="lg:hidden"
        />
      </section>
      
      <section id="tasks">
        <TaskSummaryCards workspace={workspace} onViewTasks={onViewTasks} />
      </section>

      <section id="progress" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Progress */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Your Progress</h3>
          </div>

          {isProgressLoading ? (
            <div className="animate-pulse h-32 bg-muted rounded-lg" />
          ) : progress ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold text-foreground">{progress.completedTasks}</p>
                  <p className="text-xs text-muted-foreground">Tasks Completed</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold text-foreground">{progress.inProgressTasks}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Completion Rate</span>
                  <span className="font-medium text-foreground">{progress.completionRate.toFixed(0)}%</span>
                </div>
                <Progress value={progress.completionRate} className="h-2" />
              </div>
              {progress.overdueTasks > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {progress.overdueTasks} overdue task{progress.overdueTasks !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No tasks assigned yet.</p>
          )}
        </div>

        {/* Team Workload Summary */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-secondary/50">
              <Clock className="h-5 w-5 text-secondary-foreground" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Team Workload</h3>
          </div>

          {isWorkloadLoading ? (
            <div className="animate-pulse h-32 bg-muted rounded-lg" />
          ) : workload.length > 0 ? (
            <div className="space-y-3">
              {workload.slice(0, 5).map((member) => {
                const workloadPercent = member.totalHoursAllocated > 0
                  ? (member.totalHoursLogged / member.totalHoursAllocated) * 100
                  : 0;
                return (
                  <div key={member.userId} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatarUrl} />
                      <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                        <span className="text-xs text-muted-foreground">{member.activeAssignments} active</span>
                      </div>
                      <Progress value={Math.min(workloadPercent, 100)} className="h-1.5 mt-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No team members yet.</p>
          )}
        </div>
      </section>

      {/* Time Tracking Section */}
      <section id="time-tracking" className="space-y-4">
        <TimeTracker workspaceId={workspace.id} />
        <TimesheetView workspaceId={workspace.id} />
      </section>

      {/* Workload Report */}
      <section id="workload">
        <WorkloadReport workspaceId={workspace.id} />
      </section>

      <section id="team-stats">
        <TeamMemberRoster workspace={workspace} showActions={false} maxMembers={10} />
      </section>
    </div>
  );
}
