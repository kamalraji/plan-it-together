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
import { DollarSign, Check, X, ChevronDown, ChevronUp, Building2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { BudgetApprovalRequest } from '@/hooks/useWorkspaceApprovals';
import { PriorityBadge, getPriorityOrder } from './PriorityBadge';
import { SortByPriorityToggle } from './SortByPriorityToggle';
import { ApprovalCommentsThread } from './ApprovalCommentsThread';


interface BudgetApprovalListProps {
  requests: BudgetApprovalRequest[];
  isLoading: boolean;
  workspaceId: string;
}

export function BudgetApprovalList({ requests, isLoading, workspaceId }: BudgetApprovalListProps) {
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
        .from('workspace_budget_requests')
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
      queryClient.invalidateQueries({ queryKey: ['pending-budget-requests', workspaceId] });
      toast.success(`Budget request ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Budget Requests
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
            <DollarSign className="h-4 w-4" />
            Budget Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No pending budget requests
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
            <DollarSign className="h-4 w-4" />
            Budget Requests
            <Badge variant="secondary">
              {requests.length} pending
            </Badge>
          </CardTitle>
          <SortByPriorityToggle
            isActive={sortByPriority}
            onToggle={() => setSortByPriority(!sortByPriority)}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedRequests.map((request) => {
          const isExpanded = expandedId === request.id;

          return (
            <div
              key={request.id}
              className="border border-border rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : request.id)}
                className="w-full p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">
                      {request.requestingWorkspaceName}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {formatCurrency(request.requestedAmount)}
                    </Badge>
                    <PriorityBadge priority={request.priority} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {request.reason}
                  </p>
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
                        <p className="text-sm text-muted-foreground mb-1">Priority</p>
                        <PriorityBadge priority={request.priority} />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Reason</p>
                      <p className="text-sm">{request.reason}</p>
                    </div>
                    
                    {/* Comments Thread */}
                    <ApprovalCommentsThread requestType="budget" requestId={request.id} />
                    
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">
                        Review Notes (optional)
                      </label>
                      <Textarea
                        placeholder="Add notes about your decision..."
                        value={reviewNotes[request.id] || ''}
                        onChange={(e) => setReviewNotes(prev => ({
                          ...prev,
                          [request.id]: e.target.value,
                        }))}
                        className="text-sm"
                        rows={2}
                      />
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
