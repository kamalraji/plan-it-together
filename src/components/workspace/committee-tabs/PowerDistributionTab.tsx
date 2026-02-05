import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { usePowerDistribution } from '@/hooks/usePowerDistribution';
import { 
  Plus, Zap, AlertTriangle, ChevronDown, ChevronRight, 
  Fuel, RefreshCw, Trash2, Battery 
} from 'lucide-react';

interface PowerDistributionTabProps {
  workspaceId: string;
}

const ZONE_TYPES = [
  { value: 'standard', label: 'Standard', icon: Zap },
  { value: 'high_power', label: 'High Power', icon: Zap },
  { value: 'backup', label: 'Backup', icon: Battery },
  { value: 'generator', label: 'Generator', icon: Fuel },
  { value: 'ups', label: 'UPS', icon: Battery },
];

const STATUS_CONFIG = {
  active: { color: 'bg-success/20 text-success', label: 'Active' },
  inactive: { color: 'bg-gray-500/20 text-muted-foreground', label: 'Inactive' },
  overloaded: { color: 'bg-destructive/20 text-destructive', label: 'Overloaded' },
  tripped: { color: 'bg-destructive/20 text-destructive', label: 'Tripped' },
  fault: { color: 'bg-destructive/20 text-destructive', label: 'Fault' },
  maintenance: { color: 'bg-warning/20 text-warning', label: 'Maintenance' },
  reserved: { color: 'bg-info/20 text-info', label: 'Reserved' },
};

