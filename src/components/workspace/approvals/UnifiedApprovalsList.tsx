import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, Package, UserPlus, Clock, Rocket } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ApprovalRequest } from '@/hooks/useWorkspaceApprovals';
import { cn } from '@/lib/utils';

interface UnifiedApprovalsListProps {
  requests: ApprovalRequest[];
  isLoading: boolean;
  onSelectRequest?: (request: ApprovalRequest) => void;
}

export function UnifiedApprovalsList({ requests, isLoading, onSelectRequest }: UnifiedApprovalsListProps) {
  const getTypeIcon = (type: ApprovalRequest['type']) => {
    switch (type) {
      case 'budget':
        return <DollarSign className="h-4 w-4" />;
      case 'resource':
        return <Package className="h-4 w-4" />;
      case 'access':
        return <UserPlus className="h-4 w-4" />;
      case 'event-publish':
        return <Rocket className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: ApprovalRequest['type']) => {
    switch (type) {
      case 'budget':
        return 'bg-emerald-500/10 text-emerald-600';
      case 'resource':
        return 'bg-blue-500/10 text-blue-600';
      case 'access':
        return 'bg-amber-500/10 text-amber-600';
      case 'event-publish':
        return 'bg-purple-500/10 text-purple-600';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeLabel = (type: ApprovalRequest['type']) => {
    switch (type) {
      case 'budget':
        return 'Budget';
      case 'resource':
        return 'Resource';
      case 'access':
        return 'Access';
      case 'event-publish':
        return 'Event Publish';
      default:
        return 'Request';
    }
  };

  const getRequestTitle = (request: ApprovalRequest) => {
    switch (request.type) {
      case 'budget':
        return request.requestingWorkspaceName;
      case 'resource':
        return request.resourceName;
      case 'access':
        return request.userName || 'Unknown User';
      case 'event-publish':
        return request.eventName;
      default:
        return 'Unknown Request';
    }
  };

  const getRequestSubtitle = (request: ApprovalRequest) => {
    switch (request.type) {
      case 'budget':
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0,
        }).format(request.requestedAmount);
      case 'resource':
        return `Qty: ${request.quantity} from ${request.requestingWorkspaceName}`;
      case 'access':
        return request.requestedRole ? `Requesting ${request.requestedRole} role` : 'Requesting access';
      case 'event-publish':
        return `Requested by ${request.requesterName || 'Unknown'}`;
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            All Pending Approvals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            All Pending Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">All caught up!</p>
            <p className="text-sm text-muted-foreground">
              No pending approvals at the moment
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          All Pending Approvals
          <Badge variant="secondary" className="ml-auto">
            {requests.length} pending
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {requests.map((request) => (
          <button
            key={request.id}
            onClick={() => onSelectRequest?.(request)}
            className="w-full p-3 flex items-center gap-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
          >
            <div className={cn('p-2 rounded-lg', getTypeColor(request.type))}>
              {getTypeIcon(request.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">
                  {getRequestTitle(request)}
                </span>
                <Badge variant="outline" className="text-[10px] px-1.5">
                  {getTypeLabel(request.type)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {getRequestSubtitle(request)}
              </p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
            </span>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
