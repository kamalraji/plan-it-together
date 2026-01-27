import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  FileJson, 
  Award,
  BarChart3,
  Users,
  Trophy,
  Loader2
} from 'lucide-react';
import {
  useLeaderboard,
  useWorkspaceScores,
  useWorkspaceJudges,
  useWorkspaceSubmissions,
  useWorkspaceRubrics,
} from '@/hooks/useJudgeCommitteeData';

interface ExportResultsTabProps {
  workspaceId: string;
}

type ExportFormat = 'csv' | 'json' | 'pdf';
type ReportType = 'rankings' | 'detailed' | 'judges' | 'certificates';

export function ExportResultsTab({ workspaceId }: ExportResultsTabProps) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [reportType, setReportType] = useState<ReportType>('rankings');
  const [includeComments, setIncludeComments] = useState(true);
  const [includePrivateNotes, setIncludePrivateNotes] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  const { data: leaderboard = [] } = useLeaderboard(workspaceId);
  const { data: scores = [] } = useWorkspaceScores(workspaceId);
  const { data: judges = [] } = useWorkspaceJudges(workspaceId);
  const { data: submissions = [] } = useWorkspaceSubmissions(workspaceId);
  const { data: rubrics = [] } = useWorkspaceRubrics(workspaceId);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      let data: string;
      let filename: string;
      let mimeType: string;

      // Filter leaderboard by status if needed
      const filteredLeaderboard = statusFilter === 'all' 
        ? leaderboard 
        : leaderboard.filter(e => e.status === statusFilter);

      switch (reportType) {
        case 'rankings':
          data = generateRankingsExport(filteredLeaderboard, exportFormat);
          filename = `rankings-${new Date().toISOString().split('T')[0]}`;
          break;
        case 'detailed':
          data = generateDetailedExport(filteredLeaderboard, scores, judges, exportFormat);
          filename = `detailed-scores-${new Date().toISOString().split('T')[0]}`;
          break;
        case 'judges':
          data = generateJudgesExport(judges, scores, exportFormat);
          filename = `judge-performance-${new Date().toISOString().split('T')[0]}`;
          break;
        case 'certificates':
          data = generateCertificatesExport(filteredLeaderboard.slice(0, 3), exportFormat);
          filename = `winners-${new Date().toISOString().split('T')[0]}`;
          break;
        default:
          data = '';
          filename = 'export';
      }

      switch (exportFormat) {
        case 'csv':
          mimeType = 'text/csv';
          filename += '.csv';
          break;
        case 'json':
          mimeType = 'application/json';
          filename += '.json';
          break;
        case 'pdf':
          // For PDF, we'll just generate CSV as a fallback
          mimeType = 'text/csv';
          filename += '.csv';
          break;
        default:
          mimeType = 'text/plain';
      }

      // Create and trigger download
      const blob = new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const generateRankingsExport = (data: typeof leaderboard, format: ExportFormat): string => {
    if (format === 'json') {
      return JSON.stringify(data.map((entry, idx) => ({
        rank: idx + 1,
        team_name: entry.team_name,
        project_name: entry.project_name,
        average_score: entry.average_score,
        judges_completed: `${entry.completed_judges}/${entry.total_judges}`,
        status: entry.status,
        track: entry.track || '',
      })), null, 2);
    }

    // CSV format
    const headers = ['Rank', 'Team Name', 'Project Name', 'Average Score', 'Judges', 'Status', 'Track'];
    const rows = data.map((entry, idx) => [
      idx + 1,
      `"${entry.team_name}"`,
      `"${entry.project_name}"`,
      entry.average_score,
      `${entry.completed_judges}/${entry.total_judges}`,
      entry.status,
      entry.track || '',
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  const generateDetailedExport = (
    leaderboardData: typeof leaderboard,
    scoresData: typeof scores,
    judgesData: typeof judges,
    format: ExportFormat
  ): string => {
    const detailedData = leaderboardData.map((entry, idx) => {
      const entryScores = scoresData.filter(s => s.submission_id === entry.submission_id);
      return {
        rank: idx + 1,
        team_name: entry.team_name,
        project_name: entry.project_name,
        average_score: entry.average_score,
        status: entry.status,
        track: entry.track || '',
        individual_scores: entryScores.map(score => ({
          judge: judgesData.find(j => j.id === score.judge_id)?.judge_name || 'Unknown',
          total_score: score.total_score,
          weighted_score: score.weighted_score,
          comments: includeComments ? score.comments : undefined,
          private_notes: includePrivateNotes ? score.private_notes : undefined,
        })),
      };
    });

    if (format === 'json') {
      return JSON.stringify(detailedData, null, 2);
    }

    // CSV format - flatten the data
    const headers = ['Rank', 'Team', 'Project', 'Avg Score', 'Status', 'Track', 'Judge', 'Score', 'Weighted'];
    if (includeComments) headers.push('Comments');

    const rows: string[][] = [];
    detailedData.forEach(entry => {
      entry.individual_scores.forEach((score, i) => {
        const row = [
          i === 0 ? String(entry.rank) : '',
          i === 0 ? `"${entry.team_name}"` : '',
          i === 0 ? `"${entry.project_name}"` : '',
          i === 0 ? String(entry.average_score) : '',
          i === 0 ? entry.status : '',
          i === 0 ? entry.track : '',
          `"${score.judge}"`,
          String(score.total_score || ''),
          String(score.weighted_score || ''),
        ];
        if (includeComments) row.push(`"${(score.comments || '').replace(/"/g, '""')}"`);
        rows.push(row);
      });
    });

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  const generateJudgesExport = (
    judgesData: typeof judges,
    scoresData: typeof scores,
    format: ExportFormat
  ): string => {
    const judgeStats = judgesData.map(judge => {
      const judgeScores = scoresData.filter(s => s.judge_id === judge.id);
      const totalScores = judgeScores.map(s => s.total_score).filter((s): s is number => s !== null);
      const avgScore = totalScores.length > 0 
        ? totalScores.reduce((a, b) => a + b, 0) / totalScores.length 
        : 0;

      return {
        name: judge.judge_name,
        email: judge.judge_email || '',
        category: judge.category,
        status: judge.status,
        expertise: judge.expertise || '',
        submissions_scored: judgeScores.length,
        average_score_given: Math.round(avgScore * 10) / 10,
      };
    });

    if (format === 'json') {
      return JSON.stringify(judgeStats, null, 2);
    }

    const headers = ['Name', 'Email', 'Category', 'Status', 'Expertise', 'Submissions Scored', 'Avg Score Given'];
    const rows = judgeStats.map(j => [
      `"${j.name}"`,
      j.email,
      j.category,
      j.status,
      `"${j.expertise}"`,
      j.submissions_scored,
      j.average_score_given,
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  const generateCertificatesExport = (winners: typeof leaderboard, format: ExportFormat): string => {
    const positions = ['1st Place', '2nd Place', '3rd Place'];
    const certificateData = winners.map((entry, idx) => ({
      position: positions[idx] || `${idx + 1}th Place`,
      team_name: entry.team_name,
      project_name: entry.project_name,
      score: entry.average_score,
      track: entry.track || 'Overall',
    }));

    if (format === 'json') {
      return JSON.stringify(certificateData, null, 2);
    }

    const headers = ['Position', 'Team Name', 'Project Name', 'Score', 'Track'];
    const rows = certificateData.map(c => [
      c.position,
      `"${c.team_name}"`,
      `"${c.project_name}"`,
      c.score,
      c.track,
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.length}</div>
            <p className="text-xs text-muted-foreground">total entries</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Judges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{judges.length}</div>
            <p className="text-xs text-muted-foreground">panel members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scores.length}</div>
            <p className="text-xs text-muted-foreground">submitted</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4" />
              Rubrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rubrics.length}</div>
            <p className="text-xs text-muted-foreground">configured</p>
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Report Type</CardTitle>
            <CardDescription>Select the type of report to generate</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="rankings" id="rankings" />
                  <div className="flex-1">
                    <Label htmlFor="rankings" className="font-medium cursor-pointer">
                      <Trophy className="h-4 w-4 inline mr-2" />
                      Final Rankings
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Summary of all submissions ranked by average score
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="detailed" id="detailed" />
                  <div className="flex-1">
                    <Label htmlFor="detailed" className="font-medium cursor-pointer">
                      <FileText className="h-4 w-4 inline mr-2" />
                      Detailed Scores
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Complete breakdown with individual judge scores
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="judges" id="judges" />
                  <div className="flex-1">
                    <Label htmlFor="judges" className="font-medium cursor-pointer">
                      <Users className="h-4 w-4 inline mr-2" />
                      Judge Performance
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Statistics on judge participation and scoring patterns
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="certificates" id="certificates" />
                  <div className="flex-1">
                    <Label htmlFor="certificates" className="font-medium cursor-pointer">
                      <Award className="h-4 w-4 inline mr-2" />
                      Winners List
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Top 3 winners for certificate generation
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export Settings</CardTitle>
            <CardDescription>Configure export format and options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Format Selection */}
            <div className="space-y-2">
              <Label>Export Format</Label>
              <div className="flex gap-2">
                <Button
                  variant={exportFormat === 'csv' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setExportFormat('csv')}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-1" />
                  CSV
                </Button>
                <Button
                  variant={exportFormat === 'json' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setExportFormat('json')}
                >
                  <FileJson className="h-4 w-4 mr-1" />
                  JSON
                </Button>
              </div>
            </div>

            <Separator />

            {/* Filter */}
            <div className="space-y-2">
              <Label>Filter by Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Submissions</SelectItem>
                  <SelectItem value="judged">Judged Only</SelectItem>
                  <SelectItem value="finalist">Finalists Only</SelectItem>
                  <SelectItem value="winner">Winners Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Options */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="comments"
                  checked={includeComments}
                  onCheckedChange={(checked) => setIncludeComments(checked as boolean)}
                />
                <Label htmlFor="comments" className="cursor-pointer">
                  Include judge comments
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="private"
                  checked={includePrivateNotes}
                  onCheckedChange={(checked) => setIncludePrivateNotes(checked as boolean)}
                />
                <Label htmlFor="private" className="cursor-pointer">
                  Include private notes
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Button */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Ready to Export</h3>
              <p className="text-sm text-muted-foreground">
                Export {reportType === 'rankings' ? 'rankings' : reportType === 'detailed' ? 'detailed scores' : reportType === 'judges' ? 'judge performance' : 'winners'} as {exportFormat.toUpperCase()}
              </p>
            </div>
            <Button 
              size="lg" 
              onClick={handleExport}
              disabled={isExporting || (leaderboard.length === 0 && reportType !== 'judges')}
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
