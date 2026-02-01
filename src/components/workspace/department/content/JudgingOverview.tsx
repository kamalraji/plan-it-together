import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Gavel, Users, FileCheck, Clock, TrendingUp } from 'lucide-react';

interface JudgingStats {
  totalJudges: number;
  activeJudges: number;
  totalSubmissions: number;
  evaluatedSubmissions: number;
  averageScore: number;
  pendingAssignments: number;
}

const mockStats: JudgingStats = {
  totalJudges: 12,
  activeJudges: 10,
  totalSubmissions: 48,
  evaluatedSubmissions: 32,
  averageScore: 7.4,
  pendingAssignments: 5,
};

export function JudgingOverview() {
  const evaluationProgress = Math.round((mockStats.evaluatedSubmissions / mockStats.totalSubmissions) * 100);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10">
              <Gavel className="h-4 w-4 text-amber-500" />
            </div>
            Judging Overview
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {evaluationProgress}% complete
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Evaluation Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Evaluation Progress</span>
            <span className="font-medium text-foreground">
              {mockStats.evaluatedSubmissions}/{mockStats.totalSubmissions}
            </span>
          </div>
          <Progress value={evaluationProgress} className="h-2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-accent/50 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Active Judges</span>
            </div>
            <p className="text-lg font-semibold text-foreground">
              {mockStats.activeJudges}/{mockStats.totalJudges}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-accent/50 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <FileCheck className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Submissions</span>
            </div>
            <p className="text-lg font-semibold text-foreground">
              {mockStats.totalSubmissions}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-accent/50 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">Avg Score</span>
            </div>
            <p className="text-lg font-semibold text-foreground">
              {mockStats.averageScore}/10
            </p>
          </div>

          <div className="p-3 rounded-lg bg-accent/50 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Pending</span>
            </div>
            <p className="text-lg font-semibold text-foreground">
              {mockStats.pendingAssignments}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <button className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            View All Judges
          </button>
          <button className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
            Assign Submissions
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
