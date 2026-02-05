import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Gavel, Users, FileCheck, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import { useJudgingStats } from '@/hooks/useJudgingData';

interface JudgingOverviewConnectedProps {
  eventId?: string;
  onAssignJudge?: () => void;
  onEnterScore?: () => void;
}

export function JudgingOverviewConnected({ eventId, onAssignJudge, onEnterScore }: JudgingOverviewConnectedProps) {
  const { data: stats, isLoading, refetch, isFetching } = useJudgingStats(eventId);

  const evaluationProgress = stats && stats.totalSubmissions > 0
    ? Math.round((stats.evaluatedSubmissions / stats.totalSubmissions) * 100)
    : 0;

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-2 w-full" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasData = stats && (stats.totalJudges > 0 || stats.totalSubmissions > 0);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-warning/10">
              <Gavel className="h-4 w-4 text-warning" />
            </div>
            Judging Overview
          </CardTitle>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-1 rounded hover:bg-accent transition-colors"
              title="Refresh data"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${isFetching ? 'animate-spin' : ''}`} />
            </button>
            <Badge variant="secondary" className="text-xs">
              {evaluationProgress}% complete
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasData ? (
          <div className="text-center py-6 text-muted-foreground">
            <Gavel className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No judging data yet</p>
            <p className="text-xs">Assign judges to submissions to see progress</p>
          </div>
        ) : (
          <>
            {/* Evaluation Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Evaluation Progress</span>
                <span className="font-medium text-foreground">
                  {stats?.evaluatedSubmissions || 0}/{stats?.totalSubmissions || 0}
                </span>
              </div>
              <Progress value={evaluationProgress} className="h-2" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-accent/50 border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-info" />
                  <span className="text-xs text-muted-foreground">Active Judges</span>
                </div>
                <p className="text-lg font-semibold text-foreground">
                  {stats?.activeJudges || 0}/{stats?.totalJudges || 0}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-accent/50 border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <FileCheck className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs text-muted-foreground">Submissions</span>
                </div>
                <p className="text-lg font-semibold text-foreground">
                  {stats?.totalSubmissions || 0}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-accent/50 border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Avg Score</span>
                </div>
                <p className="text-lg font-semibold text-foreground">
                  {stats?.averageScore || 0}/10
                </p>
              </div>

              <div className="p-3 rounded-lg bg-accent/50 border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-warning" />
                  <span className="text-xs text-muted-foreground">Pending</span>
                </div>
                <p className="text-lg font-semibold text-foreground">
                  {stats?.pendingAssignments || 0}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <button 
                onClick={onEnterScore}
                className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                Enter Score
              </button>
              <button 
                onClick={onAssignJudge}
                className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                Assign Submissions
              </button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
