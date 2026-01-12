import { useState } from 'react';
import { Workspace, WorkspaceRole } from '@/types';
import { useRootDashboard, getDepartmentColor } from '@/hooks/useRootDashboard';
import { TeamMemberRoster } from '../TeamMemberRoster';
import { HierarchyTreeCard } from '../HierarchyTreeCard';
import { WorkspaceHierarchyMiniMap } from '../WorkspaceHierarchyMiniMap';
import { ChildWorkspacesManager } from './ChildWorkspacesManager';
import { WorkspaceStructureOverview } from '../WorkspaceStructureOverview';
import { DelegationProgressDashboard } from '../checklists/DelegationProgressDashboard';
import { AssignPageBuilderDialog } from '../AssignPageBuilderDialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Building2, 
  TrendingUp,
  Calendar,
  Activity,
  ChevronDown,
  GitBranch,
  Send,
  Paintbrush,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { usePageBuildingResponsibilities } from '@/hooks/usePageBuildingResponsibilities';

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
  onManageSettings,
}: RootDashboardProps) {
  const navigate = useNavigate();
  const { data, isLoading } = useRootDashboard(workspace.eventId);
  const [structureOpen, setStructureOpen] = useState(true);
  const [delegationsOpen, setDelegationsOpen] = useState(true);
  const [pageBuilderDialogOpen, setPageBuilderDialogOpen] = useState(false);
  
  const { data: responsibilities } = usePageBuildingResponsibilities(workspace.eventId);

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

  const { departments, recentActivity, upcomingMilestones } = data;

  return (
    <div className="space-y-6">
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Departments Performance */}
        <section id="departments" className="lg:col-span-2 space-y-4">
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
        </section>
        {/* Right Column: Workspace Management, Activity & Milestones */}
        <div className="space-y-4">
          {/* Page Builder Assignment */}
          <section id="page-builder" className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Paintbrush className="h-4 w-4 text-primary" />
                Page Builder
              </h3>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setPageBuilderDialogOpen(true)}
              >
                Assign
              </Button>
            </div>
            
            {responsibilities && responsibilities.length > 0 ? (
              <div className="space-y-2">
                {responsibilities.map((resp: { id: string; workspaceName: string; responsibilityType: string }) => (
                  <div key={resp.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-lg">
                    <span className="text-foreground">{resp.workspaceName}</span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {resp.responsibilityType.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">
                No page building responsibilities assigned
              </p>
            )}
          </section>

          {/* Child Workspaces Manager */}
          <section id="workspaces">
            <ChildWorkspacesManager
              workspace={workspace}
              orgSlug={orgSlug}
              onWorkspaceSelect={handleDepartmentClick}
            />
          </section>

          {/* Workspace Structure Overview - Planned vs Created */}
          <section id="structure">
            <Collapsible open={structureOpen} onOpenChange={setStructureOpen}>
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <CollapsibleTrigger className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-primary" />
                    Hierarchy Overview
                  </h3>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    structureOpen && "rotate-180"
                  )} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4">
                    <WorkspaceStructureOverview
                      eventId={workspace.eventId}
                      parentWorkspaceId={workspace.id}
                      canManage={!!onManageSettings}
                    />
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </section>

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
          <section id="milestones" className="bg-card rounded-xl border border-border p-4">
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
          <section id="activity" className="bg-card rounded-xl border border-border p-4">
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

          {/* Mini-Map - Quick Position Indicator */}
          <section id="hierarchy">
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
          </section>
        </div>
      </div>

      {/* Team Members */}
      <section id="team-stats">
        <TeamMemberRoster workspace={workspace} showActions={false} maxMembers={8} />
      </section>

      {/* Assign Page Builder Dialog */}
      {workspace.eventId && (
        <AssignPageBuilderDialog
          open={pageBuilderDialogOpen}
          onOpenChange={setPageBuilderDialogOpen}
          eventId={workspace.eventId}
          rootWorkspaceId={workspace.id}
        />
      )}
    </div>
  );
}
