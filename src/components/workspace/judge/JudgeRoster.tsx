import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Plus, Mail, RefreshCw } from 'lucide-react';
import { useWorkspaceJudges } from '@/hooks/useJudgeCommitteeData';

interface JudgeRosterProps {
  workspaceId?: string;
}

export function JudgeRoster({ workspaceId }: JudgeRosterProps) {
  const { data: judges = [], isLoading, refetch, isFetching } = useWorkspaceJudges(workspaceId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'inactive':
        return 'bg-muted text-foreground';
      case 'on_break':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'invited':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatExpertise = (expertise: string | null): string[] => {
    if (!expertise) return [];
    return expertise.split(',').map(e => e.trim()).filter(Boolean);
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Judge Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 rounded-lg bg-muted/30 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-primary" />
          Judge Panel
        </CardTitle>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-1 rounded hover:bg-accent transition-colors"
            title="Refresh judges"
          >
            <RefreshCw className={`h-4 w-4 text-muted-foreground ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <Button size="sm" variant="outline" className="gap-1">
            <Plus className="h-4 w-4" />
            Add Judge
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {judges.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No judges added yet</p>
            <p className="text-sm">Add judges to your panel to start evaluating submissions</p>
          </div>
        ) : (
          judges.map((judge) => {
            const progressPercent = judge.assigned_count > 0 
              ? (judge.completed_count / judge.assigned_count) * 100 
              : 0;
            const expertiseList = formatExpertise(judge.expertise);

            return (
              <div key={judge.id} className="p-3 rounded-lg bg-muted/30 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(judge.judge_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{judge.judge_name}</p>
                      {judge.judge_email && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {judge.judge_email}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge className={getStatusColor(judge.status)} variant="secondary">
                    {judge.status.replace('_', ' ')}
                  </Badge>
                </div>

                {expertiseList.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {expertiseList.map((exp) => (
                      <Badge key={exp} variant="outline" className="text-xs">
                        {exp}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Evaluation Progress</span>
                    <span className="font-medium">
                      {judge.completed_count}/{judge.assigned_count}
                    </span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
