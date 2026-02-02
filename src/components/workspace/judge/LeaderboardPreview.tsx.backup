import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Award, ChevronRight, Eye, EyeOff } from 'lucide-react';

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
}

export function LeaderboardPreview(_props: LeaderboardPreviewProps) {
  // Mock data - in production, fetch from database
  const leaderboard: LeaderboardEntry[] = [
    {
      rank: 1,
      teamName: 'CodeCrafters',
      projectTitle: 'AI Healthcare Assistant',
      totalScore: 92.5,
      judgeCount: 4,
      category: 'Healthcare',
    },
    {
      rank: 2,
      teamName: 'TechTitans',
      projectTitle: 'Smart Traffic System',
      totalScore: 89.0,
      judgeCount: 4,
      category: 'Smart Cities',
    },
    {
      rank: 3,
      teamName: 'DataWizards',
      projectTitle: 'Climate Predictor',
      totalScore: 87.5,
      judgeCount: 3,
      category: 'Environment',
    },
    {
      rank: 4,
      teamName: 'InnovatorsHub',
      projectTitle: 'Blockchain Supply',
      totalScore: 85.0,
      judgeCount: 4,
      category: 'FinTech',
    },
    {
      rank: 5,
      teamName: 'ByteBuilders',
      projectTitle: 'EdTech Platform',
      totalScore: 82.5,
      judgeCount: 3,
      category: 'Education',
    },
  ];

  const isPublic = false; // Toggle for public/private leaderboard

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-50 border-yellow-200';
      case 2:
        return 'bg-gray-50 border-gray-200';
      case 3:
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-muted/30 border-transparent';
    }
  };

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
              <p className="text-xs text-muted-foreground">{entry.judgeCount} judges</p>
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
