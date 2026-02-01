import { Workspace, WorkspaceRole } from '@/types';
import { RegistrationStatsCards } from './RegistrationStatsCards';
import { AttendeeList } from './AttendeeList';
import { CheckInMonitor } from './CheckInMonitor';
import { WaitlistManager } from './WaitlistManager';
import { RegistrationQuickActions } from './RegistrationQuickActions';
import { TicketTypeBreakdown } from './TicketTypeBreakdown';
import { CommitteeHeaderCard } from '../committee/CommitteeHeaderCard';
import { TaskSummaryCards } from '../TaskSummaryCards';
import { WorkspaceHierarchyMiniMap } from '../WorkspaceHierarchyMiniMap';
import { TeamMemberRoster } from '../TeamMemberRoster';
import { MilestoneTimeline } from '../committee/MilestoneTimeline';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RegistrationDashboardProps {
  workspace: Workspace;
  orgSlug?: string;
  userRole?: WorkspaceRole | null;
  onViewTasks: () => void;
  onDelegateRole?: () => void;
  onInviteMember?: () => void;
  onRequestBudget?: () => void;
  onRequestResource?: () => void;
}

export function RegistrationDashboard({
  workspace,
  orgSlug,
  userRole: _userRole,
  onViewTasks,
  onDelegateRole: _onDelegateRole,
  onInviteMember: _onInviteMember,
  onRequestBudget: _onRequestBudget,
  onRequestResource: _onRequestResource,
}: RegistrationDashboardProps) {
  // Fetch team members count
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['registration-team-members', workspace.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_team_members')
        .select('id')
        .eq('workspace_id', workspace.id)
        .eq('status', 'ACTIVE');
      if (error) throw error;
      return data;
    },
  });

  // Fetch tasks for progress
  const { data: tasks = [] } = useQuery({
    queryKey: ['registration-tasks', workspace.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_tasks')
        .select('id, status')
        .eq('workspace_id', workspace.id);
      if (error) throw error;
      return data;
    },
  });

  // Fetch child teams count
  const { data: teams = [] } = useQuery({
    queryKey: ['registration-teams', workspace.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id')
        .eq('parent_workspace_id', workspace.id)
        .eq('workspace_type', 'TEAM');
      if (error) throw error;
      return data;
    },
  });

  const tasksCompleted = tasks.filter(t => t.status === 'DONE').length;

  return (
    <div className="space-y-6">
      {/* Registration Header */}
      <CommitteeHeaderCard
        workspaceName={workspace.name}
        memberCount={teamMembers.length}
        tasksCompleted={tasksCompleted}
        tasksTotal={tasks.length}
        teamsCount={teams.length}
      />

      {/* Registration Stats Cards */}
      <RegistrationStatsCards workspaceId={workspace.id} />

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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Attendee List */}
        <div className="lg:col-span-2 space-y-6">
          <AttendeeList workspaceId={workspace.id} />
          <WaitlistManager workspaceId={workspace.id} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <RegistrationQuickActions />
          <CheckInMonitor workspaceId={workspace.id} />
          <TicketTypeBreakdown workspaceId={workspace.id} />
        </div>
      </div>

      {/* Timeline */}
      <MilestoneTimeline workspaceId={workspace.id} />

      {/* Team Members */}
      <TeamMemberRoster workspace={workspace} showActions={false} maxMembers={6} />
    </div>
  );
}
