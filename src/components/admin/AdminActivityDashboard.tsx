import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Shield,
  UserCog,
  Activity,
  Clock,
  User,
  AlertTriangle,
} from 'lucide-react';

interface AuditLog {
  id: string;
  admin_id: string;
  admin_email: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

const actionConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  ROLE_UPDATE: { label: 'Role Changed', variant: 'default', icon: UserCog },
  ORGANIZER_APPROVED: { label: 'Organizer Approved', variant: 'secondary', icon: Shield },
  USER_SUSPENDED: { label: 'User Suspended', variant: 'destructive', icon: AlertTriangle },
  DEFAULT: { label: 'Action', variant: 'outline', icon: Activity },
};

export const AdminActivityDashboard: React.FC = () => {
  const { data: auditLogs, isLoading, error } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as AuditLog[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getActionConfig = (action: string) => {
    return actionConfig[action] || actionConfig.DEFAULT;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Admin Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Admin Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive text-sm">
            Failed to load audit logs. Please try again later.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Admin Activity Log
        </CardTitle>
        <CardDescription>
          Recent administrative actions and security events
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!auditLogs?.length ? (
          <div className="text-muted-foreground text-sm text-center py-8">
            No admin activity recorded yet.
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {auditLogs.map((log) => {
                const config = getActionConfig(log.action);
                const IconComponent = config.icon;

                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-shrink-0 p-2 rounded-full bg-muted">
                      <IconComponent className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={config.variant}>{config.label}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      <div className="mt-1 text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <User className="h-3 w-3" />
                          {log.admin_email || 'Unknown admin'}
                        </span>
                      </div>
                      {log.target_id && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Target: <code className="bg-muted px-1 rounded">{log.target_id}</code>
                        </div>
                      )}
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="mt-2 text-xs bg-muted/50 p-2 rounded font-mono overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </div>
                      )}
                      {log.ip_address && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          IP: {log.ip_address}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminActivityDashboard;
