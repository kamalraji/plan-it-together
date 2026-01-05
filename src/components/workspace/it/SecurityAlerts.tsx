import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, ShieldCheck, AlertTriangle, Info } from 'lucide-react';

interface SecurityAlert {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  timestamp: string;
  status: 'active' | 'investigating' | 'resolved';
}

export function SecurityAlerts() {
  const alerts: SecurityAlert[] = [
    { id: '1', title: 'Multiple failed login attempts', description: 'Detected 15 failed attempts from IP 192.168.1.xxx', severity: 'high', timestamp: '30 min ago', status: 'investigating' },
    { id: '2', title: 'SSL certificate expiring soon', description: 'Badge portal certificate expires in 7 days', severity: 'medium', timestamp: '2 hours ago', status: 'active' },
    { id: '3', title: 'Unusual data export detected', description: 'Large export from registration database', severity: 'info', timestamp: '4 hours ago', status: 'resolved' },
  ];

  const getSeverityIcon = (severity: SecurityAlert['severity']) => {
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

  const getSeverityBadge = (severity: SecurityAlert['severity']) => {
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
        <div className="space-y-3">
          {alerts.map((alert) => (
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
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">{alert.title}</span>
                    {getSeverityBadge(alert.severity)}
                  </div>
                  <p className="text-xs text-muted-foreground">{alert.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{alert.timestamp}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
