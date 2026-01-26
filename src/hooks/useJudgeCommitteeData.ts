import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';
import {
  WORKSPACE_JUDGE_COLUMNS,
  WORKSPACE_RUBRIC_COLUMNS,
  WORKSPACE_SUBMISSION_COLUMNS,
  WORKSPACE_SCORE_COLUMNS,
} from '@/lib/supabase-columns';

// Types
export interface WorkspaceJudge {
  id: string;
  workspace_id: string;
  user_id: string | null;
  judge_name: string;
  judge_email: string | null;
  expertise: string | null;
  category: string;
  status: string;
  availability: Json | null;
  assigned_count: number;
  completed_count: number;
  notes: string | null;
  invited_at: string;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  weight: number;
  maxScore: number;
}

export interface WorkspaceRubric {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  category: string;
  criteria: RubricCriterion[];
  max_total_score: number;
  is_active: boolean;
  is_template: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceSubmission {
  id: string;
  workspace_id: string;
  event_id: string | null;
  team_name: string;
  project_name: string;
  description: string | null;
  demo_url: string | null;
  repo_url: string | null;
  presentation_url: string | null;
  table_number: string | null;
  track: string | null;
  submitted_by: string | null;
  submitted_at: string;
  status: string;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceJudgeAssignment {
  id: string;
  workspace_id: string;
  judge_id: string;
  submission_id: string;
  rubric_id: string | null;
  status: string;
  priority: number;
  assigned_at: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  judge?: WorkspaceJudge;
  submission?: WorkspaceSubmission;
}

export interface WorkspaceScore {
  id: string;
  workspace_id: string;
  assignment_id: string;
  judge_id: string;
  submission_id: string;
  rubric_id: string | null;
  scores: Record<string, number>;
  total_score: number | null;
  weighted_score: number | null;
  comments: string | null;
  private_notes: string | null;
  is_finalist_vote: boolean;
  scored_at: string;
  created_at: string;
  updated_at: string;
  judge?: WorkspaceJudge;
  submission?: WorkspaceSubmission;
}

export interface LeaderboardEntry {
  submission_id: string;
  team_name: string;
  project_name: string;
  average_score: number;
  total_judges: number;
  completed_judges: number;
  status: string;
  track: string | null;
}

export interface JudgingProgress {
  totalSubmissions: number;
  judgedSubmissions: number;
  totalAssignments: number;
  completedAssignments: number;
  totalJudges: number;
  activeJudges: number;
  averageScore: number;
  percentComplete: number;
}

// ============ JUDGES ============

export function useWorkspaceJudges(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['workspace-judges', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      
      const { data, error } = await supabase
        .from('workspace_judges')
        .select(WORKSPACE_JUDGE_COLUMNS.detail)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as WorkspaceJudge[];
    },
    enabled: !!workspaceId,
  });
}

export function useCreateJudge(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (judge: Partial<WorkspaceJudge>) => {
      if (!workspaceId) throw new Error('Workspace ID required');

      const { data, error } = await supabase
        .from('workspace_judges')
        .insert({
          workspace_id: workspaceId,
          judge_name: judge.judge_name!,
          judge_email: judge.judge_email,
          expertise: judge.expertise,
          category: judge.category || 'general',
          status: judge.status || 'invited',
          notes: judge.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-judges', workspaceId] });
      toast.success('Judge added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add judge: ' + error.message);
    },
  });
}

export function useUpdateJudge(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, judge_name, judge_email, expertise, category, status, notes }: { id: string; judge_name?: string; judge_email?: string | null; expertise?: string | null; category?: string; status?: string; notes?: string | null }) => {
      const { data, error } = await supabase
        .from('workspace_judges')
        .update({ judge_name, judge_email, expertise, category, status, notes })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-judges', workspaceId] });
      toast.success('Judge updated');
    },
    onError: (error) => {
      toast.error('Failed to update judge: ' + error.message);
    },
  });
}

export function useDeleteJudge(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (judgeId: string) => {
      const { error } = await supabase
        .from('workspace_judges')
        .delete()
        .eq('id', judgeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-judges', workspaceId] });
      toast.success('Judge removed');
    },
    onError: (error) => {
      toast.error('Failed to remove judge: ' + error.message);
    },
  });
}

