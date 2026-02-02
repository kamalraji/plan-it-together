import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, Clock, CheckCircle } from 'lucide-react';

interface EvaluationProgressProps {
  workspaceId?: string;
}

export function EvaluationProgress(_props: EvaluationProgressProps) {
  // Mock data - in production, fetch from database
  const progressData = {
    totalSubmissions: 48,
    evaluated: 32,
    inProgress: 8,
    pending: 8,
    averageTimePerEvaluation: 12, // minutes
    estimatedCompletion: '2h 30m',
  };

  const evaluatedPercent = (progressData.evaluated / progressData.totalSubmissions) * 100;
  const inProgressPercent = (progressData.inProgress / progressData.totalSubmissions) * 100;

  const phases = [
    {
      name: 'Round 1 - Initial Screening',
      status: 'completed',
      progress: 100,
      submissions: 48,
    },
    {
      name: 'Round 2 - Technical Review',
      status: 'in_progress',
      progress: 66,
      submissions: 32,
    },
    {
      name: 'Round 3 - Finals',
      status: 'upcoming',
      progress: 0,
      submissions: 10,
    },
  ];

  const getPhaseStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'in_progress':
        return 'text-blue-600';
      case 'upcoming':
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

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
              className="absolute h-full bg-green-500 transition-all"
              style={{ width: `${evaluatedPercent}%` }}
            />
            <div 
              className="absolute h-full bg-blue-500 transition-all"
              style={{ left: `${evaluatedPercent}%`, width: `${inProgressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Evaluated ({progressData.evaluated})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
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
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${
                      phase.status === 'in_progress' ? 'border-blue-600 text-blue-600' : 'border-muted-foreground'
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
