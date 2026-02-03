import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, ShieldCheck, AlertTriangle, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ITSecurityAlert } from '@/hooks/useITDashboardData';

interface SecurityAlertsProps {
  alerts?: ITSecurityAlert[];
  isLoading?: boolean;
}

export function SecurityAlerts({ alerts = [], isLoading }: SecurityAlertsProps) {
  const getSeverityIcon = (severity: ITSecurityAlert['severity']) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <ShieldAlert className="h-5 w-5 text-destructive" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'low':
      case 'info':
        return <Info className="h-5 w-5 text-primary" />;
    }
  };

  const getSeverityBadge = (severity: ITSecurityAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-destructive text-destructive-foreground">Critical</Badge>;
      case 'high':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">High</Badge>;
      case 'medium':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Medium</Badge>;
      case 'low':
        return <Badge variant="secondary">Low</Badge>;
      case 'info':
        return <Badge className="bg-primary/10 text-primary border-primary/20">Info</Badge>;
    }
  };

  const activeAlerts = alerts.filter(a => a.status !== 'resolved');

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div>
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-20 mt-1" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/50 border-l-4 border-muted">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show "All Clear" state if no alerts
  const displayAlerts = alerts.length > 0 ? alerts : [];

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">Security Alerts</CardTitle>
            <p className="text-sm text-muted-foreground">{activeAlerts.length} active alerts</p>
          </div>
        </div>
        <Badge variant="outline" className={activeAlerts.length === 0 ? 'text-success' : 'text-warning'}>
          {activeAlerts.length === 0 ? 'All Clear' : 'Attention Required'}
        </Badge>
      </CardHeader>
      <CardContent>
        {displayAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ShieldCheck className="h-12 w-12 text-success/50 mb-3" />
            <p className="text-sm font-medium text-foreground">No active alerts</p>
            <p className="text-xs text-muted-foreground">All systems are secure</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border-l-4 ${
                  alert.status === 'resolved'
                    ? 'bg-muted/30 border-muted opacity-60'
                    : alert.severity === 'critical' || alert.severity === 'high'
                    ? 'bg-destructive/5 border-destructive'
                    : alert.severity === 'medium'
                    ? 'bg-warning/5 border-warning'
                    : 'bg-primary/5 border-primary'
                }`}
              >
                <div className="flex items-start gap-3">
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{alert.title}</span>
                      {getSeverityBadge(alert.severity)}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{alert.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.timestamp}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
