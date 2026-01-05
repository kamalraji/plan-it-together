import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

interface BudgetRequestsOverviewProps {
  workspaceId: string;
}

export function BudgetRequestsOverview({ workspaceId }: BudgetRequestsOverviewProps) {
  // Fetch recent budget requests
  const { data: requests = [] } = useQuery({
    queryKey: ['finance-dept-budget-requests', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_budget_requests')
        .select(`
          id,
          requested_amount,
          reason,
          status,
          created_at,
          requesting_workspace:requesting_workspace_id (name)
        `)
        .eq('target_workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600/30 bg-green-500/10">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600/30 bg-yellow-500/10">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="outline" className="text-red-600 border-red-600/30 bg-red-500/10">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (requests.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Budget Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No budget requests received yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Recent Budget Requests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.map((request) => (
          <div
            key={request.id}
            className="p-3 rounded-lg border border-border"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {(request.requesting_workspace as { name?: string })?.name || 'Unknown'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {request.reason}
                </p>
              </div>
              <p className="text-sm font-bold text-foreground ml-2">
                ${(request.requested_amount || 0).toLocaleString()}
              </p>
            </div>
            {getStatusBadge(request.status)}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