// ============ RUBRICS ============

export function useWorkspaceRubrics(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['workspace-rubrics', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from('workspace_rubrics')
        .select(WORKSPACE_RUBRIC_COLUMNS.detail)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(r => ({
        ...r,
        criteria: (Array.isArray(r.criteria) ? r.criteria : []) as unknown as RubricCriterion[],
      })) as WorkspaceRubric[];
    },
    enabled: !!workspaceId,
  });
}

export function useCreateRubric(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rubric: Partial<WorkspaceRubric>) => {
      if (!workspaceId) throw new Error('Workspace ID required');

      const { data, error } = await supabase
        .from('workspace_rubrics')
        .insert({
          workspace_id: workspaceId,
          name: rubric.name!,
          description: rubric.description,
          category: rubric.category || 'overall',
          criteria: (rubric.criteria || []) as unknown as Json,
          max_total_score: rubric.max_total_score || 100,
          is_active: rubric.is_active ?? true,
          is_template: rubric.is_template ?? false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-rubrics', workspaceId] });
      toast.success('Rubric created');
    },
    onError: (error) => {
      toast.error('Failed to create rubric: ' + error.message);
    },
  });
}

export function useUpdateRubric(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name, description, category, criteria, max_total_score, is_active }: { id: string; name?: string; description?: string | null; category?: string; criteria?: RubricCriterion[]; max_total_score?: number; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('workspace_rubrics')
        .update({
          name,
          description,
          category,
          criteria: criteria as unknown as Json,
          max_total_score,
          is_active,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-rubrics', workspaceId] });
      toast.success('Rubric updated');
    },
    onError: (error) => {
      toast.error('Failed to update rubric: ' + error.message);
    },
  });
}

export function useDeleteRubric(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rubricId: string) => {
      const { error } = await supabase
        .from('workspace_rubrics')
        .delete()
        .eq('id', rubricId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-rubrics', workspaceId] });
      toast.success('Rubric deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete rubric: ' + error.message);
    },
  });
}

// ============ SUBMISSIONS ============

export function useWorkspaceSubmissions(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['workspace-submissions', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from('workspace_submissions')
        .select(WORKSPACE_SUBMISSION_COLUMNS.detail)
        .eq('workspace_id', workspaceId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return (data || []) as WorkspaceSubmission[];
    },
    enabled: !!workspaceId,
  });
}

export function useCreateSubmission(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (submission: Partial<WorkspaceSubmission>) => {
      if (!workspaceId) throw new Error('Workspace ID required');

      const { data, error } = await supabase
        .from('workspace_submissions')
        .insert({
          workspace_id: workspaceId,
          team_name: submission.team_name!,
          project_name: submission.project_name!,
          description: submission.description,
          demo_url: submission.demo_url,
          repo_url: submission.repo_url,
          presentation_url: submission.presentation_url,
          table_number: submission.table_number,
          track: submission.track,
          status: submission.status || 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-submissions', workspaceId] });
      toast.success('Submission added');
    },
    onError: (error) => {
      toast.error('Failed to add submission: ' + error.message);
    },
  });
}

// ============ ASSIGNMENTS ============

export function useWorkspaceAssignments(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['workspace-assignments', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from('workspace_judge_assignments')
        .select(`*, judge:workspace_judges(*), submission:workspace_submissions(*)`)
        .eq('workspace_id', workspaceId)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      return (data || []) as WorkspaceJudgeAssignment[];
    },
    enabled: !!workspaceId,
  });
}

export function useCreateAssignment(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignment: { judge_id: string; submission_id: string; rubric_id?: string }) => {
      if (!workspaceId) throw new Error('Workspace ID required');

      const { data, error } = await supabase
        .from('workspace_judge_assignments')
        .insert({
          workspace_id: workspaceId,
          judge_id: assignment.judge_id,
          submission_id: assignment.submission_id,
          rubric_id: assignment.rubric_id,
          status: 'assigned',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-assignments', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-judges', workspaceId] });
      toast.success('Assignment created');
    },
    onError: (error) => {
      toast.error('Failed to create assignment: ' + error.message);
    },
  });
}

