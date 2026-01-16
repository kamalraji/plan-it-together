import { useState } from 'react';
import { Workspace, WorkspaceRole } from '@/types';
import { useRootDashboard, getDepartmentColor } from '@/hooks/useRootDashboard';
import { TeamMemberRoster } from '../TeamMemberRoster';
import { DelegationProgressDashboard } from '../checklists/DelegationProgressDashboard';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Building2, 
  TrendingUp,
  Calendar,
  Activity,
  ChevronDown,
  Send,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface RootDashboardProps {
  workspace: Workspace;
  orgSlug?: string;
  userRole?: WorkspaceRole | null;
  onDelegateRole?: () => void;
  onInviteMember?: () => void;
  onManageSettings?: () => void;
}

export function RootDashboard({ 
  workspace, 
  orgSlug, 
}: RootDashboardProps) {
  const navigate = useNavigate();
  const { data, isLoading } = useRootDashboard(workspace.eventId);
  const [delegationsOpen, setDelegationsOpen] = useState(true);

  const handleDepartmentClick = (workspaceId: string) => {
    const basePath = orgSlug ? `/${orgSlug}/workspaces` : '/workspaces';
    navigate(`${basePath}/${workspace.eventId}?workspaceId=${workspaceId}`);
  };

  if (isLoading) {
    return (
      <div className="w-full space-y-4 sm:space-y-6">
        <div className="animate-pulse h-24 sm:h-32 bg-muted rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse h-20 sm:h-24 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const { departments, recentActivity, upcomingMilestones } = data;

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      {/* Main Content Grid - Responsive breakpoints: stack on mobile/tablet, side-by-side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 lg:gap-6 w-full">
        {/* Left Column: Departments Performance - Full width on mobile/tablet, 8/12 on lg+ */}
        <section id="departments" className="lg:col-span-8 space-y-3 sm:space-y-4 order-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Department Performance
            </h3>
          </div>

          {/* Department cards: 1 col on mobile, 2 cols on sm+, with responsive gaps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 min-h-[150px] sm:min-h-[200px]">
            {departments.map((dept) => {
              const colors = getDepartmentColor(dept.departmentId);
              const progress = dept.tasksTotal > 0 
                ? (dept.tasksCompleted / dept.tasksTotal) * 100 
                : 0;

              return (
                <div
                  key={dept.workspaceId}
                  onClick={() => handleDepartmentClick(dept.workspaceId)}
                  className={`bg-card rounded-lg sm:rounded-xl border ${colors.border} p-3 sm:p-4 cursor-pointer hover:shadow-md transition-all hover:scale-[1.01] sm:hover:scale-[1.02]`}
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
              <div className="col-span-full text-center py-8 text-muted-foreground">
                <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No departments created yet</p>
                <p className="text-xs">Create departments to organize your event</p>
              </div>
            )}
          </div>
        </section>
        {/* Right Column: Activity & Milestones
            - On mobile: displays after departments (order-2)
            - On tablet (md): 2-column grid for better use of space
            - On lg+: single column sidebar (4/12 width)
        */}
        <div className="lg:col-span-4 space-y-3 sm:space-y-4 order-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">

          {/* Delegation Progress */}
          <section id="delegations">
            <Collapsible open={delegationsOpen} onOpenChange={setDelegationsOpen}>
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <CollapsibleTrigger className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Send className="h-4 w-4 text-primary" />
                    Delegation Progress
                  </h3>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    delegationsOpen && "rotate-180"
                  )} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4">
                    <DelegationProgressDashboard workspaceId={workspace.id} />
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </section>

          {/* Upcoming Milestones */}
          <section id="milestones" className="bg-card rounded-lg sm:rounded-xl border border-border p-3 sm:p-4">
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
          </section>

          {/* Recent Activity */}
          <section id="activity" className="bg-card rounded-lg sm:rounded-xl border border-border p-3 sm:p-4">
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
          </section>
        </div>
      </div>

      {/* Team Members */}
      <section id="team-stats">
        <TeamMemberRoster workspace={workspace} showActions={false} maxMembers={8} />
      </section>
    </div>
  );
}
