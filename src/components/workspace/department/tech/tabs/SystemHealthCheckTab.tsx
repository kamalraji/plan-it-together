import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Server, Cpu, HardDrive, MemoryStick, RefreshCw, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface SystemHealthCheckTabProps {
  workspaceId: string;
}

const systems = [
  { name: 'Primary Server', status: 'healthy', cpu: 45, memory: 62, disk: 38, uptime: '15d 4h 23m' },
  { name: 'Database Server', status: 'healthy', cpu: 28, memory: 71, disk: 45, uptime: '30d 12h 45m' },
  { name: 'Load Balancer', status: 'warning', cpu: 78, memory: 45, disk: 22, uptime: '7d 8h 12m' },
  { name: 'Cache Server', status: 'healthy', cpu: 15, memory: 34, disk: 12, uptime: '45d 2h 56m' },
  { name: 'Backup Server', status: 'critical', cpu: 92, memory: 88, disk: 85, uptime: '2d 1h 33m' },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'healthy': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
    default: return null;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'healthy': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Healthy</Badge>;
    case 'warning': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Warning</Badge>;
    case 'critical': return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Critical</Badge>;
    default: return null;
  }
};

export function SystemHealthCheckTab({ workspaceId: _workspaceId }: SystemHealthCheckTabProps) {
  const healthySystems = systems.filter(s => s.status === 'healthy').length;
  const warningSystems = systems.filter(s => s.status === 'warning').length;
  const criticalSystems = systems.filter(s => s.status === 'critical').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Health Check</h2>
          <p className="text-muted-foreground">Monitor server and infrastructure status</p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh All
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold text-emerald-500">{healthySystems}</p>
                <p className="text-sm text-muted-foreground">Healthy Systems</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold text-amber-500">{warningSystems}</p>
                <p className="text-sm text-muted-foreground">Warnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-500">{criticalSystems}</p>
                <p className="text-sm text-muted-foreground">Critical Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Systems List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Infrastructure Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {systems.map((system) => (
              <div key={system.name} className="p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(system.status)}
                    <div>
                      <p className="font-medium">{system.name}</p>
                      <p className="text-xs text-muted-foreground">Uptime: {system.uptime}</p>
                    </div>
                  </div>
                  {getStatusBadge(system.status)}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Cpu className="h-3 w-3" />
                      CPU: {system.cpu}%
                    </div>
                    <Progress value={system.cpu} className="h-1.5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MemoryStick className="h-3 w-3" />
                      Memory: {system.memory}%
                    </div>
                    <Progress value={system.memory} className="h-1.5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <HardDrive className="h-3 w-3" />
                      Disk: {system.disk}%
                    </div>
                    <Progress value={system.disk} className="h-1.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
