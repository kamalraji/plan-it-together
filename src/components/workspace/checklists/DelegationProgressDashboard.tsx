import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, parseISO } from 'date-fns';
import { 
  Send, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Timer,
  Building2,
  Users,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDelegationProgress, DelegationStatus, DelegatedChecklistWithProgress } from '@/hooks/useDelegationProgress';
import { useDeadlineExtensions } from '@/hooks/useDeadlineExtensions';
import { DeadlineExtensionReviewCard } from './DeadlineExtensionReviewCard';

interface DelegationProgressDashboardProps {
  workspaceId: string;
}

const statusConfig: Record<DelegationStatus, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: 'Pending', icon: Clock, color: 'text-muted-foreground' },
  in_progress: { label: 'In Progress', icon: Timer, color: 'text-blue-500' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'text-green-500' },
  overdue: { label: 'Overdue', icon: AlertTriangle, color: 'text-red-500' },
};

function DelegationCard({ delegation }: { delegation: DelegatedChecklistWithProgress }) {
  const config = statusConfig[delegation.computedStatus];
  const StatusIcon = config.icon;
  const WorkspaceIcon = delegation.workspace_type === 'DEPARTMENT' ? Building2 : Users;

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      delegation.isOverdue && "border-red-200 dark:border-red-900"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <StatusIcon className={cn("h-4 w-4 shrink-0", config.color)} />
              <h4 className="font-medium text-sm truncate">{delegation.title}</h4>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <WorkspaceIcon className="h-3 w-3" />
              <span className="truncate">{delegation.workspace_name}</span>
              {delegation.phase && (
                <>
                  <span>•</span>
                  <span className="capitalize">{delegation.phase.replace('_', ' ')}</span>
                </>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{delegation.progressPercentage}%</span>
              </div>
              <Progress value={delegation.progressPercentage} className="h-1.5" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{delegation.completedItems} of {delegation.totalItems} items</span>
                {delegation.due_date && (
                  <span className={cn(delegation.isOverdue && "text-red-500 font-medium")}>
                    Due: {format(parseISO(delegation.due_date), 'MMM d')}
                    {delegation.isOverdue && ` (${delegation.daysOverdue}d overdue)`}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Badge 
            variant="outline" 
            className={cn(
              "shrink-0 text-xs",
              delegation.computedStatus === 'completed' && "bg-green-50 border-green-200 text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400",
              delegation.computedStatus === 'overdue' && "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400",
              delegation.computedStatus === 'in_progress' && "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400",
            )}
          >
            {config.label}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  color,
  onClick,
  active 
}: { 
  label: string; 
  value: number; 
  icon: React.ElementType; 
  color: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        active && "ring-2 ring-primary"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
          <div className={cn("p-2 rounded-lg bg-muted/50", color)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DelegationProgressDashboard({ workspaceId }: DelegationProgressDashboardProps) {
  const { delegations, stats, isLoading } = useDelegationProgress(workspaceId);
  const { 
    incomingExtensions, 
    isLoadingIncoming,
    reviewExtension,
    isReviewing 
  } = useDeadlineExtensions(workspaceId);
  
  const [statusFilter, setStatusFilter] = useState<DelegationStatus | 'all'>('all');
  const [activeTab, setActiveTab] = useState('delegations');

  const pendingExtensions = useMemo(() => 
    incomingExtensions.filter(ext => ext.status === 'pending'),
    [incomingExtensions]
  );

  const filteredDelegations = useMemo(() => {
    if (statusFilter === 'all') return delegations;
    return delegations.filter(d => d.computedStatus === statusFilter);
  }, [delegations, statusFilter]);

  const handleApprove = (extensionId: string, reviewNotes?: string) => {
    reviewExtension({ extensionId, status: 'approved', reviewNotes });
  };

  const handleReject = (extensionId: string, reviewNotes?: string) => {
    reviewExtension({ extensionId, status: 'rejected', reviewNotes });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Delegation Progress
          </h2>
          <p className="text-sm text-muted-foreground">
            Track all checklists delegated to child workspaces
          </p>
        </div>
        {pendingExtensions.length > 0 && (
          <Badge variant="destructive" className="animate-pulse">
            {pendingExtensions.length} extension request{pendingExtensions.length > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard
          label="Total"
          value={stats.total}
          icon={Send}
          color="text-muted-foreground"
          onClick={() => setStatusFilter('all')}
          active={statusFilter === 'all'}
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          icon={Clock}
          color="text-muted-foreground"
          onClick={() => setStatusFilter('pending')}
          active={statusFilter === 'pending'}
        />
        <StatCard
          label="In Progress"
          value={stats.inProgress}
          icon={Timer}
          color="text-blue-500"
          onClick={() => setStatusFilter('in_progress')}
          active={statusFilter === 'in_progress'}
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          icon={CheckCircle}
          color="text-green-500"
          onClick={() => setStatusFilter('completed')}
          active={statusFilter === 'completed'}
        />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          icon={AlertTriangle}
          color="text-red-500"
          onClick={() => setStatusFilter('overdue')}
          active={statusFilter === 'overdue'}
        />
      </div>

      {/* Average Progress */}
      {stats.total > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Average Progress</span>
              </div>
              <span className="text-lg font-bold">{stats.averageProgress}%</span>
            </div>
            <Progress value={stats.averageProgress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="delegations" className="gap-1.5">
            <Send className="h-3.5 w-3.5" />
            Delegations
            <Badge variant="secondary" className="ml-1 text-xs">
              {filteredDelegations.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="extensions" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Extension Requests
            {pendingExtensions.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">
                {pendingExtensions.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="delegations" className="mt-4">
          {filteredDelegations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Send className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-center">
                  {statusFilter === 'all' 
                    ? 'No delegated checklists yet. Create a checklist and delegate it to a child workspace.'
                    : `No ${statusFilter.replace('_', ' ')} delegations.`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredDelegations.map(delegation => (
                <DelegationCard key={delegation.id} delegation={delegation} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="extensions" className="mt-4">
          {isLoadingIncoming ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : incomingExtensions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-center">
                  No deadline extension requests.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {incomingExtensions.map(extension => (
                <DeadlineExtensionReviewCard
                  key={extension.id}
                  extension={extension}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  isReviewing={isReviewing}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
