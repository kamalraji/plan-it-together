import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileCheck, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ChevronRight,
  Shuffle,
  RefreshCw
} from 'lucide-react';
import { useWorkspaceSubmissions, useWorkspaceAssignments, useWorkspaceScores } from '@/hooks/useJudgeCommitteeData';

interface SubmissionAssignmentsProps {
  workspaceId?: string;
}

type SubmissionStatus = 'pending' | 'in_review' | 'scored' | 'needs_consensus';

interface EnrichedSubmission {
  id: string;
  teamName: string;
  projectTitle: string;
  track: string | null;
  submittedAt: string;
  assignedJudges: number;
  completedJudges: number;
  status: SubmissionStatus;
  averageScore: number | null;
}

export function SubmissionAssignments({ workspaceId }: SubmissionAssignmentsProps) {
  const { data: submissions = [], isLoading: loadingSubmissions, refetch, isFetching } = useWorkspaceSubmissions(workspaceId);
  const { data: assignments = [] } = useWorkspaceAssignments(workspaceId);
  const { data: scores = [] } = useWorkspaceScores(workspaceId);

  // Enrich submissions with assignment and score data
  const enrichedSubmissions: EnrichedSubmission[] = submissions.map(sub => {
    const subAssignments = assignments.filter(a => a.submission_id === sub.id);
    const subScores = scores.filter(s => s.submission_id === sub.id);
    
    const assignedJudges = subAssignments.length;
    const completedJudges = subScores.length;
    
    // Calculate average score
    const scoreValues = subScores
      .map(s => s.total_score)
      .filter((s): s is number => s !== null);
    const averageScore = scoreValues.length > 0 
      ? Math.round((scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length) * 10) / 10
      : null;

    // Determine status
    let status: SubmissionStatus = 'pending';
    if (assignedJudges === 0) {
      status = 'pending';
    } else if (completedJudges === 0) {
      status = 'pending';
    } else if (completedJudges < assignedJudges) {
      status = 'in_review';
    } else if (completedJudges === assignedJudges) {
      // Check for score variance (needs consensus if scores differ significantly)
      if (scoreValues.length >= 2) {
        const variance = Math.max(...scoreValues) - Math.min(...scoreValues);
        status = variance > 3 ? 'needs_consensus' : 'scored';
      } else {
        status = 'scored';
      }
    }

    return {
      id: sub.id,
      teamName: sub.team_name,
      projectTitle: sub.project_name,
      track: sub.track,
      submittedAt: sub.submitted_at,
      assignedJudges,
      completedJudges,
      status,
      averageScore,
    };
  });

  const getStatusConfig = (status: SubmissionStatus) => {
    switch (status) {
      case 'pending':
        return { color: 'bg-muted text-foreground', icon: Clock, label: 'Pending' };
      case 'in_review':
        return { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: AlertCircle, label: 'In Review' };
      case 'scored':
        return { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle, label: 'Scored' };
      case 'needs_consensus':
        return { color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', icon: Users, label: 'Needs Consensus' };
    }
  };

  if (loadingSubmissions) {
    return (
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileCheck className="h-5 w-5 text-primary" />
            Submission Assignments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 rounded-lg bg-muted/30">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2 mb-3" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileCheck className="h-5 w-5 text-primary" />
          Submission Assignments
        </CardTitle>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-1 rounded hover:bg-accent transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 text-muted-foreground ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <Button size="sm" variant="outline" className="gap-1">
            <Shuffle className="h-4 w-4" />
            Auto-Assign
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {enrichedSubmissions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileCheck className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No submissions yet</p>
            <p className="text-sm">Submissions will appear here once teams submit their projects</p>
          </div>
        ) : (
          enrichedSubmissions.slice(0, 5).map((submission) => {
            const statusConfig = getStatusConfig(submission.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div 
                key={submission.id} 
                className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{submission.projectTitle}</p>
                      {submission.averageScore !== null && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          {submission.averageScore}/100
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">by {submission.teamName}</p>
                  </div>
                  <Badge className={statusConfig.color} variant="secondary">
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {submission.track && (
                      <Badge variant="outline" className="text-xs">
                        {submission.track}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      <Users className="h-3 w-3 inline mr-1" />
                      {submission.completedJudges}/{submission.assignedJudges} judges
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            );
          })
        )}

        {enrichedSubmissions.length > 5 && (
          <Button variant="ghost" className="w-full text-muted-foreground">
            View All {enrichedSubmissions.length} Submissions
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
