import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Shield,
  AlertTriangle,
  KeyRound,
  Activity,
  Clock,
  Globe,
  Eye,
  RefreshCw,
  Users,
  Ban,
} from 'lucide-react';

interface SuspiciousActivity {
  type: 'failed_login' | 'rate_limited' | 'suspicious_pattern' | 'admin_action';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

interface AdminAuditLog {
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

const severityConfig = {
  low: { color: 'bg-blue-500/10 text-blue-700 border-blue-500/30', icon: Activity },
  medium: { color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30', icon: AlertTriangle },
  high: { color: 'bg-orange-500/10 text-orange-700 border-orange-500/30', icon: AlertTriangle },
  critical: { color: 'bg-red-500/10 text-red-700 border-red-500/30', icon: Ban },
};

export const SecurityAuditDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  const getStartDate = () => {
    switch (timeRange) {
      case '24h': return subDays(new Date(), 1);
      case '7d': return subDays(new Date(), 7);
      case '30d': return subDays(new Date(), 30);
    }
  };

  // Fetch admin audit logs
  const { data: auditLogs, isLoading: auditLoading, refetch: refetchAudit } = useQuery({
    queryKey: ['security-audit-logs', timeRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .gte('created_at', getStartDate().toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as AdminAuditLog[];
    },
    refetchInterval: 60000,
  });

  // Fetch workspace audit logs for suspicious patterns
  const { data: workspaceAuditLogs, isLoading: workspaceLoading } = useQuery({
    queryKey: ['workspace-security-logs', timeRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_audit_logs')
        .select('*')
        .gte('created_at', getStartDate().toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
    refetchInterval: 60000,
  });

  // Analyze logs for suspicious activity
  const suspiciousActivities: SuspiciousActivity[] = React.useMemo(() => {
    const activities: SuspiciousActivity[] = [];

    // Analyze admin audit logs for sensitive actions
    auditLogs?.forEach((log) => {
      if (log.action === 'USER_SUSPENDED') {
        activities.push({
          type: 'admin_action',
          severity: 'high',
          description: `User suspended by ${log.admin_email || 'admin'}`,
          timestamp: log.created_at,
          metadata: { target_id: log.target_id, details: log.details },
        });
      }
      if (log.action === 'ROLE_UPDATE' && log.details && (log.details as any).newRole === 'admin') {
        activities.push({
          type: 'admin_action',
          severity: 'medium',
          description: `Admin role granted by ${log.admin_email || 'admin'}`,
          timestamp: log.created_at,
          metadata: { target_id: log.target_id },
        });
      }
    });

    // Analyze workspace logs for suspicious patterns
    workspaceAuditLogs?.forEach((log: any) => {
      if (log.action === 'MEMBER_REMOVED' || log.action === 'ACCESS_REVOKED') {
        activities.push({
          type: 'suspicious_pattern',
          severity: 'low',
          description: `Member access revoked: ${log.action}`,
          timestamp: log.created_at,
          metadata: { workspace_id: log.workspace_id, actor: log.actor_email },
        });
      }
      if (log.action === 'BULK_PERMISSION_CHANGE') {
        activities.push({
          type: 'suspicious_pattern',
          severity: 'medium',
          description: `Bulk permission change detected`,
          timestamp: log.created_at,
          metadata: { workspace_id: log.workspace_id, actor: log.actor_email },
        });
      }
    });

    // Sort by timestamp descending
    return activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [auditLogs, workspaceAuditLogs]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    const criticalCount = suspiciousActivities.filter(a => a.severity === 'critical').length;
    const highCount = suspiciousActivities.filter(a => a.severity === 'high').length;
    const mediumCount = suspiciousActivities.filter(a => a.severity === 'medium').length;
    const lowCount = suspiciousActivities.filter(a => a.severity === 'low').length;
    
    return {
      total: suspiciousActivities.length,
      critical: criticalCount,
      high: highCount,
      medium: mediumCount,
      low: lowCount,
      adminActions: auditLogs?.length || 0,
    };
  }, [suspiciousActivities, auditLogs]);

  const isLoading = auditLoading || workspaceLoading;

  return (
    <div className="space-y-6">
      {/* Header with refresh and time range */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Security Audit Dashboard</h2>
            <p className="text-sm text-muted-foreground">
              Monitor suspicious activities and security events
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border">
            {(['24h', '7d', '30d'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange(range)}
                className="rounded-none first:rounded-l-lg last:rounded-r-lg"
              >
                {range}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchAudit()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Alerts</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical/High</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.critical + stats.high}
                </p>
              </div>
              <Ban className="h-8 w-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Admin Actions</p>
                <p className="text-2xl font-bold">{stats.adminActions}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Time Range</p>
                <p className="text-2xl font-bold">{timeRange}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Suspicious Activity
            {stats.total > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">
                {stats.total}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="admin" className="gap-2">
            <Shield className="h-4 w-4" />
            Admin Actions
          </TabsTrigger>
          <TabsTrigger value="auth" className="gap-2">
            <KeyRound className="h-4 w-4" />
            Auth Events
          </TabsTrigger>
        </TabsList>

        {/* Suspicious Activity Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Suspicious Activity Alerts
              </CardTitle>
              <CardDescription>
                Automatically detected security anomalies and patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : suspiciousActivities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No suspicious activity detected in the selected time range</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {suspiciousActivities.map((activity, index) => {
                      const config = severityConfig[activity.severity];
                      const IconComponent = config.icon;
                      
                      return (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border ${config.color}`}
                        >
                          <div className="flex items-start gap-3">
                            <IconComponent className="h-5 w-5 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <Badge
                                  variant="outline"
                                  className={config.color}
                                >
                                  {activity.severity.toUpperCase()}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {activity.type.replace('_', ' ')}
                                </Badge>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                                </span>
                              </div>
                              <p className="text-sm font-medium">{activity.description}</p>
                              {Object.keys(activity.metadata).length > 0 && (
                                <pre className="mt-2 text-xs bg-background/50 p-2 rounded overflow-x-auto">
                                  {JSON.stringify(activity.metadata, null, 2)}
                                </pre>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Actions Tab */}
        <TabsContent value="admin">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Admin Audit Log
              </CardTitle>
              <CardDescription>
                All administrative actions performed in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !auditLogs?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  No admin actions recorded in this time range
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{log.action}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          By: {log.admin_email || log.admin_id}
                        </p>
                        {log.target_id && (
                          <p className="text-xs text-muted-foreground">
                            Target: <code className="bg-muted px-1 rounded">{log.target_id}</code>
                          </p>
                        )}
                        {log.ip_address && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Globe className="h-3 w-3" />
                            {log.ip_address}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auth Events Tab */}
        <TabsContent value="auth">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                Authentication Events
              </CardTitle>
              <CardDescription>
                Failed login attempts and authentication anomalies are monitored via Supabase Auth logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="mb-2">Authentication logs are available in the Supabase Dashboard</p>
                <p className="text-sm">
                  Go to <strong>Authentication → Logs</strong> to view detailed auth events including:
                </p>
                <ul className="text-sm mt-2 space-y-1">
                  <li>• Failed login attempts</li>
                  <li>• Password reset requests</li>
                  <li>• Account lockouts</li>
                  <li>• Suspicious sign-in patterns</li>
                </ul>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => window.open('https://supabase.com/dashboard/project/ltsniuflqfahdcirrmjh/auth/users', '_blank')}
                >
                  <KeyRound className="h-4 w-4 mr-2" />
                  Open Supabase Auth Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityAuditDashboard;
