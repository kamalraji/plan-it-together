import { Workspace, WorkspaceRole } from '@/types';
import { JudgeStatsCards } from './JudgeStatsCards';
import { JudgeRoster } from './JudgeRoster';
import { SubmissionAssignments } from './SubmissionAssignments';
import { ScoringRubricManager } from './ScoringRubricManager';
import { EvaluationProgress } from './EvaluationProgress';
import { JudgeQuickActions } from './JudgeQuickActions';
import { LeaderboardPreview } from './LeaderboardPreview';
import { TaskSummaryCards } from '../TaskSummaryCards';
import { TeamMemberRoster } from '../TeamMemberRoster';
import { WorkspaceHierarchyMiniMap } from '../WorkspaceHierarchyMiniMap';
import { RoleBasedActions } from '../RoleBasedActions';

interface JudgeDashboardProps {
  workspace: Workspace;
  orgSlug?: string;
  userRole?: WorkspaceRole | null;
  onViewTasks: () => void;
  onDelegateRole?: () => void;
  onInviteMember?: () => void;
  onRequestBudget?: () => void;
  onRequestResource?: () => void;
}

export function JudgeDashboard({
  workspace,
  orgSlug,
  userRole,
  onViewTasks,
  onDelegateRole,
  onInviteMember,
  onRequestBudget,
  onRequestResource,
}: JudgeDashboardProps) {
  // Mock stats - in production, fetch from database
  const stats = {
    totalJudges: 8,
    totalSubmissions: 48,
    evaluatedCount: 32,
    pendingCount: 16,
    averageScore: 7.8,
    criteriaCount: 9,
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <JudgeStatsCards
        totalJudges={stats.totalJudges}
        totalSubmissions={stats.totalSubmissions}
        evaluatedCount={stats.evaluatedCount}
        pendingCount={stats.pendingCount}
        averageScore={stats.averageScore}
        criteriaCount={stats.criteriaCount}
      />

      {/* Quick Actions */}
      <JudgeQuickActions workspaceId={workspace.id} onViewTasks={onViewTasks} />

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
          <EvaluationProgress workspaceId={workspace.id} />
          <SubmissionAssignments workspaceId={workspace.id} />
          <ScoringRubricManager workspaceId={workspace.id} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <LeaderboardPreview workspaceId={workspace.id} />
          <JudgeRoster workspaceId={workspace.id} />
        </div>
      </div>

      {/* Team Members */}
      <TeamMemberRoster workspace={workspace} showActions={false} maxMembers={6} />
    </div>
  );
}
