import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Workspace, WorkspaceType, WorkspaceStatus } from '@/types';
import { GrowthStatsCards } from './GrowthStatsCards';
import { GrowthCommitteeOverview } from './GrowthCommitteeOverview';
import { GrowthGoalsTracker } from './GrowthGoalsTracker';
import { CampaignOverview } from './CampaignOverview';
import { SponsorshipSummary } from './SponsorshipSummary';
import { SocialMediaSummary } from './SocialMediaSummary';
import { CommunicationSummary } from './CommunicationSummary';
import { BudgetTrackerConnected } from '../BudgetTrackerConnected';
import { ResourceApprovalPanel } from '../ResourceApprovalPanel';
import { TaskSummaryCards } from '../../TaskSummaryCards';
import { TeamMemberRoster } from '../../TeamMemberRoster';
import { WorkspaceHierarchyMiniMap } from '../../WorkspaceHierarchyMiniMap';
import { ActivityFeedWidget } from '../../ActivityFeedWidget';

import { useWorkspaceBudget } from '@/hooks/useWorkspaceBudget';
import { useTaskRealtimeUpdates } from '@/hooks/useActivityFeed';
import { TrendingUp, Users, LayoutGrid } from 'lucide-react';

interface GrowthDepartmentDashboardProps {
  workspace: Workspace;
  orgSlug?: string;
  onViewTasks?: () => void;
}

export function GrowthDepartmentDashboard({
  workspace,
  orgSlug,
  onViewTasks,
}: GrowthDepartmentDashboardProps) {
  const navigate = useNavigate();
  const { pendingRequests } = useWorkspaceBudget(workspace.id);

  // Enable real-time task updates
  useTaskRealtimeUpdates(workspace.id);

  // Fetch child committees for this department
  const { data: committees = [] } = useQuery({
    queryKey: ['growth-department-committees', workspace.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, status, created_at, updated_at, event_id, parent_workspace_id, workspace_type, department_id')
        .eq('parent_workspace_id', workspace.id)
        .eq('workspace_type', 'COMMITTEE')
        .order('name');

      if (error) throw error;

      return (data || []).map((row) => ({
        id: row.id,
        eventId: row.event_id,
        name: row.name,
        status: row.status as WorkspaceStatus,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        parentWorkspaceId: row.parent_workspace_id,
        workspaceType: row.workspace_type as WorkspaceType,
        departmentId: row.department_id || undefined,
      })) as unknown as Workspace[];
    },
    enabled: !!workspace.id,
  });

  const handleCommitteeClick = (committee: Workspace) => {
    const basePath = orgSlug ? `/${orgSlug}/workspaces` : '/workspaces';
    navigate(`${basePath}/${workspace.eventId}?workspaceId=${committee.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Department Header Card */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20">
            <TrendingUp className="h-6 w-6 text-emerald-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold text-foreground">{workspace.name}</h2>
              <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-600 rounded-full">
                Department
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Drive event awareness, audience growth, and revenue through coordinated marketing, social media, sponsorship, and communication efforts.
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
                <span className="px-2 py-0.5 text-xs font-medium bg-yellow-500/20 text-yellow-600 rounded-full">
                  {pendingRequests.length} pending requests
                </span>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Stats Cards */}
      <GrowthStatsCards />

      {/* Task Summary with Mini-Map */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <TaskSummaryCards workspace={workspace} onViewTasks={onViewTasks} />
        </div>
        <WorkspaceHierarchyMiniMap
          workspaceId={workspace.id}
          eventId={workspace.eventId}
          orgSlug={orgSlug}
          orientation="vertical"
          showLabels={false}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <GrowthCommitteeOverview 
            committees={committees} 
            onCommitteeClick={handleCommitteeClick} 
          />
          <CampaignOverview />
          <GrowthGoalsTracker />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <SponsorshipSummary />
          <SocialMediaSummary />
          <CommunicationSummary />
          <ActivityFeedWidget 
            eventId={workspace.eventId} 
            maxItems={8}
            showHeader={true}
          />
        </div>
      </div>

      {/* Budget Section */}
      <BudgetTrackerConnected 
        workspaceId={workspace.id}
        showBreakdown={true}
      />

      {/* Resource Approval */}
      <ResourceApprovalPanel workspaceId={workspace.id} />

      {/* Team Members */}
      <TeamMemberRoster workspace={workspace} showActions={false} maxMembers={8} />
    </div>
  );
}
