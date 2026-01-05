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
  Calendar
} from 'lucide-react';

interface Deliverable {
  id: string;
  name: string;
  description: string;
  dueDate: string;
  status: 'completed' | 'in_progress' | 'pending' | 'overdue';
  progress: number;
  assignee: string;
}

export function DeliverableTracker() {
  const deliverables: Deliverable[] = [
    {
      id: '1',
      name: 'Event Highlights Video',
      description: '3-5 min recap video for social media',
      dueDate: '2024-01-20',
      status: 'in_progress',
      progress: 65,
      assignee: 'Priya N.',
    },
    {
      id: '2',
      name: 'Press Photos Package',
      description: '50 edited high-res photos for media outlets',
      dueDate: '2024-01-18',
      status: 'completed',
      progress: 100,
      assignee: 'Arjun M.',
    },
    {
      id: '3',
      name: 'Social Media Assets',
      description: 'Story-ready photos and short clips',
      dueDate: '2024-01-17',
      status: 'in_progress',
      progress: 40,
      assignee: 'Sneha P.',
    },
    {
      id: '4',
      name: 'Drone Footage Package',
      description: 'Aerial shots for promotional use',
      dueDate: '2024-01-19',
      status: 'pending',
      progress: 0,
      assignee: 'Rahul S.',
    },
  ];

  const getStatusConfig = (status: Deliverable['status']) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Completed' };
      case 'in_progress':
        return { icon: Clock, color: 'bg-blue-100 text-blue-800', label: 'In Progress' };
      case 'pending':
        return { icon: Clock, color: 'bg-gray-100 text-gray-800', label: 'Pending' };
      case 'overdue':
        return { icon: AlertCircle, color: 'bg-red-100 text-red-800', label: 'Overdue' };
    }
  };

  const completedCount = deliverables.filter(d => d.status === 'completed').length;
  const totalProgress = Math.round(
    deliverables.reduce((sum, d) => sum + d.progress, 0) / deliverables.length
  );

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
                    <p className="text-xs text-muted-foreground">{deliverable.description}</p>
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
                  <span>{deliverable.assignee}</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Due: {new Date(deliverable.dueDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <Button variant="ghost" className="w-full text-muted-foreground">
          View All Deliverables
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
