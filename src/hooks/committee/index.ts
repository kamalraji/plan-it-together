/**
 * Committee Hooks - Committee-specific dashboard and data hooks
 * 
 * These hooks are organized by committee type. Due to naming conflicts
 * (e.g., useSocialPosts exists in multiple files), import directly from
 * the specific committee data file for committee-specific hooks.
 * 
 * Usage:
 *   import { useEmailCampaigns } from '@/hooks/committee/communication';
 *   import { useSponsors } from '@/hooks/committee/sponsorship';
 */

// Committee dashboard hooks (milestones, goals, checklists)
export { useMilestones, useGoals, useChecklists } from '../useCommitteeDashboard';

// Root dashboard
export { useRootDashboard } from '../useRootDashboard';

// Team dashboard hooks
export { useTeamAssignments, useTeamWorkload, usePersonalProgress } from '../useTeamDashboard';

// Department KPIs
export { useDepartmentKPIs } from '../useDepartmentKPIs';

// Content committee stats (no conflicts)
export { useContentCommitteeStats } from '../useContentCommitteeData';

// Judging (no conflicts with specific naming)
export {
  useJudgingStats,
  useJudgeAssignments,
  useScores,
} from '../useJudgingData';
