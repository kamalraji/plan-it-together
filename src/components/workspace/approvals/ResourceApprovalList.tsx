import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Package, Check, X, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ResourceApprovalRequest } from '@/hooks/useWorkspaceApprovals';
import { PriorityBadge, getPriorityOrder } from './PriorityBadge';
import { SortByPriorityToggle } from './SortByPriorityToggle';
import { ApprovalCommentsThread } from './ApprovalCommentsThread';


interface ResourceApprovalListProps {
  requests: ResourceApprovalRequest[];
  isLoading: boolean;
  workspaceId: string;
}

export function ResourceApprovalList({ requests, isLoading, workspaceId }: ResourceApprovalListProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [sortByPriority, setSortByPriority] = useState(false);

  const sortedRequests = useMemo(() => {
    if (!sortByPriority) return requests;
    return [...requests].sort((a, b) => getPriorityOrder(a.priority) - getPriorityOrder(b.priority));
  }, [requests, sortByPriority]);

  const reviewMutation = useMutation({
    mutationFn: async ({ requestId, status, notes }: { requestId: string; status: 'approved' | 'rejected'; notes?: string }) => {
      const { error } = await supabase
        .from('workspace_resource_requests')
        .update({
          status,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          review_notes: notes || null,
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['pending-resource-requests', workspaceId] });
      toast.success(`Resource request ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
    },
    onError: (error) => {
      toast.error('Failed to process request: ' + (error as Error).message);
    },
  });

  const handleReview = (requestId: string, status: 'approved' | 'rejected') => {
    reviewMutation.mutate({
      requestId,
      status,
      notes: reviewNotes[requestId],
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Resource Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
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
            <Package className="h-4 w-4" />
            Resource Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No pending resource requests
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Resource Requests
            <Badge variant="secondary">{requests.length} pending</Badge>
          </CardTitle>
          <SortByPriorityToggle isActive={sortByPriority} onToggle={() => setSortByPriority(!sortByPriority)} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedRequests.map((request) => {
          const isExpanded = expandedId === request.id;
          return (
            <div key={request.id} className="border border-border rounded-lg overflow-hidden">
              <button onClick={() => setExpandedId(isExpanded ? null : request.id)} className="w-full p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors text-left">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Package className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">{request.resourceName}</span>
                    <Badge variant="outline" className="text-xs">Qty: {request.quantity}</Badge>
                    <PriorityBadge priority={request.priority} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">From: {request.requestingWorkspaceName}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                </span>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border/50 bg-muted/30">
                  <div className="pt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Requested by</p>
                        <p className="text-sm font-medium">{request.requesterName || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Quantity</p>
                        <p className="text-sm font-medium">{request.quantity}</p>
                      </div>
                    </div>
                    {(request.startDate || request.endDate) && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {request.startDate && format(new Date(request.startDate), 'MMM d')}
                          {request.startDate && request.endDate && ' - '}
                          {request.endDate && format(new Date(request.endDate), 'MMM d, yyyy')}
                        </span>
                      </div>
                    )}
                    {request.purpose && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Purpose</p>
                        <p className="text-sm">{request.purpose}</p>
                      </div>
                    )}
                    <ApprovalCommentsThread requestType="resource" requestId={request.id} />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleReview(request.id, 'approved')}
                        disabled={reviewMutation.isPending}
                        className="flex-1"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReview(request.id, 'rejected')}
                        disabled={reviewMutation.isPending}
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
