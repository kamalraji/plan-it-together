import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileCheck, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ChevronRight,
  Shuffle 
} from 'lucide-react';

interface Submission {
  id: string;
  teamName: string;
  projectTitle: string;
  category: string;
  submittedAt: string;
  assignedJudges: string[];
  status: 'pending' | 'in_review' | 'scored' | 'needs_consensus';
  averageScore?: number;
}

interface SubmissionAssignmentsProps {
  workspaceId?: string;
}

export function SubmissionAssignments(_props: SubmissionAssignmentsProps) {
  // Mock data - in production, fetch from database
  const [submissions] = useState<Submission[]>([
    {
      id: '1',
      teamName: 'CodeCrafters',
      projectTitle: 'AI-Powered Healthcare Assistant',
      category: 'Healthcare',
      submittedAt: '2024-01-15T10:30:00',
      assignedJudges: ['Dr. Priya Sharma', 'Rajesh Kumar'],
      status: 'scored',
      averageScore: 8.5,
    },
    {
      id: '2',
      teamName: 'TechTitans',
      projectTitle: 'Smart City Traffic Management',
      category: 'Smart Cities',
      submittedAt: '2024-01-15T11:15:00',
      assignedJudges: ['Anita Desai', 'Vikram Patel'],
      status: 'in_review',
    },
    {
      id: '3',
      teamName: 'DataWizards',
      projectTitle: 'Climate Change Prediction Model',
      category: 'Environment',
      submittedAt: '2024-01-15T12:00:00',
      assignedJudges: ['Dr. Priya Sharma'],
      status: 'pending',
    },
    {
      id: '4',
      teamName: 'InnovatorsHub',
      projectTitle: 'Blockchain Supply Chain',
      category: 'FinTech',
      submittedAt: '2024-01-15T12:45:00',
      assignedJudges: ['Vikram Patel', 'Rajesh Kumar', 'Anita Desai'],
      status: 'needs_consensus',
      averageScore: 7.2,
    },
  ]);

  const getStatusConfig = (status: Submission['status']) => {
    switch (status) {
      case 'pending':
        return { color: 'bg-muted text-foreground', icon: Clock, label: 'Pending' };
      case 'in_review':
        return { color: 'bg-blue-100 text-blue-800', icon: AlertCircle, label: 'In Review' };
      case 'scored':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Scored' };
      case 'needs_consensus':
        return { color: 'bg-amber-100 text-amber-800', icon: Users, label: 'Needs Consensus' };
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileCheck className="h-5 w-5 text-primary" />
          Submission Assignments
        </CardTitle>
        <Button size="sm" variant="outline" className="gap-1">
          <Shuffle className="h-4 w-4" />
          Auto-Assign
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {submissions.map((submission) => {
          const statusConfig = getStatusConfig(submission.status);
          const StatusIcon = statusConfig.icon;

          return (
            <div 
              key={submission.id} 
              className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{submission.projectTitle}</p>
                    {submission.averageScore && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {submission.averageScore}/10
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">by {submission.teamName}</p>
                </div>
                <Badge className={statusConfig.color} variant="secondary">
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {submission.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    <Users className="h-3 w-3 inline mr-1" />
                    {submission.assignedJudges.length} judges
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          );
        })}

        <Button variant="ghost" className="w-full text-muted-foreground">
          View All Submissions
        </Button>
      </CardContent>
    </Card>
  );
}