export function useBulkAssignJudges(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ judgeIds, submissionIds, rubricId }: { judgeIds: string[]; submissionIds: string[]; rubricId?: string }) => {
      if (!workspaceId) throw new Error('Workspace ID required');

      const assignments = judgeIds.flatMap(judge_id =>
        submissionIds.map(submission_id => ({
          workspace_id: workspaceId,
          judge_id,
          submission_id,
          rubric_id: rubricId,
          status: 'assigned',
        }))
      );

      const { data, error } = await supabase
        .from('workspace_judge_assignments')
        .upsert(assignments, { onConflict: 'judge_id,submission_id' })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-assignments', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-judges', workspaceId] });
      toast.success('Bulk assignments created');
    },
    onError: (error) => {
      toast.error('Failed to create bulk assignments: ' + error.message);
    },
  });
}

export function useDeleteAssignment(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('workspace_judge_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-assignments', workspaceId] });
      toast.success('Assignment removed');
    },
    onError: (error) => {
      toast.error('Failed to remove assignment: ' + error.message);
    },
  });
}

// ============ SCORES ============

export function useWorkspaceScores(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['workspace-scores', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from('workspace_scores')
        .select(`*, judge:workspace_judges(*), submission:workspace_submissions(*)`)
        .eq('workspace_id', workspaceId)
        .order('scored_at', { ascending: false });

      if (error) throw error;
      return (data || []) as WorkspaceScore[];
    },
    enabled: !!workspaceId,
  });
}

// ============ ANALYTICS ============

export function useJudgingProgress(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['judging-progress', workspaceId],
    queryFn: async (): Promise<JudgingProgress> => {
      if (!workspaceId) {
        return { totalSubmissions: 0, judgedSubmissions: 0, totalAssignments: 0, completedAssignments: 0, totalJudges: 0, activeJudges: 0, averageScore: 0, percentComplete: 0 };
      }

      const [{ data: submissions }, { data: judges }, { data: assignments }, { data: scores }] = await Promise.all([
        supabase.from('workspace_submissions').select('id').eq('workspace_id', workspaceId),
        supabase.from('workspace_judges').select('id, status').eq('workspace_id', workspaceId),
        supabase.from('workspace_judge_assignments').select('id, status').eq('workspace_id', workspaceId),
        supabase.from('workspace_scores').select('id, submission_id, total_score').eq('workspace_id', workspaceId),
      ]);

      const totalSubmissions = submissions?.length || 0;
      const judgedSubmissionIds = new Set(scores?.map(s => s.submission_id) || []);
      const totalAssignments = assignments?.length || 0;
      const completedAssignments = assignments?.filter(a => a.status === 'completed').length || 0;
      const totalJudges = judges?.length || 0;
      const activeJudges = judges?.filter(j => j.status === 'active' || j.status === 'confirmed').length || 0;
      const scoreValues = scores?.map(s => s.total_score).filter((s): s is number => s !== null) || [];
      const averageScore = scoreValues.length > 0 ? scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length : 0;
      const percentComplete = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

      return { totalSubmissions, judgedSubmissions: judgedSubmissionIds.size, totalAssignments, completedAssignments, totalJudges, activeJudges, averageScore: Math.round(averageScore * 10) / 10, percentComplete };
    },
    enabled: !!workspaceId,
    refetchInterval: 30000,
  });
}

