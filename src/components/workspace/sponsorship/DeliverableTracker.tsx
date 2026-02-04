import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckSquare, Clock, AlertTriangle, CheckCircle2, CircleDashed, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSponsorDeliverables, useDeliverableStats } from '@/hooks/useSponsorDeliverables';

interface DeliverableTrackerProps {
  workspaceId: string;
}

const statusConfig = {
  pending: { icon: CircleDashed, color: 'text-muted-foreground', bgColor: 'bg-muted/50', label: 'Pending' },
  in_progress: { icon: Clock, color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'In Progress' },
  completed: { icon: CheckCircle2, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', label: 'Completed' },
  overdue: { icon: AlertTriangle, color: 'text-red-500', bgColor: 'bg-red-500/10', label: 'Overdue' },
};

export function DeliverableTracker({ workspaceId }: DeliverableTrackerProps) {
  const { data: deliverables = [], isLoading } = useSponsorDeliverables(workspaceId);
  const { stats } = useDeliverableStats(workspaceId);

  const progress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  // Mark overdue items
  const now = new Date();
  const deliverablesWithOverdue = deliverables.map(d => {
    if (d.status === 'completed') return d;
    if (d.dueDate && new Date(d.dueDate) < now) {
      return { ...d, status: 'overdue' as const };
    }
    return d;
  });

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            Deliverable Tracker
          </CardTitle>
          <Badge variant="outline" className="text-sm">
            {stats.completed}/{stats.total}
          </Badge>
        </div>
        <div className="mt-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">{Math.round(progress)}% deliverables completed</p>
        </div>
      </CardHeader>
      <CardContent>
        {deliverablesWithOverdue.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No deliverables tracked yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[280px] pr-4">
            <div className="space-y-2">
              {deliverablesWithOverdue.map((deliverable) => {
                const config = statusConfig[deliverable.status] || statusConfig.pending;
                const StatusIcon = config.icon;
                
                return (
                  <div
                    key={deliverable.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`p-1.5 rounded-md ${config.bgColor} mt-0.5`}>
                        <StatusIcon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{deliverable.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>{deliverable.sponsorName}</span>
                          {deliverable.dueDate && (
                            <>
                              <span>•</span>
                              <span>Due: {new Date(deliverable.dueDate).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-xs ${config.bgColor} ${config.color} border-0`}>
                      {config.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
        <Button variant="outline" size="sm" className="w-full mt-3">
          View All Deliverables
        </Button>
      </CardContent>
    </Card>
  );
}
