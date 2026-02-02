import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Megaphone, 
  Share2, 
  Handshake, 
  MessageSquare, 
  ArrowRight,
  Users,
  CheckCircle2,
  Clock,
  LayoutGrid,
  RefreshCw
} from 'lucide-react';
import { Workspace } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface GrowthCommitteeOverviewProps {
  committees: Workspace[];
  onCommitteeClick?: (committee: Workspace) => void;
}

interface CommitteeSummaryData {
  id: string;
  name: string;
  type: 'marketing' | 'social-media' | 'sponsorship' | 'communication' | 'other';
  tasksDone: number;
  tasksTotal: number;
  members: number;
  highlight: string;
}

const typeConfig = {
  marketing: { icon: Megaphone, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  'social-media': { icon: Share2, color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
  sponsorship: { icon: Handshake, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  communication: { icon: MessageSquare, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  other: { icon: LayoutGrid, color: 'text-violet-500', bgColor: 'bg-violet-500/10' },
};

function getCommitteeType(name: string): CommitteeSummaryData['type'] {
  const nameLower = name.toLowerCase();
  if (nameLower.includes('marketing')) return 'marketing';
  if (nameLower.includes('social') || nameLower.includes('media')) return 'social-media';
  if (nameLower.includes('sponsor')) return 'sponsorship';
  if (nameLower.includes('communication') || nameLower.includes('comms')) return 'communication';
  return 'other';
}

export function GrowthCommitteeOverview({ committees, onCommitteeClick }: GrowthCommitteeOverviewProps) {
  const committeeIds = committees.map(c => c.id);

  const { data: committeeSummaries = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['growth-committee-stats', committeeIds.join(',')],
    queryFn: async (): Promise<CommitteeSummaryData[]> => {
      if (!committees.length) return [];

      const summaries: CommitteeSummaryData[] = [];

      for (const committee of committees) {
        // Get task counts
        const { data: tasks } = await supabase
          .from('workspace_tasks')
          .select('id, status')
          .eq('workspace_id', committee.id);

        const tasksTotal = tasks?.length || 0;
        const tasksDone = tasks?.filter(t => t.status === 'completed' || t.status === 'done').length || 0;

        // Get member count
        const { count: memberCount } = await supabase
          .from('workspace_team_members')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', committee.id);

        const type = getCommitteeType(committee.name);
        let highlight = `${tasksDone}/${tasksTotal} tasks done`;

        if (type === 'marketing') {
          const pendingTasks = tasksTotal - tasksDone;
          highlight = pendingTasks > 0 ? `${pendingTasks} campaigns pending` : 'All campaigns complete';
        } else if (type === 'social-media') {
          highlight = `${memberCount || 0} content creators`;
        } else if (type === 'sponsorship') {
          highlight = `${tasksDone} sponsors confirmed`;
        } else if (type === 'communication') {
          const pendingTasks = tasksTotal - tasksDone;
          highlight = pendingTasks > 0 ? `${pendingTasks} announcements pending` : 'All sent';
        }

        summaries.push({
          id: committee.id,
          name: committee.name,
          type,
          tasksDone,
          tasksTotal,
          members: memberCount || 0,
          highlight,
        });
      }

      return summaries;
    },
    enabled: committees.length > 0,
  });

  // Match summaries to actual committees for click handling
  const getCommittee = (summary: CommitteeSummaryData) => {
    return committees.find(c => c.id === summary.id);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Committee Overview
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Committee Overview
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
            <Badge variant="outline" className="text-xs">
              {committees.length} committees
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {committeeSummaries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No committees created yet</p>
            <p className="text-sm">Create sub-workspaces to see committee stats</p>
          </div>
        ) : (
          committeeSummaries.map((summary) => {
            const committee = getCommittee(summary);
            const config = typeConfig[summary.type];
            const Icon = config.icon;
            const progress = summary.tasksTotal > 0 ? (summary.tasksDone / summary.tasksTotal) * 100 : 0;
            
            return (
              <div
                key={summary.id}
                className="p-4 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => committee && onCommitteeClick?.(committee)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${config.bgColor}`}>
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm">{summary.name}</h4>
                        <Badge variant="secondary" className="text-xs">Active</Badge>
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
          })
        )}
      </CardContent>
    </Card>
  );
}
