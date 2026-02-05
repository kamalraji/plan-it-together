import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ChevronRight,
  Calendar,
  Loader2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DeliverableTrackerProps {
  workspaceId?: string;
}

interface MediaDeliverable {
  id: string;
  name: string;
  description: string | null;
  due_date: string | null;
  status: 'completed' | 'in_progress' | 'pending' | 'overdue';
  progress: number;
  assignee_name: string | null;
}

export function DeliverableTracker({ workspaceId }: DeliverableTrackerProps) {
  // Query workspace tasks as deliverables for media workspace
  const { data: deliverables = [], isLoading } = useQuery({
    queryKey: ['media-deliverables', workspaceId],
    queryFn: async (): Promise<MediaDeliverable[]> => {
      if (!workspaceId) return [];
      
      // Fetch tasks that are tagged as deliverables or have specific labels
      const { data, error } = await supabase
        .from('workspace_tasks')
        .select('id, title, description, due_date, status, assigned_to')
        .eq('workspace_id', workspaceId)
        .order('due_date', { ascending: true })
        .limit(10);
      
      if (error) throw error;
      
      // Map task status to deliverable status
      return (data || []).map(task => {
        let status: 'completed' | 'in_progress' | 'pending' | 'overdue' = 'pending';
        let progress = 0;
        
        const taskStatus = (task.status || '').toLowerCase();
        if (['done', 'completed'].includes(taskStatus)) {
          status = 'completed';
          progress = 100;
        } else if (['in_progress', 'in progress'].includes(taskStatus)) {
          status = 'in_progress';
          progress = 50;
        } else if (task.due_date && new Date(task.due_date) < new Date()) {
          status = 'overdue';
          progress = 25;
        }
        
        return {
          id: task.id,
          name: task.title,
          description: task.description,
          due_date: task.due_date,
          status,
          progress,
          assignee_name: null, // Would need to join with profiles
        };
      });
    },
    enabled: !!workspaceId,
  });

  const getStatusConfig = (status: MediaDeliverable['status']) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle, color: 'bg-success/20 text-success', label: 'Completed' };
      case 'in_progress':
        return { icon: Clock, color: 'bg-info/20 text-blue-800', label: 'In Progress' };
      case 'pending':
        return { icon: Clock, color: 'bg-muted text-foreground', label: 'Pending' };
      case 'overdue':
        return { icon: AlertCircle, color: 'bg-destructive/20 text-red-800', label: 'Overdue' };
    }
  };

  const completedCount = deliverables.filter(d => d.status === 'completed').length;
  const totalProgress = deliverables.length > 0 
    ? Math.round(deliverables.reduce((sum, d) => sum + d.progress, 0) / deliverables.length)
    : 0;

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-center h-[300px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="h-5 w-5 text-primary" />
          Deliverables
        </CardTitle>
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          {completedCount}/{deliverables.length} Complete
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{totalProgress}%</span>
          </div>
          <Progress value={totalProgress} className="h-2" />
        </div>

        {/* Deliverable List */}
        {deliverables.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No deliverables found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deliverables.map((deliverable) => {
              const statusConfig = getStatusConfig(deliverable.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div 
                  key={deliverable.id}
                  className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{deliverable.name}</p>
                      {deliverable.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{deliverable.description}</p>
                      )}
                    </div>
                    <Badge className={statusConfig.color} variant="secondary">
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <Progress value={deliverable.progress} className="h-1.5" />
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{deliverable.assignee_name || 'Unassigned'}</span>
                    {deliverable.due_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due: {new Date(deliverable.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Button variant="ghost" className="w-full text-muted-foreground">
          View All Deliverables
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
