import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Key, UserCheck, UserX, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ITAccessRequest } from '@/hooks/useITDashboardData';

interface AccessManagementProps {
  requests?: ITAccessRequest[];
  isLoading?: boolean;
}

export function AccessManagement({ requests = [], isLoading }: AccessManagementProps) {
  const getRequestIcon = (type: ITAccessRequest['requestType']) => {
    switch (type) {
      case 'new_access':
        return <UserCheck className="h-4 w-4 text-success" />;
      case 'permission_change':
        return <Key className="h-4 w-4 text-primary" />;
      case 'revoke':
        return <UserX className="h-4 w-4 text-destructive" />;
    }
  };

  const getStatusBadge = (status: ITAccessRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-success/10 text-success border-success/20">Approved</Badge>;
      case 'denied':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Denied</Badge>;
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <div>
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-24 mt-1" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/50">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show empty state if no requests
  const displayRequests = requests.length > 0 ? requests : [];

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">Access Requests</CardTitle>
            <p className="text-sm text-muted-foreground">{pendingRequests.length} pending approval</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {displayRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <UserCheck className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-foreground">No access requests</p>
            <p className="text-xs text-muted-foreground">New requests will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayRequests.map((request) => (
              <div
                key={request.id}
                className={`p-3 rounded-lg transition-colors active:scale-[0.98] ${
                  request.status === 'pending' ? 'bg-muted/50 hover:bg-muted cursor-pointer' : 'bg-muted/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getRequestIcon(request.requestType)}
                    <span className="text-sm font-medium text-foreground">{request.user}</span>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {request.requestType === 'new_access' && 'Requesting access to '}
                  {request.requestType === 'permission_change' && 'Permission change for '}
                  {request.requestType === 'revoke' && 'Access revoked from '}
                  <span className="font-medium text-foreground">{request.resource}</span>
                </p>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {request.requestedAt}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
