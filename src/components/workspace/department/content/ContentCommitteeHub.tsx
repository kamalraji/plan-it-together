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
  Users
} from 'lucide-react';

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

interface ContentCommitteeHubProps {
  committees?: Workspace[];
  onCommitteeClick?: (committee: Workspace) => void;
}

const COMMITTEE_CONFIG = {
  content: {
    icon: FileText,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  judge: {
    icon: Gavel,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
  },
  media: {
    icon: Camera,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
  },
  speaker: {
    icon: Mic2,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
  },
};

// Mock data for demo purposes
const mockCommitteeStatus: CommitteeStatus[] = [
  {
    id: '1',
    name: 'Content Committee',
    type: 'content',
    progress: 75,
    tasksDone: 18,
    tasksTotal: 24,
    members: 6,
    status: 'on-track',
  },
  {
    id: '2',
    name: 'Judge Committee',
    type: 'judge',
    progress: 60,
    tasksDone: 12,
    tasksTotal: 20,
    members: 8,
    status: 'on-track',
  },
  {
    id: '3',
    name: 'Media Committee',
    type: 'media',
    progress: 45,
    tasksDone: 9,
    tasksTotal: 20,
    members: 5,
    status: 'at-risk',
  },
  {
    id: '4',
    name: 'Speaker Liaison',
    type: 'speaker',
    progress: 85,
    tasksDone: 17,
    tasksTotal: 20,
    members: 4,
    status: 'on-track',
  },
];

export function ContentCommitteeHub({ committees: _committees = [], onCommitteeClick }: ContentCommitteeHubProps) {
  const getStatusBadge = (status: CommitteeStatus['status']) => {
    const config = {
      'on-track': { label: 'On Track', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
      'at-risk': { label: 'At Risk', className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
      'behind': { label: 'Behind', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
    };
    return config[status];
  };

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
        {mockCommitteeStatus.map((committee) => {
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
        })}
      </CardContent>
    </Card>
  );
}
