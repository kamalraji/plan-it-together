import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Network, Wifi, Globe, Router, Activity, ArrowUpDown, RefreshCw } from 'lucide-react';

interface NetworkStatusTabProps {
  workspaceId: string;
}

const networkDevices = [
  { name: 'Main Router', type: 'router', status: 'online', ip: '192.168.1.1', bandwidth: '945 Mbps', latency: '2ms' },
  { name: 'Core Switch A', type: 'switch', status: 'online', ip: '192.168.1.2', bandwidth: '10 Gbps', latency: '1ms' },
  { name: 'Core Switch B', type: 'switch', status: 'online', ip: '192.168.1.3', bandwidth: '10 Gbps', latency: '1ms' },
  { name: 'WiFi AP - Main Hall', type: 'ap', status: 'online', ip: '192.168.1.10', bandwidth: '1.2 Gbps', latency: '5ms' },
  { name: 'WiFi AP - Conference', type: 'ap', status: 'degraded', ip: '192.168.1.11', bandwidth: '450 Mbps', latency: '15ms' },
  { name: 'Firewall', type: 'firewall', status: 'online', ip: '192.168.1.254', bandwidth: '2 Gbps', latency: '3ms' },
];

const connections = [
  { name: 'Internet Primary', provider: 'ISP-1', status: 'active', speed: '1 Gbps', usage: 67 },
  { name: 'Internet Backup', provider: 'ISP-2', status: 'standby', speed: '500 Mbps', usage: 0 },
  { name: 'VPN Tunnel', provider: 'Corporate', status: 'active', speed: '100 Mbps', usage: 23 },
];

export function NetworkStatusTab({ workspaceId: _workspaceId }: NetworkStatusTabProps) {
  const onlineDevices = networkDevices.filter(d => d.status === 'online').length;
  const degradedDevices = networkDevices.filter(d => d.status === 'degraded').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Network Status</h2>
          <p className="text-muted-foreground">Monitor network infrastructure and connectivity</p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Network className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{networkDevices.length}</p>
                <p className="text-sm text-muted-foreground">Total Devices</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold text-emerald-500">{onlineDevices}</p>
                <p className="text-sm text-muted-foreground">Online</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Wifi className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold text-amber-500">{degradedDevices}</p>
                <p className="text-sm text-muted-foreground">Degraded</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ArrowUpDown className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-500">67%</p>
                <p className="text-sm text-muted-foreground">Bandwidth Used</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* WAN Connections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            WAN Connections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {connections.map((conn) => (
              <div key={conn.name} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${conn.status === 'active' ? 'bg-emerald-500' : 'bg-muted'}`} />
                  <div>
                    <p className="font-medium">{conn.name}</p>
                    <p className="text-xs text-muted-foreground">{conn.provider}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{conn.speed}</p>
                    <p className="text-xs text-muted-foreground">{conn.usage}% used</p>
                  </div>
                  <Badge variant={conn.status === 'active' ? 'default' : 'secondary'}>
                    {conn.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Network Devices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Router className="h-5 w-5" />
            Network Devices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {networkDevices.map((device) => (
              <div key={device.name} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <div>
                    <p className="font-medium text-sm">{device.name}</p>
                    <p className="text-xs text-muted-foreground">{device.ip}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium">{device.bandwidth}</p>
                  <p className="text-xs text-muted-foreground">{device.latency}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
