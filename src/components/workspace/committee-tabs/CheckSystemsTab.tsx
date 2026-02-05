import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Monitor, Server, Database, Wifi, CheckCircle, AlertTriangle, XCircle, Play, RefreshCw } from "lucide-react";

interface CheckSystemsTabProps {
  workspaceId: string;
}

export function CheckSystemsTab({ workspaceId: _workspaceId }: CheckSystemsTabProps) {
  const systemChecks = [
    { id: 1, name: "Web Server", type: "server", status: "healthy", lastCheck: "2 min ago", uptime: 99.9, responseTime: 45 },
    { id: 2, name: "Database Cluster", type: "database", status: "healthy", lastCheck: "1 min ago", uptime: 99.8, responseTime: 12 },
    { id: 3, name: "API Gateway", type: "server", status: "warning", lastCheck: "3 min ago", uptime: 98.5, responseTime: 120 },
    { id: 4, name: "CDN Network", type: "network", status: "healthy", lastCheck: "1 min ago", uptime: 99.99, responseTime: 8 },
    { id: 5, name: "Auth Service", type: "server", status: "critical", lastCheck: "5 min ago", uptime: 95.2, responseTime: 450 },
    { id: 6, name: "Cache Layer", type: "database", status: "healthy", lastCheck: "2 min ago", uptime: 99.7, responseTime: 3 },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy": return <CheckCircle className="h-4 w-4 text-success" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "critical": return <XCircle className="h-4 w-4 text-destructive" />;
      default: return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "server": return <Server className="h-4 w-4" />;
      case "database": return <Database className="h-4 w-4" />;
      case "network": return <Wifi className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy": return <Badge className="bg-success/10 text-success text-xs">Healthy</Badge>;
      case "warning": return <Badge className="bg-warning/10 text-warning text-xs">Warning</Badge>;
      case "critical": return <Badge className="bg-destructive/10 text-destructive text-xs">Critical</Badge>;
      default: return null;
    }
  };

  const healthyCount = systemChecks.filter(s => s.status === "healthy").length;
  const warningCount = systemChecks.filter(s => s.status === "warning").length;
  const criticalCount = systemChecks.filter(s => s.status === "critical").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">System Health Check</h2>
          <p className="text-sm text-muted-foreground">Monitor all system components</p>
        </div>
        <Button size="sm">
          <Play className="h-4 w-4 mr-2" />
          Run All Checks
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-success/20 bg-success/5">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-success">{healthyCount}</div>
            <p className="text-xs text-muted-foreground">Healthy</p>
          </CardContent>
        </Card>
        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-warning">{warningCount}</div>
            <p className="text-xs text-muted-foreground">Warning</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-destructive">{criticalCount}</div>
            <p className="text-xs text-muted-foreground">Critical</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">System Components</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {systemChecks.map((system) => (
            <div key={system.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  {getTypeIcon(system.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{system.name}</span>
                    {getStatusIcon(system.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">Last check: {system.lastCheck}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Uptime</p>
                  <p className="text-sm font-medium">{system.uptime}%</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Response</p>
                  <p className="text-sm font-medium">{system.responseTime}ms</p>
                </div>
                {getStatusBadge(system.status)}
                <Button variant="ghost" size="sm">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
