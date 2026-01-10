import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Medal, 
  Award, 
  ArrowLeft,
  Eye,
  EyeOff,
  RefreshCw,
  Users,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Workspace } from '@/types';
import { useJudgingStats } from '@/hooks/useJudgingData';

interface LeaderboardEntry {
  rank: number;
  submissionId: string;
  teamName: string;
  description: string | null;
  totalScore: number;
  judgeCount: number;
  maxPossibleScore: number;
  scorePercentage: number;
}

interface LeaderboardTabProps {
  workspace: Workspace;
  onBack?: () => void;
}

function useLeaderboard(eventId: string | undefined) {
  return useQuery({
    queryKey: ['leaderboard', eventId],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      if (!eventId) return [];

      // Get all submissions for this event
      const { data: submissions, error: submissionsError } = await supabase
        .from('submissions')
        .select('id, team_name, description, rubric_id')
        .eq('event_id', eventId);

      if (submissionsError) throw submissionsError;
      if (!submissions?.length) return [];

      // Get all scores for these submissions
      const { data: scores, error: scoresError } = await supabase
        .from('scores')
        .select('submission_id, judge_id, scores')
        .in('submission_id', submissions.map(s => s.id));

      if (scoresError) throw scoresError;

      // Get rubric to calculate max possible score
      const rubricIds = [...new Set(submissions.map(s => s.rubric_id))];
      const { data: rubrics } = await supabase
        .from('rubrics')
        .select('id, criteria')
        .in('id', rubricIds);

      // Calculate max possible score from rubric criteria
      const getMaxScore = (rubricId: string) => {
        const rubric = rubrics?.find(r => r.id === rubricId);
        if (!rubric?.criteria) return 100;
        const criteria = rubric.criteria as Array<{ maxScore?: number; weight?: number }>;
        return criteria.reduce((sum, c) => sum + (c.maxScore || c.weight || 10), 0);
      };

      // Calculate total scores for each submission
      const submissionScores = submissions.map(submission => {
        const submissionScoreRecords = scores?.filter(s => s.submission_id === submission.id) || [];
        const judgeCount = new Set(submissionScoreRecords.map(s => s.judge_id)).size;
        
        let totalScore = 0;
        submissionScoreRecords.forEach(score => {
          const scoreData = score.scores as Record<string, number>;
          if (scoreData && typeof scoreData === 'object') {
            Object.values(scoreData).forEach(val => {
              if (typeof val === 'number') {
                totalScore += val;
              }
            });
          }
        });

        // Average score if multiple judges
        const averageScore = judgeCount > 0 ? totalScore / judgeCount : 0;
        const maxPossibleScore = getMaxScore(submission.rubric_id);
        const scorePercentage = maxPossibleScore > 0 ? (averageScore / maxPossibleScore) * 100 : 0;

        return {
          submissionId: submission.id,
          teamName: submission.team_name,
          description: submission.description,
          totalScore: Math.round(averageScore * 10) / 10,
          judgeCount,
          maxPossibleScore,
          scorePercentage: Math.round(scorePercentage * 10) / 10,
        };
      });

      // Sort by total score descending and add ranks
      const sorted = submissionScores
        .sort((a, b) => b.totalScore - a.totalScore)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));

      return sorted;
    },
    enabled: !!eventId,
    refetchInterval: 30000, // Real-time updates every 30 seconds
  });
}

export function LeaderboardTab({ workspace, onBack }: LeaderboardTabProps) {
  const [isPublic, setIsPublic] = useState(false);
  const eventId = workspace.eventId;
  
  const { data: leaderboard = [], isLoading, refetch, isRefetching } = useLeaderboard(eventId);
  const { data: stats } = useJudgingStats(eventId);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return (
          <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-muted-foreground bg-muted rounded-full">
            {rank}
          </span>
        );
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-gray-500/10 to-slate-500/10 border-gray-500/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/10 to-orange-500/10 border-amber-600/30';
      default:
        return 'bg-card border-border hover:bg-muted/50';
    }
  };

  if (!eventId) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Event Linked</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          This workspace is not linked to an event. Please link an event to view the leaderboard.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const completionRate = stats 
    ? Math.round((stats.evaluatedSubmissions / Math.max(stats.totalSubmissions, 1)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Live Leaderboard
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time submission rankings and judging progress
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setIsPublic(!isPublic)}
            className="gap-1"
          >
            {isPublic ? (
              <>
                <Eye className="h-4 w-4" />
                Public
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4" />
                Private
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Target className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Submissions</p>
                <p className="text-xl font-bold">{stats?.totalSubmissions || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active Judges</p>
                <p className="text-xl font-bold">{stats?.activeJudges || 0} / {stats?.totalJudges || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Evaluated</p>
                <p className="text-xl font-bold">{stats?.evaluatedSubmissions || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Score</p>
                <p className="text-xl font-bold">{stats?.averageScore || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Judging Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Judging Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Completion Rate</span>
              <span className="font-medium">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {stats?.pendingAssignments || 0} pending evaluations remaining
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard Tabs */}
      <Tabs defaultValue="rankings" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="rankings">Rankings</TabsTrigger>
          <TabsTrigger value="detailed">Detailed View</TabsTrigger>
        </TabsList>

        <TabsContent value="rankings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Submission Rankings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {leaderboard.length === 0 ? (
                    <div className="text-center py-12">
                      <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No rankings yet</h3>
                      <p className="text-sm text-muted-foreground">
                        Rankings will appear once judges start scoring submissions
                      </p>
                    </div>
                  ) : (
                    leaderboard.map((entry) => (
                      <div
                        key={entry.submissionId}
                        className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${getRankBg(entry.rank)}`}
                      >
                        <div className="flex-shrink-0">
                          {getRankIcon(entry.rank)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground truncate">{entry.teamName}</p>
                            {entry.rank <= 3 && (
                              <Badge variant="secondary" className="text-xs">
                                Top {entry.rank}
                              </Badge>
                            )}
                          </div>
                          {entry.description && (
                            <p className="text-sm text-muted-foreground truncate mt-0.5">
                              {entry.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {entry.judgeCount} {entry.judgeCount === 1 ? 'judge' : 'judges'}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Progress value={entry.scorePercentage} className="w-16 h-1.5" />
                              <span>{entry.scorePercentage}%</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-2xl font-bold text-primary">{entry.totalScore}</p>
                          <p className="text-xs text-muted-foreground">
                            / {entry.maxPossibleScore}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detailed Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Rank</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Team</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">Score</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">%</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">Judges</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry) => (
                      <tr key={entry.submissionId} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            {getRankIcon(entry.rank)}
                          </div>
                        </td>
                        <td className="py-3 px-2 font-medium">{entry.teamName}</td>
                        <td className="py-3 px-2 text-right font-bold text-primary">
                          {entry.totalScore} / {entry.maxPossibleScore}
                        </td>
                        <td className="py-3 px-2 text-right">{entry.scorePercentage}%</td>
                        <td className="py-3 px-2 text-right">{entry.judgeCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
