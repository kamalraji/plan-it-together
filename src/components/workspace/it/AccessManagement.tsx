import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Key, UserCheck, UserX, Clock } from 'lucide-react';

interface AccessRequest {
  id: string;
  user: string;
  requestType: 'new_access' | 'permission_change' | 'revoke';
  resource: string;
  status: 'pending' | 'approved' | 'denied';
  requestedAt: string;
}

export function AccessManagement() {
  const requests: AccessRequest[] = [
    { id: '1', user: 'Sarah Johnson', requestType: 'new_access', resource: 'Admin Portal', status: 'pending', requestedAt: '20 min ago' },
    { id: '2', user: 'Mike Chen', requestType: 'permission_change', resource: 'Analytics Dashboard', status: 'pending', requestedAt: '1 hour ago' },
    { id: '3', user: 'Emily Wilson', requestType: 'new_access', resource: 'Badge Printing System', status: 'approved', requestedAt: '2 hours ago' },
    { id: '4', user: 'Tom Davis', requestType: 'revoke', resource: 'Volunteer Portal', status: 'approved', requestedAt: '3 hours ago' },
  ];

  const getRequestIcon = (type: AccessRequest['requestType']) => {
    switch (type) {
      case 'new_access':
        return <UserCheck className="h-4 w-4 text-success" />;
      case 'permission_change':
        return <Key className="h-4 w-4 text-primary" />;
      case 'revoke':
        return <UserX className="h-4 w-4 text-destructive" />;
    }
  };

  const getStatusBadge = (status: AccessRequest['status']) => {
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
        <div className="space-y-3">
          {requests.map((request) => (
            <div
              key={request.id}
              className={`p-3 rounded-lg transition-colors ${
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
      </CardContent>
    </Card>
  );
}
