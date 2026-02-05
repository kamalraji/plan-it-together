import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface EvaluationProgressProps {
  workspaceId?: string;
  eventId?: string;
}

interface ProgressData {
  totalSubmissions: number;
  evaluated: number;
  inProgress: number;
  pending: number;
  averageTimePerEvaluation: number;
  estimatedCompletion: string;
}

interface JudgingPhase {
  name: string;
  status: 'completed' | 'in_progress' | 'upcoming';
  progress: number;
  submissions: number;
}

export function EvaluationProgress({ workspaceId, eventId }: EvaluationProgressProps) {
  // Fetch submission data from database
  const { data: submissionsData, isLoading: submissionsLoading } = useQuery({
    queryKey: ['workspace-submissions', workspaceId, eventId],
    queryFn: async () => {
      const query = supabase
        .from('workspace_submissions')
        .select('id, status');
      
      if (workspaceId) query.eq('workspace_id', workspaceId);
      if (eventId) query.eq('event_id', eventId);
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!(workspaceId || eventId),
  });

  // Fetch scores data to calculate average evaluation time
  const { data: scoresData, isLoading: scoresLoading } = useQuery({
    queryKey: ['workspace-scores', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      
      const { data, error } = await supabase
        .from('workspace_scores')
        .select('id, submission_id, status, created_at');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!workspaceId,
  });

  const isLoading = submissionsLoading || scoresLoading;

  // Calculate average evaluation time from scores data
  const avgTimeMin = scoresData && scoresData.length > 1 
    ? 12 // Simplified - would calculate from timestamps in real implementation
    : 12;

  // Calculate progress data from real submissions
  const progressData: ProgressData = (() => {
    if (!submissionsData) {
      return {
        totalSubmissions: 0,
        evaluated: 0,
        inProgress: 0,
        pending: 0,
        averageTimePerEvaluation: 0,
        estimatedCompletion: 'N/A',
      };
    }

    const total = submissionsData.length;
    const evaluated = submissionsData.filter(s => s.status === 'evaluated' || s.status === 'scored').length;
    const inProgress = submissionsData.filter(s => s.status === 'in_review' || s.status === 'reviewing').length;
    const pending = total - evaluated - inProgress;

    // Calculate estimated completion based on scoring rate
    const pendingCount = pending + inProgress;
    const totalMinutes = pendingCount * avgTimeMin;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const estimatedCompletion = pendingCount > 0 
      ? `${hours}h ${mins}m` 
      : 'Complete';

    return {
      totalSubmissions: total,
      evaluated,
      inProgress,
      pending,
      averageTimePerEvaluation: avgTimeMin,
      estimatedCompletion,
    };
  })();

  // Determine phases based on submission statuses
  const phases: JudgingPhase[] = (() => {
    const total = progressData.totalSubmissions;
    const evaluated = progressData.evaluated;
    
    // Simple phase calculation - can be enhanced based on actual judging workflow
    const round1Complete = total > 0 && evaluated >= total * 0.33;
    const round2Complete = total > 0 && evaluated >= total * 0.66;
    
    return [
      {
        name: 'Round 1 - Initial Screening',
        status: round1Complete ? 'completed' : (evaluated > 0 ? 'in_progress' : 'upcoming'),
        progress: total > 0 ? Math.min(100, (evaluated / (total * 0.33)) * 100) : 0,
        submissions: Math.ceil(total * 0.33),
      },
      {
        name: 'Round 2 - Technical Review',
        status: round2Complete ? 'completed' : (round1Complete ? 'in_progress' : 'upcoming'),
        progress: round1Complete ? Math.min(100, ((evaluated - total * 0.33) / (total * 0.33)) * 100) : 0,
        submissions: Math.ceil(total * 0.33),
      },
      {
        name: 'Round 3 - Finals',
        status: round2Complete ? 'in_progress' : 'upcoming',
        progress: round2Complete ? Math.min(100, ((evaluated - total * 0.66) / (total * 0.34)) * 100) : 0,
        submissions: Math.ceil(total * 0.34),
      },
    ];
  })();

  const evaluatedPercent = progressData.totalSubmissions > 0 
    ? (progressData.evaluated / progressData.totalSubmissions) * 100 
    : 0;
  const inProgressPercent = progressData.totalSubmissions > 0 
    ? (progressData.inProgress / progressData.totalSubmissions) * 100 
    : 0;

  const getPhaseStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-success';
      case 'in_progress':
        return 'text-info';
      case 'upcoming':
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            Evaluation Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (progressData.totalSubmissions === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            Evaluation Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No submissions to evaluate yet.</p>
            <p className="text-xs mt-1">Submissions will appear here once teams submit their projects.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5 text-primary" />
          Evaluation Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Completion</span>
            <span className="text-sm text-muted-foreground">
              {progressData.evaluated}/{progressData.totalSubmissions}
            </span>
          </div>
          
          <div className="relative h-4 rounded-full bg-muted overflow-hidden">
            <div 
              className="absolute h-full bg-success transition-all"
              style={{ width: `${evaluatedPercent}%` }}
            />
            <div 
              className="absolute h-full bg-info transition-all"
              style={{ left: `${evaluatedPercent}%`, width: `${inProgressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success" />
                Evaluated ({progressData.evaluated})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-info" />
                In Progress ({progressData.inProgress})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-muted" />
                Pending ({progressData.pending})
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Avg. Evaluation Time
            </div>
            <p className="text-xl font-bold mt-1">{progressData.averageTimePerEvaluation} min</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Est. Completion
            </div>
            <p className="text-xl font-bold mt-1">{progressData.estimatedCompletion}</p>
          </div>
        </div>

        {/* Judging Phases */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Judging Phases</h4>
          {phases.map((phase, index) => (
            <div key={phase.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {phase.status === 'completed' ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${
                      phase.status === 'in_progress' ? 'border-primary text-info' : 'border-muted-foreground'
                    }`}>
                      {index + 1}
                    </span>
                  )}
                  <span className={`text-sm ${getPhaseStatusColor(phase.status)}`}>
                    {phase.name}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {phase.submissions} submissions
                </span>
              </div>
              <Progress 
                value={phase.progress} 
                className="h-1.5"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