export function useLeaderboard(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['leaderboard', workspaceId],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      if (!workspaceId) return [];

      const [{ data: submissions }, { data: scores }, { data: assignments }] = await Promise.all([
        supabase.from('workspace_submissions').select(WORKSPACE_SUBMISSION_COLUMNS.leaderboard).eq('workspace_id', workspaceId),
        supabase.from('workspace_scores').select(WORKSPACE_SCORE_COLUMNS.list).eq('workspace_id', workspaceId),
        supabase.from('workspace_judge_assignments').select('submission_id, status').eq('workspace_id', workspaceId),
      ]);

      if (!submissions?.length) return [];

      return submissions.map(sub => {
        const subScores = scores?.filter(s => s.submission_id === sub.id) || [];
        const subAssignments = assignments?.filter(a => a.submission_id === sub.id) || [];
        const scoreValues = subScores.map(s => s.total_score).filter((s): s is number => s !== null);
        const averageScore = scoreValues.length > 0 ? scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length : 0;

        return {
          submission_id: sub.id,
          team_name: sub.team_name,
          project_name: sub.project_name,
          average_score: Math.round(averageScore * 10) / 10,
          total_judges: subAssignments.length,
          completed_judges: subAssignments.filter(a => a.status === 'completed').length,
          status: sub.status || 'pending',
          track: sub.track,
        };
      }).sort((a, b) => b.average_score - a.average_score);
    },
    enabled: !!workspaceId,
    refetchInterval: 30000,
  });
}

// ============ JUDGE-SPECIFIC QUERIES ============

export function useJudgeAssignmentsByJudge(workspaceId: string | undefined, judgeId: string | undefined) {
  return useQuery({
    queryKey: ['judge-assignments-by-judge', workspaceId, judgeId],
    queryFn: async () => {
      if (!workspaceId || !judgeId) return [];

      const { data, error } = await supabase
        .from('workspace_judge_assignments')
        .select(`*, submission:workspace_submissions(*), rubric:workspace_rubrics(*)`)
        .eq('workspace_id', workspaceId)
        .eq('judge_id', judgeId)
        .order('priority', { ascending: true });

      if (error) throw error;
      
      // Map the data to handle rubric criteria type
      return (data || []).map(item => ({
        ...item,
        rubric: item.rubric ? {
          ...item.rubric,
          criteria: (Array.isArray(item.rubric.criteria) ? item.rubric.criteria : []) as unknown as RubricCriterion[],
        } : undefined,
      })) as (WorkspaceJudgeAssignment & { rubric?: WorkspaceRubric })[];
    },
    enabled: !!workspaceId && !!judgeId,
  });
}

export function useCurrentUserAsJudge(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['current-user-as-judge', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return null;

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return null;

      const { data, error } = await supabase
        .from('workspace_judges')
        .select(WORKSPACE_JUDGE_COLUMNS.detail)
        .eq('workspace_id', workspaceId)
        .eq('user_id', userData.user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as WorkspaceJudge | null;
    },
    enabled: !!workspaceId,
  });
}

export function useJudgeScore(assignmentId: string | undefined) {
  return useQuery({
    queryKey: ['judge-score', assignmentId],
    queryFn: async () => {
      if (!assignmentId) return null;

      const { data, error } = await supabase
        .from('workspace_scores')
        .select(WORKSPACE_SCORE_COLUMNS.detail)
        .eq('assignment_id', assignmentId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as WorkspaceScore | null;
    },
    enabled: !!assignmentId,
  });
}

// ============ SCORE SUBMISSION ============

export interface ScoreSubmission {
  assignment_id: string;
  judge_id: string;
  submission_id: string;
  rubric_id: string | null;
  scores: Record<string, number>;
  comments?: string;
  private_notes?: string;
}

export function useSubmitScore(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scoreData: ScoreSubmission) => {
      if (!workspaceId) throw new Error('Workspace ID required');

      // Calculate total and weighted scores based on rubric
      let total_score = 0;
      let weighted_score = 0;

      if (scoreData.rubric_id) {
        const { data: rubric } = await supabase
          .from('workspace_rubrics')
          .select('criteria, max_total_score')
          .eq('id', scoreData.rubric_id)
          .single();

        if (rubric?.criteria) {
          const criteria = rubric.criteria as unknown as RubricCriterion[];
          criteria.forEach((criterion) => {
            const score = scoreData.scores[criterion.id] || 0;
            total_score += score;
            weighted_score += (score / criterion.maxScore) * criterion.weight;
          });
        }
      } else {
        total_score = Object.values(scoreData.scores).reduce((sum, s) => sum + s, 0);
        weighted_score = total_score;
      }

      // Upsert score
      const { data, error } = await supabase
        .from('workspace_scores')
        .upsert({
          workspace_id: workspaceId,
          assignment_id: scoreData.assignment_id,
          judge_id: scoreData.judge_id,
          submission_id: scoreData.submission_id,
          rubric_id: scoreData.rubric_id,
          scores: scoreData.scores as unknown as Json,
          total_score,
          weighted_score,
          comments: scoreData.comments || null,
          private_notes: scoreData.private_notes || null,
          scored_at: new Date().toISOString(),
        }, { onConflict: 'assignment_id' })
        .select()
        .single();

      if (error) throw error;

      // Update assignment status to completed
      await supabase
        .from('workspace_judge_assignments')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', scoreData.assignment_id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-scores', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-assignments', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['judge-assignments-by-judge'] });
      queryClient.invalidateQueries({ queryKey: ['judge-score'] });
      queryClient.invalidateQueries({ queryKey: ['judging-progress', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard', workspaceId] });
      toast.success('Score submitted successfully');
    },
    onError: (error) => {
      toast.error('Failed to submit score: ' + error.message);
    },
  });
}

export function useUpdateAssignmentStatus(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assignmentId, status }: { assignmentId: string; status: string }) => {
      const updateData: { status: string; started_at?: string; completed_at?: string | null } = { status };
      
      if (status === 'in_progress') {
        updateData.started_at = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (status === 'assigned') {
        updateData.completed_at = null;
      }

      const { data, error } = await supabase
        .from('workspace_judge_assignments')
        .update(updateData)
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-assignments', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['judge-assignments-by-judge'] });
    },
    onError: (error) => {
      toast.error('Failed to update assignment: ' + error.message);
    },
  });
}

