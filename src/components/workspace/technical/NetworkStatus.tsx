import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { 
  Wifi, WifiOff, Signal, Activity, Plus, Settings, 
  AlertTriangle, RefreshCw, Trash2, Edit, Monitor 
} from 'lucide-react';
import { useNetworkZones, NetworkZone, NetworkZoneStatus, NetworkZoneType } from '@/hooks/useNetworkZones';
import { formatDistanceToNow } from 'date-fns';

interface NetworkStatusProps {
  workspaceId: string;
}

export function NetworkStatus({ workspaceId }: NetworkStatusProps) {
  const { 
    zones, 
    stats, 
    isLoading, 
    createZone, 
    updateMetrics, 
    updateStatus, 
    updateZone,
    deleteZone 
  } = useNetworkZones(workspaceId);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<NetworkZone | null>(null);
  const [metricsZone, setMetricsZone] = useState<NetworkZone | null>(null);

  const getStatusBadge = (status: NetworkZoneStatus, hasAlert: boolean) => {
    const baseClasses = "flex items-center gap-1";
    
    switch (status) {
      case 'online':
        return (
          <Badge className={`${baseClasses} bg-success/10 text-success border-success/20`}>
            <Wifi className="h-3 w-3" />
            Online
            {hasAlert && <AlertTriangle className="h-3 w-3 ml-1" />}
          </Badge>
        );
      case 'offline':
        return (
          <Badge className={`${baseClasses} bg-destructive/10 text-destructive border-destructive/20`}>
            <WifiOff className="h-3 w-3" />
            Offline
          </Badge>
        );
      case 'degraded':
        return (
          <Badge className={`${baseClasses} bg-warning/10 text-warning border-warning/20`}>
            <Signal className="h-3 w-3" />
            Degraded
          </Badge>
        );
      case 'maintenance':
        return (
          <Badge className={`${baseClasses} bg-muted text-muted-foreground border-border`}>
            <Settings className="h-3 w-3" />
            Maintenance
          </Badge>
        );
    }
  };

  const getBandwidthColor = (bandwidth: number, threshold: number) => {
    if (bandwidth < threshold * 0.6) return 'bg-success';
    if (bandwidth < threshold) return 'bg-warning';
    return 'bg-destructive';
  };

  const getDevicePercent = (zone: NetworkZone) => 
    Math.round((zone.currentDevices / zone.maxDevices) * 100);

  const hasAlert = (zone: NetworkZone) => {
    const devicePercent = getDevicePercent(zone);
    return devicePercent >= zone.deviceAlertThreshold || 
           zone.currentBandwidthPercent >= zone.bandwidthAlertThreshold;
  };

  const handleCreateZone = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    await createZone.mutateAsync({
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
      location: formData.get('location') as string || undefined,
      zoneType: formData.get('zoneType') as NetworkZoneType || 'wifi',
      maxDevices: parseInt(formData.get('maxDevices') as string) || 100,
      maxBandwidthMbps: parseInt(formData.get('maxBandwidthMbps') as string) || 1000,
      ssid: formData.get('ssid') as string || undefined,
    });
    
    setIsCreateOpen(false);
  };

  const handleUpdateZone = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingZone) return;
    
    const formData = new FormData(e.currentTarget);
    
    await updateZone.mutateAsync({
      id: editingZone.id,
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
      location: formData.get('location') as string || undefined,
      zoneType: formData.get('zoneType') as NetworkZoneType,
      maxDevices: parseInt(formData.get('maxDevices') as string) || 100,
      maxBandwidthMbps: parseInt(formData.get('maxBandwidthMbps') as string) || 1000,
      ssid: formData.get('ssid') as string || undefined,
    });
    
    setEditingZone(null);
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading network zones...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-semibold text-foreground">Network Status</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          {stats.alertsCount > 0 && (
            <Badge variant="destructive" className="font-mono">
              {stats.alertsCount} Alert{stats.alertsCount > 1 ? 's' : ''}
            </Badge>
          )}
          <Badge variant="outline" className="font-mono">
            Live
          </Badge>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Zone
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Network Zone</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateZone} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Zone Name *</Label>
                  <Input id="name" name="name" placeholder="Main Hall WiFi" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zoneType">Type</Label>
                    <Select name="zoneType" defaultValue="wifi">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wifi">WiFi</SelectItem>
                        <SelectItem value="wired">Wired</SelectItem>
                        <SelectItem value="av">AV Network</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="guest">Guest</SelectItem>
                        <SelectItem value="backup">Backup</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" name="location" placeholder="Building A" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxDevices">Max Devices</Label>
                    <Input id="maxDevices" name="maxDevices" type="number" defaultValue={100} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxBandwidthMbps">Max Bandwidth (Mbps)</Label>
                    <Input id="maxBandwidthMbps" name="maxBandwidthMbps" type="number" defaultValue={1000} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ssid">SSID</Label>
                  <Input id="ssid" name="ssid" placeholder="EventNetwork_Main" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" name="description" placeholder="Primary network for attendees" />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createZone.isPending}>
                    {createZone.isPending ? 'Creating...' : 'Create Zone'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats Summary */}
        {zones.length > 0 && (
          <div className="grid grid-cols-4 gap-3 mb-4 p-3 rounded-lg bg-muted/30">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{stats.online}</div>
              <div className="text-xs text-muted-foreground">Online</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">{stats.offline}</div>
              <div className="text-xs text-muted-foreground">Offline</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">{stats.degraded}</div>
              <div className="text-xs text-muted-foreground">Degraded</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{stats.totalDevices}</div>
              <div className="text-xs text-muted-foreground">Devices</div>
            </div>
          </div>
        )}

        {/* Zone List */}
        <div className="space-y-4">
          {zones.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wifi className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No network zones configured</p>
              <p className="text-sm">Add zones to monitor your network infrastructure</p>
            </div>
          ) : (
            zones.map((zone) => {
              const devicePercent = getDevicePercent(zone);
              const zoneHasAlert = hasAlert(zone);
              
              return (
                <div 
                  key={zone.id} 
                  className={`p-3 rounded-lg bg-muted/50 ${zoneHasAlert ? 'ring-1 ring-warning/50' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{zone.name}</span>
                      <Badge variant="outline" className="text-xs">{zone.zoneType}</Badge>
                      {zone.location && (
                        <span className="text-xs text-muted-foreground">• {zone.location}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(zone.status, zoneHasAlert)}
                      <div className="flex gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7"
                          onClick={() => setMetricsZone(zone)}
                        >
                          <Monitor className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7"
                          onClick={() => setEditingZone(zone)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 text-destructive"
                          onClick={() => deleteZone.mutate(zone.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Bandwidth Usage</span>
                      <span>{zone.currentBandwidthPercent}%</span>
                    </div>
                    <Progress 
                      value={zone.currentBandwidthPercent} 
                      className={`h-1.5 ${getBandwidthColor(zone.currentBandwidthPercent, zone.bandwidthAlertThreshold)}`} 
                    />
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Connected Devices</span>
                      <span>{zone.currentDevices} / {zone.maxDevices}</span>
                    </div>
                    <Progress 
                      value={devicePercent} 
                      className={`h-1.5 ${getBandwidthColor(devicePercent, zone.deviceAlertThreshold)}`} 
                    />
                    
                    {zone.lastCheckedAt && (
                      <div className="text-xs text-muted-foreground mt-2">
                        Last updated {formatDistanceToNow(new Date(zone.lastCheckedAt), { addSuffix: true })}
                        {zone.lastCheckedByName && ` by ${zone.lastCheckedByName}`}
                      </div>
                    )}
                  </div>
                  
                  {/* Quick Status Actions */}
                  <div className="flex gap-1 mt-3 pt-2 border-t border-border">
                    {zone.status !== 'online' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-7"
                        onClick={() => updateStatus.mutate({ id: zone.id, status: 'online' })}
                      >
                        Mark Online
                      </Button>
                    )}
                    {zone.status !== 'degraded' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-7"
                        onClick={() => updateStatus.mutate({ id: zone.id, status: 'degraded' })}
                      >
                        Mark Degraded
                      </Button>
                    )}
                    {zone.status !== 'offline' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-7"
                        onClick={() => updateStatus.mutate({ id: zone.id, status: 'offline' })}
                      >
                        Mark Offline
                      </Button>
                    )}
                    {zone.status !== 'maintenance' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-7"
                        onClick={() => updateStatus.mutate({ id: zone.id, status: 'maintenance' })}
                      >
                        Maintenance
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>

      {/* Edit Zone Dialog */}
      <Dialog open={!!editingZone} onOpenChange={(open) => !open && setEditingZone(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Network Zone</DialogTitle>
          </DialogHeader>
          {editingZone && (
            <form onSubmit={handleUpdateZone} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Zone Name *</Label>
                <Input id="edit-name" name="name" defaultValue={editingZone.name} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-zoneType">Type</Label>
                  <Select name="zoneType" defaultValue={editingZone.zoneType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wifi">WiFi</SelectItem>
                      <SelectItem value="wired">Wired</SelectItem>
                      <SelectItem value="av">AV Network</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="guest">Guest</SelectItem>
                      <SelectItem value="backup">Backup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-location">Location</Label>
                  <Input id="edit-location" name="location" defaultValue={editingZone.location || ''} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-maxDevices">Max Devices</Label>
                  <Input id="edit-maxDevices" name="maxDevices" type="number" defaultValue={editingZone.maxDevices} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-maxBandwidthMbps">Max Bandwidth (Mbps)</Label>
                  <Input id="edit-maxBandwidthMbps" name="maxBandwidthMbps" type="number" defaultValue={editingZone.maxBandwidthMbps} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-ssid">SSID</Label>
                <Input id="edit-ssid" name="ssid" defaultValue={editingZone.ssid || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input id="edit-description" name="description" defaultValue={editingZone.description || ''} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingZone(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateZone.isPending}>
                  {updateZone.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Metrics Dialog */}
      <Dialog open={!!metricsZone} onOpenChange={(open) => !open && setMetricsZone(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Metrics - {metricsZone?.name}</DialogTitle>
          </DialogHeader>
          {metricsZone && (
            <MetricsUpdateForm 
              zone={metricsZone} 
              onUpdate={async (devices, bandwidth) => {
                await updateMetrics.mutateAsync({
                  id: metricsZone.id,
                  currentDevices: devices,
                  currentBandwidthPercent: bandwidth,
                });
                setMetricsZone(null);
              }}
              onCancel={() => setMetricsZone(null)}
              isLoading={updateMetrics.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

interface MetricsUpdateFormProps {
  zone: NetworkZone;
  onUpdate: (devices: number, bandwidth: number) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

function MetricsUpdateForm({ zone, onUpdate, onCancel, isLoading }: MetricsUpdateFormProps) {
  const [devices, setDevices] = useState(zone.currentDevices);
  const [bandwidth, setBandwidth] = useState(zone.currentBandwidthPercent);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Connected Devices</Label>
            <span className="text-sm font-mono">{devices} / {zone.maxDevices}</span>
          </div>
          <Slider
            value={[devices]}
            onValueChange={(v) => setDevices(v[0])}
            max={zone.maxDevices}
            step={1}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Bandwidth Usage</Label>
            <span className="text-sm font-mono">{bandwidth}%</span>
          </div>
          <Slider
            value={[bandwidth]}
            onValueChange={(v) => setBandwidth(v[0])}
            max={100}
            step={1}
          />
        </div>
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={() => onUpdate(devices, bandwidth)} 
          disabled={isLoading}
        >
          {isLoading ? 'Updating...' : 'Update Metrics'}
        </Button>
      </DialogFooter>
    </div>
  );
}
