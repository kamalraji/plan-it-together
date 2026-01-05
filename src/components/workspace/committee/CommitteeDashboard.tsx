import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Workspace, WorkspaceRole } from '@/types';
import { MilestoneTimeline } from './MilestoneTimeline';
import { GoalTracker } from './GoalTracker';
import { CommitteeChecklist } from './CommitteeChecklist';
import { CommitteeHeaderCard } from './CommitteeHeaderCard';
import { BudgetRequestForm } from './BudgetRequestForm';
import { ResourceRequestForm } from './ResourceRequestForm';
import { ResourceRequestsList } from './ResourceRequestsList';
import { TaskSummaryCards } from '../TaskSummaryCards';
import { TeamMemberRoster } from '../TeamMemberRoster';
import { WorkspaceHierarchyMiniMap } from '../WorkspaceHierarchyMiniMap';
import { RoleBasedActions } from '../RoleBasedActions';
import { useWorkspaceBudget } from '@/hooks/useWorkspaceBudget';
import { BudgetTrackerConnected } from '../department/BudgetTrackerConnected';
import { VolunteersDashboard } from '../volunteers';
import { FinanceDashboard } from '../finance';
import { RegistrationDashboard } from '../registration';
import { TechnicalDashboard } from '../technical';
import { ITDashboard } from '../it';
import { ContentDashboard } from '../content';
import { SpeakerLiaisonDashboard } from '../speaker-liaison';
import { JudgeDashboard } from '../judge';
import { MediaDashboard } from '../media';
import { EventDashboard } from '../event';
import { CateringDashboard } from '../catering';
import { LogisticsDashboard } from '../logistics';
import { FacilityDashboard } from '../facility';
import { MarketingDashboard } from '../marketing';

interface CommitteeDashboardProps {
  workspace: Workspace;
  orgSlug?: string;
  userRole?: WorkspaceRole | null;
  onViewTasks: () => void;
  onDelegateRole?: () => void;
  onInviteMember?: () => void;
  onRequestBudget?: () => void;
  onRequestResource?: () => void;
}

