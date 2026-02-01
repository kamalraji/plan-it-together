import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Eye, ChevronRight } from 'lucide-react';
import { TaskApprovalRequest } from '@/lib/taskApprovalTypes';
import { useTaskApprovalRequests } from '@/hooks/useTaskApprovalRequests';
import { useTaskApprovalCheck } from '@/hooks/useTaskApprovalCheck';
import { useTaskApprovalPolicies } from '@/hooks/useTaskApprovalPolicies';
import { TaskApprovalDialog } from './TaskApprovalDialog';
import { formatDistanceToNow } from 'date-fns';
import { WorkspaceRole } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface PendingApprovalsPanelProps {
  workspaceId: string;
  userRole: WorkspaceRole;
  compact?: boolean;
  maxItems?: number;
}

export function PendingApprovalsPanel({
  workspaceId,
  userRole,
  compact = false,
  maxItems = 5,
}: PendingApprovalsPanelProps) {
  const { user } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<TaskApprovalRequest | null>(null);

  const { pendingApprovals, isLoadingPending } = useTaskApprovalRequests(workspaceId);
  const { policies } = useTaskApprovalPolicies(workspaceId);
  const { canUserApprove, isSelfApproval } = useTaskApprovalCheck(policies);

  // Filter to only show requests the user can approve
  const approvableRequests = pendingApprovals.filter(request => 
    canUserApprove(request, user?.id || '', userRole)
  );

  const displayRequests = approvableRequests.slice(0, maxItems);
  const hasMore = approvableRequests.length > maxItems;

  if (isLoadingPending) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (approvableRequests.length === 0) {
    if (compact) return null;
    
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            Pending Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No tasks waiting for your approval
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            Pending Approvals
            <Badge variant="secondary" className="ml-auto">
              {approvableRequests.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className={compact ? 'max-h-[200px]' : 'max-h-[400px]'}>
            <div className="space-y-2">
              {displayRequests.map((request) => (
                <ApprovalRequestItem
                  key={request.id}
                  request={request}
                  onClick={() => setSelectedRequest(request)}
                />
              ))}
            </div>
          </ScrollArea>
          
          {hasMore && (
            <Button variant="ghost" className="w-full mt-2" size="sm">
              View all {approvableRequests.length} pending
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </CardContent>
      </Card>

      <TaskApprovalDialog
        request={selectedRequest}
        open={!!selectedRequest}
        onOpenChange={(open) => !open && setSelectedRequest(null)}
        userRole={userRole}
        canApprove={selectedRequest ? canUserApprove(selectedRequest, user?.id || '', userRole) : false}
        isSelfApproval={selectedRequest ? isSelfApproval(selectedRequest, user?.id || '') : false}
        allowSelfApproval={selectedRequest?.policy?.allowSelfApproval}
        workspaceId={workspaceId}
      />
    </>
  );
}

interface ApprovalRequestItemProps {
  request: TaskApprovalRequest;
  onClick: () => void;
}

function ApprovalRequestItem({ request, onClick }: ApprovalRequestItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">
            {request.task?.title || 'Unknown Task'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Requested by {request.requester?.name || 'Unknown'} •{' '}
            {formatDistanceToNow(new Date(request.requestedAt), { addSuffix: true })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {request.task?.priority && (
            <Badge 
              variant="outline" 
              className={getPriorityColor(request.task.priority)}
            >
              {request.task.priority}
            </Badge>
          )}
          <Eye className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      
      {request.policy && (
        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
          <span>Level {request.currentLevel} of {request.policy.approvalChain.length}</span>
        </div>
      )}
    </button>
  );
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'URGENT':
      return 'border-red-500 text-red-600';
    case 'HIGH':
      return 'border-orange-500 text-orange-600';
    case 'MEDIUM':
      return 'border-yellow-500 text-yellow-600';
    default:
      return 'border-gray-300 text-gray-500';
  }
}
