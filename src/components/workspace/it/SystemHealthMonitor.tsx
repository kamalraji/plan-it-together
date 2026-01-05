import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Server, Database, Cloud, Globe, Cpu, HardDrive } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface SystemStatus {
  id: string;
  name: string;
  type: 'server' | 'database' | 'cloud' | 'network' | 'application';
  status: 'online' | 'offline' | 'degraded';
  load: number;
  uptime: string;
}

export function SystemHealthMonitor() {
  const systems: SystemStatus[] = [
    { id: '1', name: 'Registration Server', type: 'server', status: 'online', load: 45, uptime: '99.9%' },
    { id: '2', name: 'Event Database', type: 'database', status: 'online', load: 32, uptime: '99.99%' },
    { id: '3', name: 'Cloud Storage', type: 'cloud', status: 'online', load: 67, uptime: '100%' },
    { id: '4', name: 'Payment Gateway', type: 'network', status: 'degraded', load: 89, uptime: '98.5%' },
    { id: '5', name: 'Badge Printing', type: 'application', status: 'online', load: 15, uptime: '100%' },
  ];

  const getIcon = (type: SystemStatus['type']) => {
    switch (type) {
      case 'server': return Server;
      case 'database': return Database;
      case 'cloud': return Cloud;
      case 'network': return Globe;
      case 'application': return Cpu;
      default: return HardDrive;
    }
  };

  const getStatusBadge = (status: SystemStatus['status']) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-success/10 text-success border-success/20">Online</Badge>;
      case 'offline':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Offline</Badge>;
      case 'degraded':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Degraded</Badge>;
    }
  };

  const getLoadColor = (load: number) => {
    if (load < 50) return 'bg-success';
    if (load < 80) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Cpu className="h-5 w-5 text-primary" />
          System Health
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {systems.map((system) => {
            const Icon = getIcon(system.type);
            return (
              <div key={system.id} className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{system.name}</span>
                  </div>
                  {getStatusBadge(system.status)}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>CPU Load</span>
                      <span>{system.load}%</span>
                    </div>
                    <Progress value={system.load} className={`h-1.5 ${getLoadColor(system.load)}`} />
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">Uptime: </span>
                    <span className="text-xs font-medium text-foreground">{system.uptime}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
