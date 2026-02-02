import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarDays, 
  Truck, 
  UtensilsCrossed, 
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface OperationsOverviewProps {
  workspaceId: string;
}

interface CommitteeStatus {
  name: string;
  type: 'event' | 'logistics' | 'catering' | 'facility' | 'other';
  tasksTotal: number;
  tasksCompleted: number;
  tasksCritical: number;
  status: 'on-track' | 'at-risk' | 'delayed';
}

export function OperationsOverview({ workspaceId }: OperationsOverviewProps) {
  // Fetch child committees with their tasks
  const { data: committeeStatuses = [], isLoading } = useQuery({
    queryKey: ['ops-overview', workspaceId],
    queryFn: async () => {
      // Get committees
      const { data: committees, error: commError } = await supabase
        .from('workspaces')
        .select('id, name')
        .eq('parent_workspace_id', workspaceId)
        .eq('workspace_type', 'COMMITTEE');
      
      if (commError) throw commError;
      if (!committees || committees.length === 0) return [];

      // Get tasks for all committees
      const { data: tasks, error: tasksError } = await supabase
        .from('workspace_tasks')
        .select('id, status, priority, workspace_id, due_date')
        .in('workspace_id', committees.map(c => c.id));
      
      if (tasksError) throw tasksError;

      // Build status for each committee
      const statuses: CommitteeStatus[] = committees.map(committee => {
        const committeeTasks = tasks?.filter(t => t.workspace_id === committee.id) || [];
        const completed = committeeTasks.filter(t => t.status === 'DONE').length;
        const critical = committeeTasks.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH').length;
        const overdue = committeeTasks.filter(t => {
          if (!t.due_date) return false;
          return new Date(t.due_date) < new Date() && t.status !== 'DONE';
        }).length;

        const lower = committee.name.toLowerCase();
        let type: CommitteeStatus['type'] = 'other';
        if (lower.includes('event') || lower.includes('day-of')) type = 'event';
        else if (lower.includes('logistics') || lower.includes('transport')) type = 'logistics';
        else if (lower.includes('catering') || lower.includes('food')) type = 'catering';
        else if (lower.includes('facility') || lower.includes('venue')) type = 'facility';

        let status: CommitteeStatus['status'] = 'on-track';
        if (overdue > 2) status = 'delayed';
        else if (overdue > 0 || critical > 3) status = 'at-risk';

        return {
          name: committee.name,
          type,
          tasksTotal: committeeTasks.length,
          tasksCompleted: completed,
          tasksCritical: critical,
          status,
        };
      });

      return statuses;
    },
  });

  const getTypeIcon = (type: CommitteeStatus['type']) => {
    switch (type) {
      case 'event': return CalendarDays;
      case 'logistics': return Truck;
      case 'catering': return UtensilsCrossed;
      case 'facility': return Building2;
      default: return Clock;
    }
  };

  const getTypeColor = (type: CommitteeStatus['type']) => {
    switch (type) {
      case 'event': return 'text-blue-500 bg-blue-500/10';
      case 'logistics': return 'text-green-500 bg-green-500/10';
      case 'catering': return 'text-amber-500 bg-amber-500/10';
      case 'facility': return 'text-purple-500 bg-purple-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getStatusBadge = (status: CommitteeStatus['status']) => {
    switch (status) {
      case 'on-track':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            On Track
          </Badge>
        );
      case 'at-risk':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            <Clock className="h-3 w-3 mr-1" />
            At Risk
          </Badge>
        );
      case 'delayed':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Delayed
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Operations Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (committeeStatuses.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Operations Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Create operations committees (Event, Logistics, Catering, Facility) to see the overview here.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Summary stats
  const totalTasks = committeeStatuses.reduce((sum, c) => sum + c.tasksTotal, 0);
  const completedTasks = committeeStatuses.reduce((sum, c) => sum + c.tasksCompleted, 0);
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const atRiskCount = committeeStatuses.filter(c => c.status !== 'on-track').length;

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Operations Overview</CardTitle>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Overall Progress</p>
              <p className="text-lg font-bold text-foreground">{overallProgress}%</p>
            </div>
            {atRiskCount > 0 && (
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                {atRiskCount} at risk
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {committeeStatuses.map((committee) => {
          const Icon = getTypeIcon(committee.type);
          const colorClasses = getTypeColor(committee.type);
          const progress = committee.tasksTotal > 0 
            ? Math.round((committee.tasksCompleted / committee.tasksTotal) * 100) 
            : 0;

          return (
            <div
              key={committee.name}
              className="p-4 rounded-lg border border-border bg-card/50"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${colorClasses.split(' ')[1]}`}>
                    <Icon className={`h-4 w-4 ${colorClasses.split(' ')[0]}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{committee.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {committee.tasksCompleted} of {committee.tasksTotal} tasks complete
                    </p>
                  </div>
                </div>
                {getStatusBadge(committee.status)}
              </div>
              <div className="flex items-center gap-3">
                <Progress value={progress} className="h-2 flex-1" />
                <span className="text-sm font-medium text-muted-foreground w-12 text-right">
                  {progress}%
                </span>
              </div>
              {committee.tasksCritical > 0 && (
                <p className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {committee.tasksCritical} critical task{committee.tasksCritical > 1 ? 's' : ''} pending
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
