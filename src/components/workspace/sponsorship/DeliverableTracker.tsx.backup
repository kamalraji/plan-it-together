import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckSquare, Clock, AlertTriangle, CheckCircle2, CircleDashed } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Deliverable {
  id: string;
  sponsor: string;
  item: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
}

const mockDeliverables: Deliverable[] = [
  { id: '1', sponsor: 'TechCorp Global', item: 'Logo on main stage backdrop', dueDate: '2026-01-10', status: 'completed' },
  { id: '2', sponsor: 'TechCorp Global', item: 'Booth space allocation', dueDate: '2026-01-08', status: 'in-progress' },
  { id: '3', sponsor: 'Innovation Labs', item: 'Speaking slot confirmation', dueDate: '2026-01-05', status: 'overdue' },
  { id: '4', sponsor: 'Innovation Labs', item: 'Social media mentions (5x)', dueDate: '2026-01-15', status: 'pending' },
  { id: '5', sponsor: 'Digital Solutions', item: 'Newsletter feature', dueDate: '2026-01-12', status: 'pending' },
  { id: '6', sponsor: 'Cloud Systems', item: 'Attendee list (post-event)', dueDate: '2026-01-20', status: 'pending' },
];

const statusConfig = {
  pending: { icon: CircleDashed, color: 'text-gray-500', bgColor: 'bg-gray-500/10', label: 'Pending' },
  'in-progress': { icon: Clock, color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'In Progress' },
  completed: { icon: CheckCircle2, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', label: 'Completed' },
  overdue: { icon: AlertTriangle, color: 'text-red-500', bgColor: 'bg-red-500/10', label: 'Overdue' },
};

export function DeliverableTracker() {
  const completedCount = mockDeliverables.filter(d => d.status === 'completed').length;
  const progress = (completedCount / mockDeliverables.length) * 100;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            Deliverable Tracker
          </CardTitle>
          <Badge variant="outline" className="text-sm">
            {completedCount}/{mockDeliverables.length}
          </Badge>
        </div>
        <div className="mt-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">{Math.round(progress)}% deliverables completed</p>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px] pr-4">
          <div className="space-y-2">
            {mockDeliverables.map((deliverable) => {
              const config = statusConfig[deliverable.status];
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
                      <p className="font-medium text-sm text-foreground truncate">{deliverable.item}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{deliverable.sponsor}</span>
                        <span>•</span>
                        <span>Due: {new Date(deliverable.dueDate).toLocaleDateString()}</span>
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
        <Button variant="outline" size="sm" className="w-full mt-3">
          View All Deliverables
        </Button>
      </CardContent>
    </Card>
  );
}
