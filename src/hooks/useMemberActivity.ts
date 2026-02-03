import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MemberActivityData {
  tasksAssigned: number;
  tasksCompleted: number;
  lastActivity: string | null;
  contributionScore: number;
}

/**
 * Hook to fetch activity data for all team members in a workspace
 */
export function useTeamMemberActivity(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['team-member-activity', workspaceId],
    queryFn: async (): Promise<Map<string, MemberActivityData>> => {
      if (!workspaceId) return new Map();

      // Fetch all tasks for the workspace
      const { data: tasks } = await supabase
        .from('workspace_tasks')
        .select('id, assigned_to, status, updated_at')
        .eq('workspace_id', workspaceId);

      if (!tasks) return new Map();

      // Group by assigned_to
      const activityMap = new Map<string, MemberActivityData>();

      // Get unique assignees
      const assignees = [...new Set(tasks.map(t => t.assigned_to).filter(Boolean))];

      for (const userId of assignees) {
        if (!userId) continue;
        
        const memberTasks = tasks.filter(t => t.assigned_to === userId);
        const completedTasks = memberTasks.filter(t => 
          ['completed', 'done', 'COMPLETED'].includes(t.status || '')
        );

        // Find the most recent task update
        const sortedByDate = [...memberTasks].sort((a, b) => 
          new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
        );
        const lastActivity = sortedByDate[0]?.updated_at || null;

        // Calculate contribution score (0-100)
        // Based on: tasks assigned, completion rate, recency
        const tasksAssigned = memberTasks.length;
        const tasksCompleted = completedTasks.length;
        const completionRate = tasksAssigned > 0 ? tasksCompleted / tasksAssigned : 0;
        
        // Recency factor (more recent = higher score)
        let recencyFactor = 0;
        if (lastActivity) {
          const daysSinceActivity = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24);
          recencyFactor = Math.max(0, 1 - (daysSinceActivity / 30)); // Decays over 30 days
        }

        // Weighted contribution score
        const contributionScore = Math.round(
          (completionRate * 50) + // 50% weight for completion rate
          (Math.min(tasksAssigned, 10) * 3) + // Up to 30% for volume (capped at 10 tasks)
          (recencyFactor * 20) // 20% for recency
        );

        activityMap.set(userId, {
          tasksAssigned,
          tasksCompleted,
          lastActivity,
          contributionScore: Math.min(100, Math.max(0, contributionScore)),
        });
      }

      return activityMap;
    },
    enabled: !!workspaceId,
  });
}

/**
 * Get activity data for a single member
 */
export function useSingleMemberActivity(workspaceId: string | undefined, userId: string | undefined) {
  const { data: activityMap, isLoading } = useTeamMemberActivity(workspaceId);
  
  const activity = userId && activityMap ? activityMap.get(userId) : undefined;
  
  return {
    activity: activity || {
      tasksAssigned: 0,
      tasksCompleted: 0,
      lastActivity: null,
      contributionScore: 0,
    },
    isLoading,
  };
}
