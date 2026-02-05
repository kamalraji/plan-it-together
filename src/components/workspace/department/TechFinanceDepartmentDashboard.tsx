import { useState } from 'react';
import { Workspace } from '@/types';
import { TechDepartmentStatsCards } from './tech/TechDepartmentStatsCards';
import { FinanceDepartmentStatsCards } from './finance/FinanceDepartmentStatsCards';
import { CommitteeConnectionsPanel } from './tech/CommitteeConnectionsPanel';
import { TechInfrastructureOverview } from './tech/TechInfrastructureOverview';
import { BudgetRequestsOverview } from './finance/BudgetRequestsOverview';
import { BudgetTrackerConnected } from './BudgetTrackerConnected';
import { ResourceManager } from './ResourceManager';
import { ResourceApprovalPanel } from './ResourceApprovalPanel';
import { DepartmentKPICard } from './DepartmentKPICard';
import { TaskSummaryCards } from '../TaskSummaryCards';
import { TeamMemberRoster } from '../TeamMemberRoster';
import { WorkspaceHierarchyMiniMap } from '../WorkspaceHierarchyMiniMap';
import { InvoiceManager } from '../finance/InvoiceManager';
import { ExpenseTracker } from '../finance/ExpenseTracker';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Server, DollarSign, Users, LayoutGrid } from 'lucide-react';
import { useWorkspaceBudget } from '@/hooks/useWorkspaceBudget';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TechFinanceDepartmentDashboardProps {
  workspace: Workspace;
  orgSlug?: string;
  onViewTasks?: () => void;
}

export function TechFinanceDepartmentDashboard({
  workspace,
  orgSlug,
  onViewTasks,
}: TechFinanceDepartmentDashboardProps) {
  const [activeView, setActiveView] = useState<'tech' | 'finance'>('finance');
  const { pendingRequests } = useWorkspaceBudget(workspace.id);

  // Fetch child committees count
  const { data: committees = [] } = useQuery({
    queryKey: ['tech-finance-dept-committees', workspace.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name')
        .eq('parent_workspace_id', workspace.id)
        .eq('workspace_type', 'COMMITTEE');
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      {/* Tech & Finance Department Header */}
      <div className="bg-gradient-to-br from-blue-500/10 via-card to-green-500/5 rounded-xl border border-border shadow-sm p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-green-500/20">
            <div className="relative">
              <Server className="h-5 w-5 text-info absolute -top-1 -left-1" />
              <DollarSign className="h-5 w-5 text-success" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold text-foreground">{workspace.name}</h2>
              <span className="px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-blue-500/20 to-green-500/20 text-foreground rounded-full">
                Department
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Manage technical infrastructure, IT systems, budgets, and financial operations
            </p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <LayoutGrid className="h-4 w-4" />
                <span>{committees.length} Committees</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{workspace.teamMembers?.length || 0} Members</span>
              </div>
              {pendingRequests.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-warning/20 text-warning rounded-full">
                  {pendingRequests.length} pending requests
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle Tabs */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'tech' | 'finance')} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="finance" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Finance Overview
          </TabsTrigger>
          <TabsTrigger value="tech" className="gap-2">
            <Server className="h-4 w-4" />
            Tech Overview
          </TabsTrigger>
        </TabsList>

        {/* Finance View */}
        <TabsContent value="finance" className="mt-6 space-y-6">
          {/* Finance Stats */}
          <FinanceDepartmentStatsCards workspaceId={workspace.id} />

          {/* Task Summary */}
          <TaskSummaryCards workspace={workspace} onViewTasks={onViewTasks} />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Budget Tracker */}
              <BudgetTrackerConnected
                workspaceId={workspace.id}
                showBreakdown={true}
              />
              
              {/* Invoices Overview */}
              <InvoiceManager workspaceId={workspace.id} />

              {/* Expenses Overview */}
              <ExpenseTracker workspaceId={workspace.id} showApprovalActions={true} />
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              <WorkspaceHierarchyMiniMap
                workspaceId={workspace.id}
                eventId={workspace.eventId}
                orgSlug={orgSlug}
                orientation="vertical"
                showLabels={false}
              />
              
              <BudgetRequestsOverview workspaceId={workspace.id} />
            </div>
          </div>
        </TabsContent>

        {/* Tech View */}
        <TabsContent value="tech" className="mt-6 space-y-6">
          {/* Tech Stats */}
          <TechDepartmentStatsCards workspaceId={workspace.id} />

          {/* Task Summary */}
          <TaskSummaryCards workspace={workspace} onViewTasks={onViewTasks} />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Infrastructure Overview */}
              <TechInfrastructureOverview />

              {/* Budget Section */}
              <BudgetTrackerConnected
                workspaceId={workspace.id}
                showBreakdown={true}
              />
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              <WorkspaceHierarchyMiniMap
                workspaceId={workspace.id}
                eventId={workspace.eventId}
                orgSlug={orgSlug}
                orientation="vertical"
                showLabels={false}
              />
              <CommitteeConnectionsPanel
                workspaceId={workspace.id}
                eventId={workspace.eventId}
                orgSlug={orgSlug}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Common Sections */}
      {/* KPIs */}
      <DepartmentKPICard workspaceId={workspace.id} departmentId={workspace.departmentId} />

      {/* Resources Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ResourceManager departmentId={workspace.departmentId} workspaceId={workspace.id} />
        <ResourceApprovalPanel workspaceId={workspace.id} />
      </div>

      {/* Team Members */}
      <TeamMemberRoster workspace={workspace} showActions={false} maxMembers={8} />
    </div>
  );
}
