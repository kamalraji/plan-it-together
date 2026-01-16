import { useState } from 'react';
import { Workspace, WorkspaceType, WorkspaceRole } from '@/types';
import { useWorkspaceApprovals } from '@/hooks/useWorkspaceApprovals';
import { useEventPublishApprovals } from '@/hooks/useEventPublishApprovals';
import { useTaskApprovalRequests } from '@/hooks/useTaskApprovalRequests';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApprovalsSummaryCards } from './ApprovalsSummaryCards';
import { BudgetApprovalList } from './BudgetApprovalList';
import { ResourceApprovalList } from './ResourceApprovalList';
import { AccessApprovalList } from './AccessApprovalList';
import { UnifiedApprovalsList } from './UnifiedApprovalsList';
import { EventPublishApprovalList } from './EventPublishApprovalList';
import { PendingApprovalsPanel } from './task/PendingApprovalsPanel';
import { DollarSign, Package, UserPlus, LayoutList, Rocket, ClipboardCheck } from 'lucide-react';

interface IncomingApprovalsSectionProps {
  workspace: Workspace;
  userRole?: WorkspaceRole;
}

export function IncomingApprovalsSection({ workspace, userRole }: IncomingApprovalsSectionProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'budget' | 'resources' | 'access' | 'event-publish' | 'tasks'>('all');

  const {
    budgetRequests,
    resourceRequests,
    accessRequests,
    allRequests,
    totalPending,
    isLoading,
  } = useWorkspaceApprovals(workspace.id, workspace.workspaceType);

  const {
    totalPending: eventPublishPending,
  } = useEventPublishApprovals(workspace.id);

  const {
    pendingApprovals: taskApprovals,
  } = useTaskApprovalRequests(workspace.id);

  // Teams can't approve budget/resource requests
  const isTeam = workspace.workspaceType === WorkspaceType.TEAM;
  // Only ROOT workspaces can approve event publish requests
  const isRoot = workspace.workspaceType === WorkspaceType.ROOT;

  const taskApprovalCount = taskApprovals.length;
  const totalAllPending = totalPending + (isRoot ? eventPublishPending : 0) + taskApprovalCount;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <ApprovalsSummaryCards
        budgetCount={budgetRequests.length}
        resourceCount={resourceRequests.length}
        accessCount={accessRequests.length}
        eventPublishCount={isRoot ? eventPublishPending : undefined}
        taskApprovalCount={taskApprovalCount}
      />

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className={`grid w-full ${isRoot ? 'grid-cols-6' : 'grid-cols-5'}`}>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <LayoutList className="h-4 w-4" />
            <span className="hidden sm:inline">All</span>
            {totalAllPending > 0 && (
              <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                {totalAllPending}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Tasks</span>
            {taskApprovalCount > 0 && (
              <span className="text-xs bg-violet-500/20 text-violet-600 px-1.5 py-0.5 rounded-full">
                {taskApprovalCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="budget" className="flex items-center gap-2" disabled={isTeam}>
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Budget</span>
            {budgetRequests.length > 0 && (
              <span className="text-xs bg-emerald-500/20 text-emerald-600 px-1.5 py-0.5 rounded-full">
                {budgetRequests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2" disabled={isTeam}>
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Resources</span>
            {resourceRequests.length > 0 && (
              <span className="text-xs bg-blue-500/20 text-blue-600 px-1.5 py-0.5 rounded-full">
                {resourceRequests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="access" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Access</span>
            {accessRequests.length > 0 && (
              <span className="text-xs bg-amber-500/20 text-amber-600 px-1.5 py-0.5 rounded-full">
                {accessRequests.length}
              </span>
            )}
          </TabsTrigger>
          {isRoot && (
            <TabsTrigger value="event-publish" className="flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              <span className="hidden sm:inline">Publish</span>
              {eventPublishPending > 0 && (
                <span className="text-xs bg-purple-500/20 text-purple-600 px-1.5 py-0.5 rounded-full">
                  {eventPublishPending}
                </span>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <div className="mt-6">
          <TabsContent value="all" className="m-0">
            <UnifiedApprovalsList
              requests={allRequests}
              isLoading={isLoading}
              onSelectRequest={(request) => {
                // Navigate to specific tab when clicking a request
                setActiveTab(request.type === 'budget' ? 'budget' : request.type === 'resource' ? 'resources' : 'access');
              }}
            />
          </TabsContent>

          <TabsContent value="tasks" className="m-0">
            {userRole && (
              <PendingApprovalsPanel 
                workspaceId={workspace.id} 
                userRole={userRole}
              />
            )}
          </TabsContent>

          <TabsContent value="budget" className="m-0">
            <BudgetApprovalList
              requests={budgetRequests}
              isLoading={isLoading}
              workspaceId={workspace.id}
            />
          </TabsContent>

          <TabsContent value="resources" className="m-0">
            <ResourceApprovalList
              requests={resourceRequests}
              isLoading={isLoading}
              workspaceId={workspace.id}
            />
          </TabsContent>

          <TabsContent value="access" className="m-0">
            <AccessApprovalList
              requests={accessRequests}
              isLoading={isLoading}
              workspaceId={workspace.id}
            />
          </TabsContent>

          {isRoot && (
            <TabsContent value="event-publish" className="m-0">
              <EventPublishApprovalList
                workspaceId={workspace.id}
              />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}
