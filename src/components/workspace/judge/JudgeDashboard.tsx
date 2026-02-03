import { Workspace } from '@/types';
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
import { useJudgingProgress } from '@/hooks/useJudgeCommitteeData';

interface JudgeDashboardProps {
  workspace: Workspace;
  orgSlug?: string;
  onViewTasks: () => void;
}

export function JudgeDashboard({
  workspace,
  orgSlug,
  onViewTasks,
}: JudgeDashboardProps) {
  // Use real data from the judging progress hook
  const { data: progress } = useJudgingProgress(workspace.id);

  const stats = {
    totalJudges: progress?.totalJudges ?? 0,
    totalSubmissions: progress?.totalSubmissions ?? 0,
    evaluatedCount: progress?.judgedSubmissions ?? 0,
    pendingCount: progress?.totalAssignments ? progress.totalAssignments - (progress?.completedAssignments ?? 0) : 0,
    averageScore: progress?.averageScore ?? 0,
    criteriaCount: 0, // Will be populated from rubrics if needed
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
