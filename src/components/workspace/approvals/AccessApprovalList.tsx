import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { UserPlus, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { AccessApprovalRequest } from '@/hooks/useWorkspaceApprovals';
import { PriorityBadge, getPriorityOrder } from './PriorityBadge';
import { SortByPriorityToggle } from './SortByPriorityToggle';
import { ApprovalCommentsThread } from './ApprovalCommentsThread';

interface AccessApprovalListProps {
  requests: AccessApprovalRequest[];
  isLoading: boolean;
  workspaceId: string;
}

export function AccessApprovalList({ requests, isLoading, workspaceId }: AccessApprovalListProps) {
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
    mutationFn: async ({ requestId, status, notes }: { requestId: string; status: 'APPROVED' | 'REJECTED'; notes?: string }) => {
      const { error } = await supabase
        .from('workspace_access_requests')
        .update({
          status,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          review_notes: notes || null,
        })
        .eq('id', requestId);

      if (error) throw error;

      // Note: Adding user as workspace member should be handled by a trigger or edge function
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['pending-access-requests', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
      toast.success(`Access request ${status === 'APPROVED' ? 'approved' : 'rejected'} successfully`);
    },
    onError: (error) => {
      toast.error('Failed to process request: ' + (error as Error).message);
    },
  });

  const handleReview = (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    reviewMutation.mutate({
      requestId,
      status,
      notes: reviewNotes[requestId],
    });
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Access Requests
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
            <UserPlus className="h-4 w-4" />
            Access Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No pending access requests
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
            <UserPlus className="h-4 w-4" />
            Access Requests
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
                <Avatar className="h-9 w-9">
                  <AvatarImage src={request.avatarUrl || undefined} />
                  <AvatarFallback className="bg-amber-500/10 text-amber-600 text-xs">{getInitials(request.userName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">{request.userName || 'Unknown User'}</span>
                    {request.requestedRole && <Badge variant="outline" className="text-xs capitalize">{request.requestedRole}</Badge>}
                    <PriorityBadge priority={request.priority} />
                  </div>
                  {request.message && <p className="text-xs text-muted-foreground truncate mt-0.5">{request.message}</p>}
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
                        <p className="text-sm text-muted-foreground mb-1">User</p>
                        <p className="text-sm font-medium">{request.userName || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Requested Role</p>
                        <p className="text-sm font-medium capitalize">{request.requestedRole || 'Member'}</p>
                      </div>
                    </div>
                    {request.message && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Message</p>
                        <p className="text-sm">{request.message}</p>
                      </div>
                    )}
                    <ApprovalCommentsThread requestType="access" requestId={request.id} />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleReview(request.id, 'APPROVED')}
                        disabled={reviewMutation.isPending}
                        className="flex-1"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReview(request.id, 'REJECTED')}
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
