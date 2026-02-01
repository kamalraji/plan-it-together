import { useState } from 'react';
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
  ChevronRight
} from 'lucide-react';

interface PressCredential {
  id: string;
  name: string;
  outlet: string;
  type: 'print' | 'broadcast' | 'online' | 'freelance';
  status: 'approved' | 'pending' | 'rejected';
  accessLevel: 'full' | 'restricted' | 'press_room_only';
  requestedAt: string;
}

export function PressCredentialManager() {
  const [credentials] = useState<PressCredential[]>([
    {
      id: '1',
      name: 'Kavitha Sharma',
      outlet: 'The Hindu',
      type: 'print',
      status: 'approved',
      accessLevel: 'full',
      requestedAt: '2024-01-10',
    },
    {
      id: '2',
      name: 'Amit Verma',
      outlet: 'NDTV',
      type: 'broadcast',
      status: 'approved',
      accessLevel: 'full',
      requestedAt: '2024-01-11',
    },
    {
      id: '3',
      name: 'Sarah Chen',
      outlet: 'TechCrunch',
      type: 'online',
      status: 'pending',
      accessLevel: 'restricted',
      requestedAt: '2024-01-14',
    },
    {
      id: '4',
      name: 'Rajesh Kumar',
      outlet: 'Freelance',
      type: 'freelance',
      status: 'pending',
      accessLevel: 'press_room_only',
      requestedAt: '2024-01-15',
    },
  ]);

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

  const getTypeColor = (type: PressCredential['type']) => {
    switch (type) {
      case 'print':
        return 'bg-blue-100 text-blue-800';
      case 'broadcast':
        return 'bg-purple-100 text-purple-800';
      case 'online':
        return 'bg-cyan-100 text-cyan-800';
      case 'freelance':
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAccessBadge = (level: PressCredential['accessLevel']) => {
    switch (level) {
      case 'full':
        return 'All Access';
      case 'restricted':
        return 'Restricted';
      case 'press_room_only':
        return 'Press Room';
    }
  };

  const pendingCount = credentials.filter(c => c.status === 'pending').length;

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
        {credentials.map((credential) => {
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
                  <Badge className={getTypeColor(credential.type)} variant="secondary">
                    {credential.type}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {getAccessBadge(credential.accessLevel)}
                  </Badge>
                </div>
                {credential.status === 'pending' && (
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-7 text-green-600">
                      Approve
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-red-600">
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <Button variant="ghost" className="w-full text-muted-foreground">
          View All Credentials
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
