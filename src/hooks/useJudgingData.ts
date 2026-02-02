import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface JudgingStats {
  totalJudges: number;
  activeJudges: number;
  totalSubmissions: number;
  evaluatedSubmissions: number;
  averageScore: number;
  pendingAssignments: number;
}

export function useJudgingStats(eventId: string | undefined) {
  return useQuery({
    queryKey: ['judging-stats', eventId],
    queryFn: async (): Promise<JudgingStats> => {
      if (!eventId) {
        return {
          totalJudges: 0,
          activeJudges: 0,
          totalSubmissions: 0,
          evaluatedSubmissions: 0,
          averageScore: 0,
          pendingAssignments: 0,
        };
      }

      // Get all submissions for this event
      const { data: submissions, error: submissionsError } = await supabase
        .from('submissions')
        .select('id')
        .eq('event_id', eventId);

      if (submissionsError) throw submissionsError;

      const submissionIds = submissions?.map(s => s.id) || [];
      const totalSubmissions = submissionIds.length;

      if (totalSubmissions === 0) {
        return {
          totalJudges: 0,
          activeJudges: 0,
          totalSubmissions: 0,
          evaluatedSubmissions: 0,
          averageScore: 0,
          pendingAssignments: 0,
        };
      }

      // Get all judge assignments for these submissions
      const { data: assignments, error: assignmentsError } = await supabase
        .from('judge_assignments')
        .select('id, judge_id, submission_id')
        .in('submission_id', submissionIds);

      if (assignmentsError) throw assignmentsError;

      // Get unique judges
      const uniqueJudges = new Set(assignments?.map(a => a.judge_id) || []);
      const totalJudges = uniqueJudges.size;

      // Get all scores for these submissions
      const { data: scores, error: scoresError } = await supabase
        .from('scores')
        .select('id, judge_id, submission_id, scores')
        .in('submission_id', submissionIds);

      if (scoresError) throw scoresError;

      // Active judges are those who have submitted at least one score
      const activeJudgeIds = new Set(scores?.map(s => s.judge_id) || []);
      const activeJudges = activeJudgeIds.size;

      // Evaluated submissions are those that have at least one score
      const evaluatedSubmissionIds = new Set(scores?.map(s => s.submission_id) || []);
      const evaluatedSubmissions = evaluatedSubmissionIds.size;

      // Calculate average score
      let averageScore = 0;
      if (scores && scores.length > 0) {
        const allScoreValues: number[] = [];
        scores.forEach(score => {
          const scoreData = score.scores as Record<string, number>;
          if (scoreData && typeof scoreData === 'object') {
            Object.values(scoreData).forEach(val => {
              if (typeof val === 'number') {
                allScoreValues.push(val);
              }
            });
          }
        });
        if (allScoreValues.length > 0) {
          averageScore = allScoreValues.reduce((a, b) => a + b, 0) / allScoreValues.length;
        }
      }

      // Pending assignments = total assignments - completed scores
      const completedAssignments = new Set(
        scores?.map(s => `${s.judge_id}-${s.submission_id}`) || []
      );
      const totalAssignmentPairs = assignments?.map(a => `${a.judge_id}-${a.submission_id}`) || [];
      const pendingAssignments = totalAssignmentPairs.filter(
        pair => !completedAssignments.has(pair)
      ).length;

      return {
        totalJudges,
        activeJudges,
        totalSubmissions,
        evaluatedSubmissions,
        averageScore: Math.round(averageScore * 10) / 10,
        pendingAssignments,
      };
    },
    enabled: !!eventId,
    refetchInterval: 30000, // Refresh every 30 seconds for live updates
  });
}

export function useJudgeAssignments(eventId: string | undefined) {
  return useQuery({
    queryKey: ['judge-assignments', eventId],
    queryFn: async () => {
      if (!eventId) return [];

      const { data: submissions } = await supabase
        .from('submissions')
        .select('id')
        .eq('event_id', eventId);

      if (!submissions?.length) return [];

      const { data, error } = await supabase
        .from('judge_assignments')
        .select('*')
        .in('submission_id', submissions.map(s => s.id));

      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
  });
}

export function useScores(eventId: string | undefined) {
  return useQuery({
    queryKey: ['scores', eventId],
    queryFn: async () => {
      if (!eventId) return [];

      const { data: submissions } = await supabase
        .from('submissions')
        .select('id')
        .eq('event_id', eventId);

      if (!submissions?.length) return [];

      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .in('submission_id', submissions.map(s => s.id));

      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
  });
}
