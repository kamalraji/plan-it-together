import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Megaphone, 
  Share2, 
  Handshake, 
  MessageSquare, 
  ArrowRight,
  Users,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Workspace } from '@/types';

interface CommitteeSummary {
  id: string;
  name: string;
  type: 'marketing' | 'social-media' | 'sponsorship' | 'communication';
  icon: React.ElementType;
  color: string;
  bgColor: string;
  tasksDone: number;
  tasksTotal: number;
  members: number;
  highlight: string;
}

interface GrowthCommitteeOverviewProps {
  committees: Workspace[];
  onCommitteeClick?: (committee: Workspace) => void;
}

export function GrowthCommitteeOverview({ committees, onCommitteeClick }: GrowthCommitteeOverviewProps) {
  // Mock data for committee summaries - would be fetched from DB
  const committeeSummaries: CommitteeSummary[] = [
    {
      id: 'marketing',
      name: 'Marketing',
      type: 'marketing',
      icon: Megaphone,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      tasksDone: 18,
      tasksTotal: 24,
      members: 6,
      highlight: '3 campaigns active',
    },
    {
      id: 'social-media',
      name: 'Social Media',
      type: 'social-media',
      icon: Share2,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
      tasksDone: 32,
      tasksTotal: 40,
      members: 4,
      highlight: '24.5K followers gained',
    },
    {
      id: 'sponsorship',
      name: 'Sponsorship',
      type: 'sponsorship',
      icon: Handshake,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      tasksDone: 12,
      tasksTotal: 18,
      members: 5,
      highlight: '8 sponsors confirmed',
    },
    {
      id: 'communication',
      name: 'Communication',
      type: 'communication',
      icon: MessageSquare,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      tasksDone: 15,
      tasksTotal: 20,
      members: 4,
      highlight: '5 announcements pending',
    },
  ];

  // Match committee summaries to actual committees
  const getCommitteeData = (summary: CommitteeSummary) => {
    const matchedCommittee = committees.find(c => 
      c.name.toLowerCase().includes(summary.type.replace('-', ' ')) ||
      c.name.toLowerCase().includes(summary.name.toLowerCase())
    );
    return matchedCommittee;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Committee Overview
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {committees.length} committees
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {committeeSummaries.map((summary) => {
          const committee = getCommitteeData(summary);
          const progress = (summary.tasksDone / summary.tasksTotal) * 100;
          
          return (
            <div
              key={summary.id}
              className="p-4 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={() => committee && onCommitteeClick?.(committee)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${summary.bgColor}`}>
                    <summary.icon className={`h-5 w-5 ${summary.color}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">{summary.name}</h4>
                      {committee ? (
                        <Badge variant="secondary" className="text-xs">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Not Created</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {summary.highlight}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-4 mb-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span>{summary.members} members</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>{summary.tasksDone} done</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{summary.tasksTotal - summary.tasksDone} pending</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Progress value={progress} className="h-1.5 flex-1" />
                <span className="text-xs font-medium text-muted-foreground">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
