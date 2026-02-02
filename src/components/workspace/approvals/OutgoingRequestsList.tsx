import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, Package, Send, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { OutgoingRequest } from '@/hooks/useOutgoingRequests';
import { cn } from '@/lib/utils';

interface OutgoingRequestsListProps {
  requests: OutgoingRequest[];
  isLoading: boolean;
}

export function OutgoingRequestsList({ requests, isLoading }: OutgoingRequestsListProps) {
  const getTypeIcon = (type: OutgoingRequest['type']) => {
    switch (type) {
      case 'budget':
        return <DollarSign className="h-4 w-4" />;
      case 'resource':
        return <Package className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: OutgoingRequest['type']) => {
    switch (type) {
      case 'budget':
        return 'bg-emerald-500/10 text-emerald-600';
      case 'resource':
        return 'bg-blue-500/10 text-blue-600';
    }
  };

  const getStatusBadge = (status: OutgoingRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">Rejected</Badge>;
    }
  };

  const getRequestTitle = (request: OutgoingRequest) => {
    switch (request.type) {
      case 'budget':
        return `Budget: ${new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0,
        }).format(request.requestedAmount)}`;
      case 'resource':
        return `${request.resourceName} (Qty: ${request.quantity})`;
    }
  };

  const getRequestTarget = (request: OutgoingRequest) => {
    switch (request.type) {
      case 'budget':
        return `To: ${request.targetWorkspaceName}`;
      case 'resource':
        return `From: ${request.owningWorkspaceName}`;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="h-4 w-4" />
            My Requests
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
            <Send className="h-4 w-4" />
            My Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No requests yet</p>
            <p className="text-sm text-muted-foreground">
              Submit budget or resource requests using the buttons above
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
          <Send className="h-4 w-4" />
          My Requests
          <Badge variant="secondary" className="ml-auto">
            {requests.length} total
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {requests.map((request) => (
          <div
            key={request.id}
            className="p-3 flex items-center gap-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
          >
            <div className={cn('p-2 rounded-lg', getTypeColor(request.type))}>
              {getTypeIcon(request.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm truncate">
                  {getRequestTitle(request)}
                </span>
                {getStatusBadge(request.status)}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {getRequestTarget(request)}
              </p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
