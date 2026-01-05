import { useResourceRequests } from '@/hooks/useResourceRequests';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, X, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ResourceRequestsListProps {
  workspaceId: string;
}

export function ResourceRequestsList({ workspaceId }: ResourceRequestsListProps) {
  const { requests, cancelRequest, returnResource, isLoading } = useResourceRequests(workspaceId);

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
    approved: 'bg-green-500/20 text-green-600 border-green-500/30',
    rejected: 'bg-destructive/20 text-destructive border-destructive/30',
    returned: 'bg-muted text-muted-foreground border-border',
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return null;
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Package className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-foreground">Resource Requests</h3>
      </div>

      <div className="space-y-3">
        {requests.map((request) => (
          <div 
            key={request.id} 
            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {request.resource?.name || 'Unknown Resource'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Qty: {request.quantity}
                  {request.start_date && ` • ${format(new Date(request.start_date), 'MMM d')}`}
                  {request.end_date && ` - ${format(new Date(request.end_date), 'MMM d')}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("text-xs", statusColors[request.status])}>
                {request.status}
              </Badge>

              {request.status === 'pending' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => cancelRequest(request.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}

              {request.status === 'approved' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => returnResource(request.id)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