// Rubric templates
export const RUBRIC_TEMPLATES = {
  hackathon: { name: 'Hackathon Standard', description: 'Standard hackathon judging rubric', category: 'overall', criteria: [{ id: '1', name: 'Innovation', description: 'How creative and original is the solution?', weight: 25, maxScore: 10 }, { id: '2', name: 'Technical Complexity', description: 'How technically challenging is the implementation?', weight: 25, maxScore: 10 }, { id: '3', name: 'Design & UX', description: 'How well-designed and user-friendly is the product?', weight: 20, maxScore: 10 }, { id: '4', name: 'Presentation', description: 'How well was the project presented?', weight: 20, maxScore: 10 }, { id: '5', name: 'Completion', description: 'How complete and functional is the demo?', weight: 10, maxScore: 10 }], max_total_score: 100 },
  design: { name: 'Design Challenge', description: 'Rubric focused on design and UX', category: 'design', criteria: [{ id: '1', name: 'Visual Design', description: 'Aesthetics, color, typography', weight: 30, maxScore: 10 }, { id: '2', name: 'User Experience', description: 'Usability, flow, interaction', weight: 30, maxScore: 10 }, { id: '3', name: 'Creativity', description: 'Originality and creative approach', weight: 25, maxScore: 10 }, { id: '4', name: 'Presentation', description: 'How well the design was presented', weight: 15, maxScore: 10 }], max_total_score: 100 },
  technical: { name: 'Technical Demo', description: 'Rubric emphasizing technical implementation', category: 'technical', criteria: [{ id: '1', name: 'Functionality', description: 'Does it work? Feature completeness', weight: 35, maxScore: 10 }, { id: '2', name: 'Code Quality', description: 'Clean code, architecture', weight: 25, maxScore: 10 }, { id: '3', name: 'Innovation', description: 'Novel technical approaches', weight: 25, maxScore: 10 }, { id: '4', name: 'Documentation', description: 'README, comments, API docs', weight: 15, maxScore: 10 }], max_total_score: 100 },
  pitch: { name: 'Pitch Competition', description: 'Business pitch evaluation rubric', category: 'pitch', criteria: [{ id: '1', name: 'Business Model', description: 'Viability and scalability', weight: 30, maxScore: 10 }, { id: '2', name: 'Market Analysis', description: 'Understanding of market', weight: 25, maxScore: 10 }, { id: '3', name: 'Presentation Skills', description: 'Clarity and engagement', weight: 25, maxScore: 10 }, { id: '4', name: 'Feasibility', description: 'Realistic execution plan', weight: 20, maxScore: 10 }], max_total_score: 100 },
};
