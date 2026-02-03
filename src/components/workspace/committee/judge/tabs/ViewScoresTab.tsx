import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Trophy, 
  Star, 
  Search, 
  ChevronDown, 
  ChevronUp,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Medal,
  TrendingUp
} from 'lucide-react';
import {
  useLeaderboard,
  useWorkspaceScores,
  useWorkspaceJudges,
  useJudgingProgress,
} from '@/hooks/useJudgeCommitteeData';

interface ViewScoresTabProps {
  workspaceId: string;
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4 text-yellow-500" />,
  in_progress: <TrendingUp className="h-4 w-4 text-blue-500" />,
  judged: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  finalist: <Star className="h-4 w-4 text-amber-500" />,
  winner: <Trophy className="h-4 w-4 text-yellow-500" />,
};

const MEDAL_COLORS = ['text-yellow-500', 'text-muted-foreground', 'text-amber-600'];

export function ViewScoresTab({ workspaceId }: ViewScoresTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [trackFilter, setTrackFilter] = useState<string>('all');
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);

  const { data: leaderboard = [], isLoading } = useLeaderboard(workspaceId);
  const { data: scores = [] } = useWorkspaceScores(workspaceId);
  const { data: judges = [] } = useWorkspaceJudges(workspaceId);
  const { data: progress } = useJudgingProgress(workspaceId);

  // Get unique tracks
  const tracks = [...new Set(leaderboard.map(e => e.track).filter(Boolean))];

  // Filter leaderboard
  const filteredLeaderboard = leaderboard.filter(entry => {
    const matchesSearch = 
      entry.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.project_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    const matchesTrack = trackFilter === 'all' || entry.track === trackFilter;
    
    return matchesSearch && matchesStatus && matchesTrack;
  });

  const getSubmissionScores = (submissionId: string) => {
    return scores.filter(s => s.submission_id === submissionId);
  };

  const getJudgeName = (judgeId: string) => {
    const judge = judges.find(j => j.id === judgeId);
    return judge?.judge_name || 'Unknown Judge';
  };

  const hasScoreDiscrepancy = (submissionScores: typeof scores) => {
    if (submissionScores.length < 2) return false;
    const totalScores = submissionScores
      .map(s => s.total_score)
      .filter((s): s is number => s !== null);
    if (totalScores.length < 2) return false;
    const max = Math.max(...totalScores);
    const min = Math.min(...totalScores);
    return max - min > 20; // Flag if scores differ by more than 20 points
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Judging Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress?.percentComplete || 0}%</div>
            <Progress value={progress?.percentComplete || 0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {progress?.completedAssignments || 0} of {progress?.totalAssignments || 0} assignments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Submissions Judged</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progress?.judgedSubmissions || 0}/{progress?.totalSubmissions || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {progress?.totalSubmissions && progress?.judgedSubmissions
                ? Math.round((progress.judgedSubmissions / progress.totalSubmissions) * 100)
                : 0}% complete
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Judges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progress?.activeJudges || 0}/{progress?.totalJudges || 0}
            </div>
            <p className="text-xs text-muted-foreground">judges scoring</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress?.averageScore || 0}</div>
            <p className="text-xs text-muted-foreground">across all scores</p>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Leaderboard
              </CardTitle>
              <CardDescription>
                Rankings based on average judge scores
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search teams..."
                  className="pl-8 w-[200px]"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="judged">Judged</SelectItem>
                  <SelectItem value="finalist">Finalist</SelectItem>
                  <SelectItem value="winner">Winner</SelectItem>
                </SelectContent>
              </Select>
              {tracks.length > 0 && (
                <Select value={trackFilter} onValueChange={setTrackFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Track" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tracks</SelectItem>
                    {tracks.map(track => (
                      <SelectItem key={track} value={track!}>
                        {track}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading scores...</div>
          ) : filteredLeaderboard.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Trophy className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-2">No scores recorded yet</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-2">
                {filteredLeaderboard.map((entry, index) => {
                  const submissionScores = getSubmissionScores(entry.submission_id);
                  const isExpanded = expandedSubmission === entry.submission_id;
                  const hasDiscrepancy = hasScoreDiscrepancy(submissionScores);

                  return (
                    <Collapsible
                      key={entry.submission_id}
                      open={isExpanded}
                      onOpenChange={() => setExpandedSubmission(isExpanded ? null : entry.submission_id)}
                    >
                      <Card className={index < 3 ? 'border-2 border-primary/20' : ''}>
                        <CollapsibleTrigger asChild>
                          <div className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-4">
                              {/* Rank */}
                              <div className="w-12 text-center">
                                {index < 3 ? (
                                  <Medal className={`h-6 w-6 mx-auto ${MEDAL_COLORS[index]}`} />
                                ) : (
                                  <span className="text-lg font-bold text-muted-foreground">
                                    #{index + 1}
                                  </span>
                                )}
                              </div>

                              {/* Project Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold truncate">
                                    {entry.project_name}
                                  </span>
                                  {hasDiscrepancy && (
                                    <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                  <Users className="h-3 w-3" />
                                  {entry.team_name}
                                  {entry.track && (
                                    <Badge variant="outline" className="text-xs">
                                      {entry.track}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Score */}
                              <div className="text-right">
                                <div className="text-2xl font-bold">
                                  {entry.average_score}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  avg score
                                </div>
                              </div>

                              {/* Judge Progress */}
                              <div className="w-24 text-center">
                                <div className="text-sm font-medium">
                                  {entry.completed_judges}/{entry.total_judges}
                                </div>
                                <Progress 
                                  value={(entry.completed_judges / entry.total_judges) * 100} 
                                  className="h-1 mt-1"
                                />
                                <div className="text-xs text-muted-foreground">judges</div>
                              </div>

                              {/* Status */}
                              <div className="flex items-center gap-2">
                                {STATUS_ICONS[entry.status] || STATUS_ICONS.pending}
                                <Badge variant="secondary" className="capitalize">
                                  {entry.status}
                                </Badge>
                              </div>

                              {/* Expand */}
                              <div>
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </div>
                            </div>
                          </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="px-4 pb-4 pt-2 border-t">
                            <h4 className="text-sm font-medium mb-3">Individual Judge Scores</h4>
                            {submissionScores.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No scores submitted yet</p>
                            ) : (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Judge</TableHead>
                                    <TableHead>Total Score</TableHead>
                                    <TableHead>Weighted</TableHead>
                                    <TableHead>Comments</TableHead>
                                    <TableHead>Scored At</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {submissionScores.map(score => (
                                    <TableRow key={score.id}>
                                      <TableCell className="font-medium">
                                        {getJudgeName(score.judge_id)}
                                      </TableCell>
                                      <TableCell>
                                        <span className="text-lg font-semibold">
                                          {score.total_score || '-'}
                                        </span>
                                      </TableCell>
                                      <TableCell>
                                        {score.weighted_score || '-'}
                                      </TableCell>
                                      <TableCell>
                                        {score.comments ? (
                                          <span className="text-sm truncate block max-w-[200px]" title={score.comments}>
                                            {score.comments}
                                          </span>
                                        ) : (
                                          <span className="text-muted-foreground">-</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-muted-foreground">
                                        {new Date(score.scored_at).toLocaleDateString()}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}

                            {hasDiscrepancy && (
                              <div className="mt-3 p-3 bg-amber-500/10 rounded-lg flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                                <div className="text-sm">
                                  <span className="font-medium text-amber-500">Score Discrepancy Detected</span>
                                  <p className="text-muted-foreground">
                                    Judge scores differ by more than 20 points. Consider reviewing or adding another judge.
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
