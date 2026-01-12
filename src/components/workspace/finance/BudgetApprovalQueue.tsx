import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Wallet, 
  Check,
  X,
  ChevronRight,
  ArrowUpRight,
  Clock,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useBudgetRequests, BudgetRequest } from '@/hooks/useWorkspaceBudget';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface BudgetApprovalQueueProps {
  workspaceId: string;
  parentWorkspaceId?: string | null;
}

export function BudgetApprovalQueue({ workspaceId }: BudgetApprovalQueueProps) {
  const { user } = useAuth();
  const { requests, isLoading, reviewRequest, isReviewing } = useBudgetRequests(workspaceId, 'approver');

  // Filter to only pending requests
  const pendingRequests = requests.filter(r => r.status === 'pending');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPriorityBadge = (request: BudgetRequest) => {
    const amount = request.requested_amount;
    if (amount >= 50000) {
      return <Badge className="bg-destructive/10 text-destructive border-destructive/20">High Priority</Badge>;
    }
    if (amount >= 20000) {
      return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">Medium</Badge>;
    }
    return <Badge className="bg-muted text-muted-foreground border-border">Standard</Badge>;
  };

  const totalPending = pendingRequests.reduce((sum, r) => sum + r.requested_amount, 0);

  const handleApprove = (requestId: string) => {
    if (!user) return;
    reviewRequest({
      id: requestId,
      status: 'approved',
      reviewed_by: user.id,
    });
  };

  const handleReject = (requestId: string) => {
    if (!user) return;
    reviewRequest({
      id: requestId,
      status: 'rejected',
      reviewed_by: user.id,
    });
  };

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-violet-500/10">
              <Wallet className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Budget Approval Queue</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {pendingRequests.length} pending · {formatCurrency(totalPending)} total
              </p>
            </div>
          </div>
          <Button size="sm" variant="ghost" className="gap-1 text-xs">
            View All
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingRequests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Wallet className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No pending budget requests</p>
          </div>
        ) : (
          pendingRequests.map(request => {
            const requestingWorkspaceName = request.requesting_workspace?.name || 'Unknown Workspace';
            const initials = requestingWorkspaceName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
            
            return (
              <div
                key={request.id}
                className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{requestingWorkspaceName}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5">
                      <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold text-emerald-600">
                        {formatCurrency(request.requested_amount)}
                      </span>
                    </div>
                    {getPriorityBadge(request)}
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {request.reason}
                </p>

                <div className="flex items-center gap-2">
                  <div className="flex-1" />
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-7 text-xs gap-1 text-destructive hover:bg-destructive/10"
                    onClick={() => handleReject(request.id)}
                    disabled={isReviewing}
                  >
                    {isReviewing ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                    Reject
                  </Button>
                  <Button 
                    size="sm" 
                    className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => handleApprove(request.id)}
                    disabled={isReviewing}
                  >
                    {isReviewing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    Approve
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
