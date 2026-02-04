import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Award, ChevronRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  rank: number;
  teamName: string;
  projectTitle: string;
  totalScore: number;
  judgeCount: number;
  category: string;
}

interface LeaderboardPreviewProps {
  workspaceId?: string;
  eventId?: string;
}

export function LeaderboardPreview({ workspaceId, eventId }: LeaderboardPreviewProps) {
  // Fetch leaderboard data from real submissions and scores
  const { data: leaderboard = [], isLoading } = useQuery({
    queryKey: ['workspace-leaderboard', workspaceId, eventId],
    queryFn: async () => {
      // Get submissions with their scores
      const submissionsQuery = supabase
        .from('workspace_submissions')
        .select('id, team_name, project_name, track, status');
      
      if (workspaceId) submissionsQuery.eq('workspace_id', workspaceId);
      if (eventId) submissionsQuery.eq('event_id', eventId);
      
      const { data: submissions, error: submissionsError } = await submissionsQuery;
      if (submissionsError) throw submissionsError;
      
      if (!submissions || submissions.length === 0) return [];
      
      // Get scores for these submissions
      const submissionIds = submissions.map(s => s.id);
      const { data: scores, error: scoresError } = await supabase
        .from('workspace_scores')
        .select('submission_id, total_score, judge_id')
        .in('submission_id', submissionIds);
      
      if (scoresError) throw scoresError;
      
      // Aggregate scores per submission
      const scoreMap = new Map<string, { total: number; count: number }>();
      (scores || []).forEach(score => {
        const existing = scoreMap.get(score.submission_id) || { total: 0, count: 0 };
        scoreMap.set(score.submission_id, {
          total: existing.total + (Number(score.total_score) || 0),
          count: existing.count + 1,
        });
      });
      
      // Build leaderboard entries
      const entries: LeaderboardEntry[] = submissions
        .map(submission => {
          const scoreData = scoreMap.get(submission.id);
          const avgScore = scoreData && scoreData.count > 0 
            ? scoreData.total / scoreData.count 
            : 0;
          
          return {
            rank: 0, // Will be set after sorting
            teamName: submission.team_name || 'Unnamed Team',
            projectTitle: submission.project_name || 'Untitled Project',
            totalScore: Math.round(avgScore * 10) / 10,
            judgeCount: scoreData?.count || 0,
            category: submission.track || 'General',
          };
        })
        .filter(entry => entry.judgeCount > 0) // Only show entries with scores
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, 5); // Top 5
      
      // Assign ranks
      entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });
      
      return entries;
    },
    enabled: !!(workspaceId || eventId),
  });

  const isPublic = false; // Toggle for public/private leaderboard

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-muted-foreground" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/30';
      case 2:
        return 'bg-muted/50 border-border';
      case 3:
        return 'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30';
      default:
        return 'bg-muted/30 border-transparent';
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-primary" />
            Leaderboard Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (leaderboard.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-primary" />
            Leaderboard Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No scores recorded yet.</p>
            <p className="text-xs mt-1">The leaderboard will update as judges submit their scores.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-primary" />
          Leaderboard Preview
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="gap-1 text-xs">
            {isPublic ? (
              <>
                <Eye className="h-3 w-3" />
                Public
              </>
            ) : (
              <>
                <EyeOff className="h-3 w-3" />
                Private
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {leaderboard.map((entry) => (
          <div 
            key={entry.rank}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/50 cursor-pointer ${getRankBg(entry.rank)}`}
          >
            <div className="flex-shrink-0">
              {getRankIcon(entry.rank)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground truncate">{entry.teamName}</p>
                <Badge variant="outline" className="text-xs shrink-0">
                  {entry.category}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">{entry.projectTitle}</p>
            </div>

            <div className="text-right shrink-0">
              <p className="text-lg font-bold text-primary">{entry.totalScore}</p>
              <p className="text-xs text-muted-foreground">{entry.judgeCount} judge{entry.judgeCount !== 1 ? 's' : ''}</p>
            </div>
          </div>
        ))}

        <Button variant="ghost" className="w-full text-muted-foreground mt-2">
          View Full Leaderboard
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
