import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Workspace } from '@/types';
import { 
  FileText, 
  Gavel, 
  Camera, 
  Mic2, 
  ChevronRight,
  Users,
  Loader2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ContentCommitteeHubProps {
  workspaceId?: string;
  committees?: Workspace[];
  onCommitteeClick?: (committee: Workspace) => void;
}

interface CommitteeStatus {
  id: string;
  name: string;
  type: 'content' | 'judge' | 'media' | 'speaker';
  progress: number;
  tasksDone: number;
  tasksTotal: number;
  members: number;
  status: 'on-track' | 'at-risk' | 'behind';
}

const COMMITTEE_CONFIG = {
  content: {
    icon: FileText,
    color: 'text-info',
    bgColor: 'bg-info/10',
    borderColor: 'border-info/20',
  },
  judge: {
    icon: Gavel,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/20',
  },
  media: {
    icon: Camera,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-purple-500/20',
  },
  speaker: {
    icon: Mic2,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
  },
};

// Helper to detect committee type from name
function detectCommitteeType(name: string): 'content' | 'judge' | 'media' | 'speaker' {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('judge') || lowerName.includes('judging')) return 'judge';
  if (lowerName.includes('media') || lowerName.includes('photo') || lowerName.includes('video')) return 'media';
  if (lowerName.includes('speaker') || lowerName.includes('liaison')) return 'speaker';
  return 'content';
}

export function ContentCommitteeHub({ workspaceId, committees: propCommittees = [], onCommitteeClick }: ContentCommitteeHubProps) {
  // Fetch child workspaces (committees) if workspaceId provided
  const { data: fetchedCommittees, isLoading } = useQuery({
    queryKey: ['content-committee-hub', workspaceId],
    queryFn: async (): Promise<CommitteeStatus[]> => {
      if (!workspaceId) return [];

      // Fetch child workspaces
      const { data: childWorkspaces } = await supabase
        .from('workspaces')
        .select('id, name')
        .eq('parent_id', workspaceId);

      if (!childWorkspaces || childWorkspaces.length === 0) return [];

      // For each child workspace, get task and member counts
      const committeeStats = await Promise.all(
        childWorkspaces.map(async (ws) => {
          const [tasksResult, membersResult] = await Promise.all([
            supabase
              .from('workspace_tasks')
              .select('id, status')
              .eq('workspace_id', ws.id),
            supabase
              .from('workspace_team_members')
              .select('id')
              .eq('workspace_id', ws.id),
          ]);

          const tasks = tasksResult.data || [];
          const completedTasks = tasks.filter(t => 
            ['completed', 'done', 'COMPLETED'].includes(t.status || '')
          ).length;
          const totalTasks = tasks.length;
          const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

          // Determine status based on progress
          let status: 'on-track' | 'at-risk' | 'behind' = 'on-track';
          if (progress < 50) status = 'behind';
          else if (progress < 75) status = 'at-risk';

          return {
            id: ws.id,
            name: ws.name,
            type: detectCommitteeType(ws.name),
            progress,
            tasksDone: completedTasks,
            tasksTotal: totalTasks,
            members: membersResult.data?.length || 0,
            status,
          };
        })
      );

      return committeeStats;
    },
    enabled: !!workspaceId,
  });

  // Use prop committees if no workspaceId, otherwise use fetched data
  const committees: CommitteeStatus[] = workspaceId 
    ? (fetchedCommittees || [])
    : propCommittees.map(c => ({
        id: c.id,
        name: c.name,
        type: detectCommitteeType(c.name),
        progress: 0,
        tasksDone: 0,
        tasksTotal: 0,
        members: c.teamMembers?.length || 0,
        status: 'on-track' as const,
      }));

  const getStatusBadge = (status: CommitteeStatus['status']) => {
    const config = {
      'on-track': { label: 'On Track', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
      'at-risk': { label: 'At Risk', className: 'bg-warning/10 text-warning border-warning/20' },
      'behind': { label: 'Behind', className: 'bg-destructive/10 text-destructive border-destructive/20' },
    };
    return config[status];
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center h-[300px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          Committee Progress Hub
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {committees.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No sub-committees found</p>
          </div>
        ) : (
          committees.map((committee) => {
            const config = COMMITTEE_CONFIG[committee.type];
            const statusBadge = getStatusBadge(committee.status);
            const Icon = config.icon;

            return (
              <div
                key={committee.id}
                className={`p-4 rounded-lg border ${config.borderColor} bg-card/50 hover:bg-accent/50 transition-colors cursor-pointer group`}
                onClick={() => onCommitteeClick?.({ id: committee.id, name: committee.name } as Workspace)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.bgColor}`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-foreground">{committee.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{committee.members} members</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={statusBadge.className}>
                      {statusBadge.label}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Task Progress</span>
                    <span className="font-medium text-foreground">
                      {committee.tasksDone}/{committee.tasksTotal} ({committee.progress}%)
                    </span>
                  </div>
                  <Progress value={committee.progress} className="h-1.5" />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
