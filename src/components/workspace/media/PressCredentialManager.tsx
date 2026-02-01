import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Plus, 
  CheckCircle, 
  Clock, 
  XCircle,
  Building2,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { usePressCredentials, PressCredential } from '@/hooks/useMediaData';

interface PressCredentialManagerProps {
  workspaceId: string;
}

export function PressCredentialManager({ workspaceId }: PressCredentialManagerProps) {
  const { credentials, isLoading, pendingCount, updateCredentialStatus } = usePressCredentials(workspaceId);

  const getStatusConfig = (status: PressCredential['status']) => {
    switch (status) {
      case 'approved':
        return { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Approved' };
      case 'pending':
        return { icon: Clock, color: 'bg-amber-100 text-amber-800', label: 'Pending' };
      case 'rejected':
        return { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Rejected' };
    }
  };

  const getTypeColor = (type: PressCredential['credential_type']) => {
    switch (type) {
      case 'print':
        return 'bg-blue-100 text-blue-800';
      case 'broadcast':
        return 'bg-purple-100 text-purple-800';
      case 'online':
        return 'bg-cyan-100 text-cyan-800';
      case 'freelance':
        return 'bg-muted text-foreground';
    }
  };

  const getAccessBadge = (level: PressCredential['access_level']) => {
    switch (level) {
      case 'full':
        return 'All Access';
      case 'restricted':
        return 'Restricted';
      case 'press_room_only':
        return 'Press Room';
    }
  };

  const handleApprove = (id: string) => {
    updateCredentialStatus.mutate({ id, status: 'approved' });
  };

  const handleReject = (id: string) => {
    updateCredentialStatus.mutate({ id, status: 'rejected' });
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-primary" />
          Press Credentials
          {pendingCount > 0 && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              {pendingCount} pending
            </Badge>
          )}
        </CardTitle>
        <Button size="sm" variant="outline" className="gap-1">
          <Plus className="h-4 w-4" />
          Add Request
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {credentials.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No credential requests yet
          </p>
        ) : (
          credentials.map((credential) => {
            const statusConfig = getStatusConfig(credential.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div 
                key={credential.id} 
                className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-foreground">{credential.name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      {credential.outlet}
                    </div>
                  </div>
                  <Badge className={statusConfig.color} variant="secondary">
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={getTypeColor(credential.credential_type)} variant="secondary">
                      {credential.credential_type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {getAccessBadge(credential.access_level)}
                    </Badge>
                  </div>
                  {credential.status === 'pending' && (
                    <div className="flex items-center gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 text-green-600"
                        onClick={() => handleApprove(credential.id)}
                        disabled={updateCredentialStatus.isPending}
                      >
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 text-red-600"
                        onClick={() => handleReject(credential.id)}
                        disabled={updateCredentialStatus.isPending}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {credentials.length > 0 && (
          <Button variant="ghost" className="w-full text-muted-foreground">
            View All Credentials
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}