export function CommitteeDashboard({ 
  workspace, 
  orgSlug, 
  userRole,
  onViewTasks,
  onDelegateRole,
  onInviteMember,
  onRequestBudget,
  onRequestResource,
}: CommitteeDashboardProps) {
  const { isLoading: isBudgetLoading } = useWorkspaceBudget(workspace.id);

  // Extract committee type from workspace name
  const committeeType = workspace.name
    .toLowerCase()
    .replace(/\s+committee$/i, '')
    .trim();

  // Check if this is a volunteers committee - render specialized dashboard
  const isVolunteersCommittee = committeeType === 'volunteers' || 
    workspace.name.toLowerCase().includes('volunteer');

  // Check if this is a finance committee - render specialized dashboard
  const isFinanceCommittee = committeeType === 'finance' || 
    workspace.name.toLowerCase().includes('finance');

  // Check if this is a registration committee - render specialized dashboard
  const isRegistrationCommittee = committeeType === 'registration' || 
    workspace.name.toLowerCase().includes('registration');

  // Check if this is a technical/AV committee - render specialized dashboard
  const isTechnicalCommittee = committeeType === 'technical' || 
    workspace.name.toLowerCase().includes('technical') ||
    workspace.name.toLowerCase().includes('av') ||
    workspace.name.toLowerCase().includes('technology');

  // Check if this is an IT committee - render specialized IT dashboard
  const isITCommittee = committeeType === 'it' ||
    workspace.name.toLowerCase().includes(' it ') ||
    workspace.name.toLowerCase().startsWith('it ') ||
    workspace.name.toLowerCase().endsWith(' it');

  // Check if this is a content/social media committee (but NOT photography/videography media)
  const isContentCommittee = committeeType === 'content' ||
    workspace.name.toLowerCase().includes('content') ||
    workspace.name.toLowerCase().includes('social media') ||
    workspace.name.toLowerCase().includes('communications');

  // Check if this is a media/photography/video committee
  const isMediaCommittee = committeeType === 'media' ||
    committeeType === 'photography' ||
    committeeType === 'videography' ||
    workspace.name.toLowerCase().includes('photography') ||
    workspace.name.toLowerCase().includes('videography') ||
    workspace.name.toLowerCase().includes('photo') ||
    workspace.name.toLowerCase().includes('video') ||
    (workspace.name.toLowerCase().includes('media') && 
      !workspace.name.toLowerCase().includes('social media'));

  // Check if this is a speaker liaison committee
  const isSpeakerLiaisonCommittee = committeeType === 'speaker liaison' ||
    workspace.name.toLowerCase().includes('speaker') ||
    workspace.name.toLowerCase().includes('presenter') ||
    workspace.name.toLowerCase().includes('panelist');

  // Check if this is a judge/judging committee
  const isJudgeCommittee = committeeType === 'judge' ||
    committeeType === 'judging' ||
    workspace.name.toLowerCase().includes('judge') ||
    workspace.name.toLowerCase().includes('judging') ||
    workspace.name.toLowerCase().includes('evaluation');

  // Check if this is an event/coordination committee
  const isEventCommittee = committeeType === 'event' ||
    committeeType === 'coordination' ||
    workspace.name.toLowerCase().includes('event committee') ||
    workspace.name.toLowerCase().includes('coordination') ||
    workspace.name.toLowerCase().includes('day-of') ||
    workspace.name.toLowerCase().includes('run of show');

  // Check if this is a catering committee
  const isCateringCommittee = committeeType === 'catering' ||
    workspace.name.toLowerCase().includes('catering') ||
    workspace.name.toLowerCase().includes('food') ||
    workspace.name.toLowerCase().includes('beverage');

  // Check if this is a logistics committee
  const isLogisticsCommittee = committeeType === 'logistics' ||
    workspace.name.toLowerCase().includes('logistics') ||
    workspace.name.toLowerCase().includes('transport') ||
    workspace.name.toLowerCase().includes('shipping');

  // Check if this is a facility committee
  const isFacilityCommittee = committeeType === 'facility' ||
    workspace.name.toLowerCase().includes('facility') ||
    workspace.name.toLowerCase().includes('facilities') ||
    workspace.name.toLowerCase().includes('venue management') ||
    workspace.name.toLowerCase().includes('building');

  // Check if this is a marketing committee
  const isMarketingCommittee = committeeType === 'marketing' ||
    workspace.name.toLowerCase().includes('marketing') ||
    workspace.name.toLowerCase().includes('promotion') ||
    workspace.name.toLowerCase().includes('advertising') ||
    workspace.name.toLowerCase().includes('branding');

  if (isVolunteersCommittee) {
    return (
      <VolunteersDashboard
        workspace={workspace}
        orgSlug={orgSlug}
        userRole={userRole}
        onViewTasks={onViewTasks}
        onDelegateRole={onDelegateRole}
        onInviteMember={onInviteMember}
        onRequestBudget={onRequestBudget}
        onRequestResource={onRequestResource}
      />
    );
  }

  if (isFinanceCommittee) {
    return (
      <FinanceDashboard
        workspace={workspace}
        orgSlug={orgSlug}
        userRole={userRole}
        onViewTasks={onViewTasks}
        onDelegateRole={onDelegateRole}
        onInviteMember={onInviteMember}
        onRequestBudget={onRequestBudget}
        onRequestResource={onRequestResource}
      />
    );
  }

  if (isRegistrationCommittee) {
    return (
      <RegistrationDashboard
        workspace={workspace}
        orgSlug={orgSlug}
        userRole={userRole}
        onViewTasks={onViewTasks}
        onDelegateRole={onDelegateRole}
        onInviteMember={onInviteMember}
        onRequestBudget={onRequestBudget}
        onRequestResource={onRequestResource}
      />
    );
  }

  if (isTechnicalCommittee) {
    return (
      <TechnicalDashboard
        workspace={workspace}
        orgSlug={orgSlug}
        userRole={userRole}
        onViewTasks={onViewTasks}
        onDelegateRole={onDelegateRole}
        onInviteMember={onInviteMember}
        onRequestBudget={onRequestBudget}
        onRequestResource={onRequestResource}
      />
    );
  }

  if (isITCommittee) {
    return (
      <ITDashboard
        workspace={workspace}
        orgSlug={orgSlug}
        userRole={userRole}
        onViewTasks={onViewTasks}
        onDelegateRole={onDelegateRole}
        onInviteMember={onInviteMember}
        onRequestBudget={onRequestBudget}
        onRequestResource={onRequestResource}
      />
    );
  }

  if (isContentCommittee) {
    return (
      <ContentDashboard
        workspace={workspace}
        orgSlug={orgSlug}
        userRole={userRole}
        onViewTasks={onViewTasks}
        onDelegateRole={onDelegateRole}
        onInviteMember={onInviteMember}
        onRequestBudget={onRequestBudget}
        onRequestResource={onRequestResource}
      />
    );
  }

  if (isSpeakerLiaisonCommittee) {
    return (
      <SpeakerLiaisonDashboard
        workspace={workspace}
        orgSlug={orgSlug}
        userRole={userRole}
        onViewTasks={onViewTasks}
        onDelegateRole={onDelegateRole}
        onInviteMember={onInviteMember}
        onRequestBudget={onRequestBudget}
        onRequestResource={onRequestResource}
      />
    );
  }

  if (isJudgeCommittee) {
    return (
      <JudgeDashboard
        workspace={workspace}
        orgSlug={orgSlug}
        userRole={userRole}
        onViewTasks={onViewTasks}
        onDelegateRole={onDelegateRole}
        onInviteMember={onInviteMember}
        onRequestBudget={onRequestBudget}
        onRequestResource={onRequestResource}
      />
    );
  }

  if (isMediaCommittee) {
    return (
      <MediaDashboard
        workspace={workspace}
        orgSlug={orgSlug}
        userRole={userRole}
        onViewTasks={onViewTasks}
        onDelegateRole={onDelegateRole}
        onInviteMember={onInviteMember}
        onRequestBudget={onRequestBudget}
        onRequestResource={onRequestResource}
      />
    );
  }

  if (isEventCommittee) {
    return (
      <EventDashboard
        workspace={workspace}
        orgSlug={orgSlug}
        userRole={userRole}
        onViewTasks={onViewTasks}
        onDelegateRole={onDelegateRole}
        onInviteMember={onInviteMember}
        onRequestBudget={onRequestBudget}
        onRequestResource={onRequestResource}
      />
    );
  }

  if (isCateringCommittee) {
    return (
      <CateringDashboard
        workspace={workspace}
        orgSlug={orgSlug}
        userRole={userRole}
        onViewTasks={onViewTasks}
        onDelegateRole={onDelegateRole}
        onInviteMember={onInviteMember}
        onRequestBudget={onRequestBudget}
        onRequestResource={onRequestResource}
      />
    );
  }

  if (isLogisticsCommittee) {
    return (
      <LogisticsDashboard
        workspace={workspace}
        orgSlug={orgSlug}
        userRole={userRole}
        onViewTasks={onViewTasks}
        onDelegateRole={onDelegateRole}
        onInviteMember={onInviteMember}
        onRequestBudget={onRequestBudget}
        onRequestResource={onRequestResource}
      />
    );
  }

  if (isFacilityCommittee) {
    return (
      <FacilityDashboard
        workspace={workspace}
        orgSlug={orgSlug}
        userRole={userRole}
        onViewTasks={onViewTasks}
        onDelegateRole={onDelegateRole}
        onInviteMember={onInviteMember}
        onRequestBudget={onRequestBudget}
        onRequestResource={onRequestResource}
      />
    );
  }

  if (isMarketingCommittee) {
    return (
      <MarketingDashboard
        workspace={workspace}
        orgSlug={orgSlug}
        userRole={userRole}
        onViewTasks={onViewTasks}
        onDelegateRole={onDelegateRole}
        onInviteMember={onInviteMember}
        onRequestBudget={onRequestBudget}
        onRequestResource={onRequestResource}
      />
    );
  }

  // Fetch team members count
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['committee-team-members', workspace.id],
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
    queryKey: ['committee-tasks', workspace.id],
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
    queryKey: ['committee-teams', workspace.id],
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
      {/* Committee Header */}
      <CommitteeHeaderCard
        workspaceName={workspace.name}
        memberCount={teamMembers.length}
        tasksCompleted={tasksCompleted}
        tasksTotal={tasks.length}
        teamsCount={teams.length}
      />

      {/* Role-Based Actions */}
      <RoleBasedActions
        workspace={workspace}
        userRole={userRole || null}
        onDelegateRole={onDelegateRole}
        onInviteMember={onInviteMember}
        onRequestBudget={onRequestBudget}
        onRequestResource={onRequestResource}
      />

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <MilestoneTimeline workspaceId={workspace.id} />
          <GoalTracker workspaceId={workspace.id} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <CommitteeChecklist workspaceId={workspace.id} committeeType={committeeType} />
          
          {/* Budget Section */}
          {!isBudgetLoading && (
            <BudgetTrackerConnected
              workspaceId={workspace.id}
              showBreakdown={false}
            />
          )}
          
          <BudgetRequestForm
            workspaceId={workspace.id}
            parentWorkspaceId={workspace.parentWorkspaceId || null}
          />
        </div>
      </div>

      {/* Resource Requests Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <ResourceRequestForm 
            workspaceId={workspace.id} 
            parentWorkspaceId={workspace.parentWorkspaceId || null}
          />
        </div>
        <ResourceRequestsList workspaceId={workspace.id} />
      </div>

      {/* Team Members */}
      <TeamMemberRoster workspace={workspace} showActions={false} maxMembers={6} />
    </div>
  );
}
