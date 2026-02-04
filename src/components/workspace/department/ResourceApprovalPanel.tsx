import { useState } from 'react';
import { useIncomingResourceRequests } from '@/hooks/useResourceRequests';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Package, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ResourceApprovalPanelProps {
  workspaceId: string;
}

export function ResourceApprovalPanel({ workspaceId }: ResourceApprovalPanelProps) {
  const { user } = useAuth();
  const { pendingRequests, requests, reviewRequest, isLoading, isReviewing } = useIncomingResourceRequests(workspaceId);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const handleReview = (
    requestId: string, 
    status: 'approved' | 'rejected',
    resourceId: string,
    quantity: number
  ) => {
    if (!user) return;
    reviewRequest({
      id: requestId,
      status,
      reviewNotes: reviewNotes[requestId],
      reviewerId: user.id,
      resourceId,
      quantity,
    });
    setExpandedId(null);
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-600',
    approved: 'bg-green-500/20 text-green-600',
    rejected: 'bg-destructive/20 text-destructive',
    returned: 'bg-muted text-muted-foreground',
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-20 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Resource Requests</h3>
        </div>
        {pendingRequests.length > 0 && (
          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600">
            {pendingRequests.length} pending
          </Badge>
        )}
      </div>

      {requests.length > 0 ? (
        <div className="space-y-3">
          {requests.map((request) => {
            const isExpanded = expandedId === request.id;
            const isPending = request.status === 'pending';

            return (
              <div 
                key={request.id} 
                className={cn(
                  "border border-border rounded-lg overflow-hidden transition-all",
                  isPending && "border-yellow-500/30"
                )}
              >
                <div 
                  className={cn(
                    "flex items-center justify-between p-3 cursor-pointer",
                    isPending ? "bg-yellow-500/5" : "bg-muted/30"
                  )}
                  onClick={() => isPending && setExpandedId(isExpanded ? null : request.id)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={request.requester?.avatar_url} />
                      <AvatarFallback>{request.requester?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {request.resource?.name}
                        </p>
                        <Badge variant="secondary" className={cn("text-xs", statusColors[request.status])}>
                          {request.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {request.requesting_workspace?.name} • Qty: {request.quantity}
                        {request.start_date && ` • ${format(new Date(request.start_date), 'MMM d')}`}
                      </p>
                    </div>
                  </div>

                  {isPending && (
                    <Button variant="ghost" size="sm">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  )}
                </div>

                {isExpanded && isPending && (
                  <div className="p-3 border-t border-border bg-background space-y-3">
                    {request.purpose && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Purpose</p>
                        <p className="text-sm text-foreground">{request.purpose}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Review Notes (optional)</p>
                      <Textarea
                        placeholder="Add notes for this decision..."
                        value={reviewNotes[request.id] || ''}
                        onChange={(e) => setReviewNotes(prev => ({ ...prev, [request.id]: e.target.value }))}
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleReview(request.id, 'approved', request.resource_id, request.quantity)}
                        disabled={isReviewing}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReview(request.id, 'rejected', request.resource_id, request.quantity)}
                        disabled={isReviewing}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">No resource requests yet.</p>
      )}
    </div>
  );
}