export function PowerDistributionTab({ workspaceId }: PowerDistributionTabProps) {
  const { 
    zones, circuits, stats, isLoading,
    createZone, createCircuit, resetCircuit, deleteCircuit
  } = usePowerDistribution({ workspaceId });
  
  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set());
  const [isAddZoneOpen, setIsAddZoneOpen] = useState(false);
  const [isAddCircuitOpen, setIsAddCircuitOpen] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');

  // Zone form
  const [zoneForm, setZoneForm] = useState({
    name: '',
    location: '',
    zoneType: 'standard' as const,
    totalCapacityAmps: '',
    isGeneratorBacked: false,
    notes: '',
  });

  // Circuit form
  const [circuitForm, setCircuitForm] = useState({
    name: '',
    circuitNumber: '',
    ratedAmps: '20',
    assignedTo: '',
    notes: '',
  });

  const toggleZone = (zoneId: string) => {
    setExpandedZones(prev => {
      const next = new Set(prev);
      if (next.has(zoneId)) next.delete(zoneId);
      else next.add(zoneId);
      return next;
    });
  };

  const handleAddZone = async () => {
    await createZone({
      name: zoneForm.name,
      location: zoneForm.location,
      zoneType: zoneForm.zoneType,
      totalCapacityAmps: zoneForm.totalCapacityAmps ? parseInt(zoneForm.totalCapacityAmps) : undefined,
      isGeneratorBacked: zoneForm.isGeneratorBacked,
      notes: zoneForm.notes,
    });
    setZoneForm({ name: '', location: '', zoneType: 'standard', totalCapacityAmps: '', isGeneratorBacked: false, notes: '' });
    setIsAddZoneOpen(false);
  };

  const handleAddCircuit = async () => {
    if (!selectedZoneId) return;
    await createCircuit({
      zoneId: selectedZoneId,
      name: circuitForm.name,
      circuitNumber: circuitForm.circuitNumber,
      ratedAmps: parseInt(circuitForm.ratedAmps) || 20,
      assignedTo: circuitForm.assignedTo,
      notes: circuitForm.notes,
    });
    setCircuitForm({ name: '', circuitNumber: '', ratedAmps: '20', assignedTo: '', notes: '' });
    setIsAddCircuitOpen(false);
  };

  const getLoadColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-destructive';
    if (percentage >= 80) return 'bg-orange-500';
    if (percentage >= 60) return 'bg-warning';
    return 'bg-success';
  };

  const trippedCircuits = circuits.filter(c => c.status === 'tripped' || c.status === 'overloaded');

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Power Distribution</h2>
          <p className="text-sm text-muted-foreground">Monitor and manage power zones and circuits</p>
        </div>
        <Dialog open={isAddZoneOpen} onOpenChange={setIsAddZoneOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Zone</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Power Zone</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Zone Name *</Label>
                  <Input
                    value={zoneForm.name}
                    onChange={e => setZoneForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Main Hall Power"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={zoneForm.zoneType} onValueChange={v => setZoneForm(prev => ({ ...prev, zoneType: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ZONE_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={zoneForm.location}
                    onChange={e => setZoneForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Building A, Floor 1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Capacity (Amps)</Label>
                  <Input
                    type="number"
                    value={zoneForm.totalCapacityAmps}
                    onChange={e => setZoneForm(prev => ({ ...prev, totalCapacityAmps: e.target.value }))}
                    placeholder="100"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={zoneForm.notes}
                  onChange={e => setZoneForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddZoneOpen(false)}>Cancel</Button>
                <Button onClick={handleAddZone} disabled={!zoneForm.name}>Add Zone</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{stats.totalZones}</p>
            <p className="text-xs text-muted-foreground">Power Zones</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">{stats.activeCircuits}</p>
            <p className="text-xs text-muted-foreground">Active Circuits</p>
          </CardContent>
        </Card>
        <Card className={stats.trippedCircuits > 0 ? 'border-destructive/30 bg-destructive/5' : ''}>
          <CardContent className="p-4 text-center">
            <p className={`text-2xl font-bold ${stats.trippedCircuits > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {stats.trippedCircuits}
            </p>
            <p className="text-xs text-muted-foreground">Tripped</p>
          </CardContent>
        </Card>
        <Card className={stats.overloadedCircuits > 0 ? 'border-orange-500/30 bg-orange-500/5' : ''}>
          <CardContent className="p-4 text-center">
            <p className={`text-2xl font-bold ${stats.overloadedCircuits > 0 ? 'text-orange-600' : 'text-muted-foreground'}`}>
              {stats.overloadedCircuits}
            </p>
            <p className="text-xs text-muted-foreground">Overloaded</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.avgLoadPercentage}%</p>
            <p className="text-xs text-muted-foreground">Avg Load</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {trippedCircuits.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" /> Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {trippedCircuits.map(circuit => (
              <div key={circuit.id} className="flex items-center justify-between p-2 bg-background rounded-lg border">
                <div>
                  <p className="font-medium">{circuit.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {circuit.status === 'tripped' ? 'Circuit tripped' : `Load: ${circuit.currentLoadAmps}A (${circuit.loadPercentage}%)`}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => resetCircuit(circuit.id)}>
                  <RefreshCw className="h-4 w-4 mr-1" /> Reset
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Power Zones */}
      <div className="space-y-4">
        {zones.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No power zones configured</p>
              <p className="text-sm">Add zones to start tracking power distribution</p>
            </CardContent>
          </Card>
        ) : (
          zones.map(zone => {
            const zoneTotalLoad = zone.circuits.reduce((acc, c) => acc + c.currentLoadAmps, 0);
            const zoneLoadPercent = zone.totalCapacityAmps ? Math.round((zoneTotalLoad / zone.totalCapacityAmps) * 100) : 0;
            const isExpanded = expandedZones.has(zone.id);

            return (
              <Card key={zone.id}>
                <Collapsible open={isExpanded} onOpenChange={() => toggleZone(zone.id)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          <Zap className="h-5 w-5 text-warning" />
                          <div>
                            <CardTitle className="text-base">{zone.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {ZONE_TYPES.find(t => t.value === zone.zoneType)?.label} • {zone.location || 'No location'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={STATUS_CONFIG[zone.status].color}>
                            {STATUS_CONFIG[zone.status].label}
                          </Badge>
                          {zone.totalCapacityAmps && (
                            <span className="text-sm font-medium">
                              {zoneTotalLoad}A / {zone.totalCapacityAmps}A
                            </span>
                          )}
                          {zone.isGeneratorBacked && zone.fuelLevelPercent !== null && (
                            <div className="flex items-center gap-1">
                              <Fuel className="h-4 w-4 text-orange-500" />
                              <span className="text-sm">{zone.fuelLevelPercent}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      {zone.totalCapacityAmps && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Zone Load</span>
                            <span>{zoneLoadPercent}%</span>
                          </div>
                          <Progress value={zoneLoadPercent} className={getLoadColor(zoneLoadPercent)} />
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium">Circuits ({zone.circuits.length})</h4>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); setSelectedZoneId(zone.id); setIsAddCircuitOpen(true); }}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Circuit
                        </Button>
                      </div>

                      {zone.circuits.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No circuits in this zone</p>
                      ) : (
                        <div className="space-y-2">
                          {zone.circuits.map(circuit => (
                            <div key={circuit.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{circuit.name}</span>
                                  {circuit.circuitNumber && (
                                    <span className="text-xs text-muted-foreground">#{circuit.circuitNumber}</span>
                                  )}
                                  <Badge className={STATUS_CONFIG[circuit.status]?.color || ''} variant="outline">
                                    {circuit.status}
                                  </Badge>
                                </div>
                                {circuit.assignedTo && (
                                  <p className="text-xs text-muted-foreground">{circuit.assignedTo}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 w-32">
                                <Progress value={circuit.loadPercentage} className={`h-2 ${getLoadColor(circuit.loadPercentage)}`} />
                                <span className="text-xs w-16 text-right">{circuit.currentLoadAmps}A/{circuit.ratedAmps}A</span>
                              </div>
                              <div className="flex gap-1">
                                {circuit.status === 'tripped' && (
                                  <Button size="sm" variant="ghost" onClick={() => resetCircuit(circuit.id)}>
                                    <RefreshCw className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button size="sm" variant="ghost" onClick={() => deleteCircuit(circuit.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })
        )}
      </div>

      {/* Add Circuit Dialog */}
      <Dialog open={isAddCircuitOpen} onOpenChange={setIsAddCircuitOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Circuit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Circuit Name *</Label>
                <Input
                  value={circuitForm.name}
                  onChange={e => setCircuitForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Main Stage Lighting"
                />
              </div>
              <div className="space-y-2">
                <Label>Circuit Number</Label>
                <Input
                  value={circuitForm.circuitNumber}
                  onChange={e => setCircuitForm(prev => ({ ...prev, circuitNumber: e.target.value }))}
                  placeholder="1A"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rated Amps</Label>
                <Input
                  type="number"
                  value={circuitForm.ratedAmps}
                  onChange={e => setCircuitForm(prev => ({ ...prev, ratedAmps: e.target.value }))}
                  placeholder="20"
                />
              </div>
              <div className="space-y-2">
                <Label>Assigned To</Label>
                <Input
                  value={circuitForm.assignedTo}
                  onChange={e => setCircuitForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                  placeholder="AV Team"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddCircuitOpen(false)}>Cancel</Button>
              <Button onClick={handleAddCircuit} disabled={!circuitForm.name}>Add Circuit</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
