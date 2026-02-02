import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, Zap, Clock, TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";

interface ServiceStatusTabProps {
  workspaceId: string;
}

export function ServiceStatusTab({ workspaceId: _workspaceId }: ServiceStatusTabProps) {
  const services = [
    { id: 1, name: "User Authentication", status: "operational", load: 45, requests: "12.5K/min", latency: 42, trend: "up" },
    { id: 2, name: "Payment Processing", status: "operational", load: 32, requests: "850/min", latency: 125, trend: "stable" },
    { id: 3, name: "Email Service", status: "degraded", load: 89, requests: "2.1K/min", latency: 380, trend: "down" },
    { id: 4, name: "File Storage", status: "operational", load: 58, requests: "5.2K/min", latency: 85, trend: "up" },
    { id: 5, name: "Search Engine", status: "operational", load: 41, requests: "8.7K/min", latency: 28, trend: "stable" },
    { id: 6, name: "Notification Hub", status: "maintenance", load: 0, requests: "0/min", latency: 0, trend: "stable" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "operational": return <Badge className="bg-green-500/10 text-green-600 text-xs">Operational</Badge>;
      case "degraded": return <Badge className="bg-yellow-500/10 text-yellow-600 text-xs">Degraded</Badge>;
      case "maintenance": return <Badge className="bg-blue-500/10 text-blue-600 text-xs">Maintenance</Badge>;
      case "outage": return <Badge className="bg-red-500/10 text-red-600 text-xs">Outage</Badge>;
      default: return null;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="h-3 w-3 text-green-500" />;
      case "down": return <TrendingDown className="h-3 w-3 text-red-500" />;
      default: return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getLoadColor = (load: number) => {
    if (load > 80) return "bg-red-500";
    if (load > 60) return "bg-yellow-500";
    return "bg-green-500";
  };

  const operationalCount = services.filter(s => s.status === "operational").length;
  const degradedCount = services.filter(s => s.status === "degraded").length;
  const maintenanceCount = services.filter(s => s.status === "maintenance").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Service Status</h2>
          <p className="text-sm text-muted-foreground">Real-time service monitoring</p>
        </div>
        <Button size="sm" variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-green-600">{operationalCount}</div>
            <p className="text-xs text-muted-foreground">Operational</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-yellow-600">{degradedCount}</div>
            <p className="text-xs text-muted-foreground">Degraded</p>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-blue-600">{maintenanceCount}</div>
            <p className="text-xs text-muted-foreground">Maintenance</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Active Services
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {services.map((service) => (
            <div key={service.id} className="p-3 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{service.name}</span>
                  {getStatusBadge(service.status)}
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(service.trend)}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Load</p>
                  <div className="flex items-center gap-2">
                    <Progress value={service.load} className={`h-1.5 flex-1 ${getLoadColor(service.load)}`} />
                    <span className="text-xs font-medium">{service.load}%</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Requests</p>
                  <p className="text-sm font-medium flex items-center justify-center gap-1">
                    <Zap className="h-3 w-3" />
                    {service.requests}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Latency</p>
                  <p className="text-sm font-medium flex items-center justify-end gap-1">
                    <Clock className="h-3 w-3" />
                    {service.latency}ms
                  </p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
