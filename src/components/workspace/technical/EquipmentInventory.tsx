import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Monitor, Mic, Camera, Projector, Speaker, Plus, MoreVertical, Trash2, Edit, Loader2, Wifi, Lightbulb, Package } from 'lucide-react';
import { useEquipment, Equipment } from '@/hooks/useEquipment';

interface EquipmentInventoryProps {
  workspaceId: string;
  eventId?: string;
}

export function EquipmentInventory({ workspaceId, eventId }: EquipmentInventoryProps) {
  const { 
    equipment, 
    stats, 
    isLoading, 
    createEquipment, 
    updateEquipment, 
    deleteEquipment,
    createDefaultTemplate 
  } = useEquipment({ workspaceId, eventId });
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    equipmentType: 'general',
    location: '',
    serialNumber: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({ name: '', equipmentType: 'general', location: '', serialNumber: '', notes: '' });
    setEditingItem(null);
  };

  const handleAdd = async () => {
    if (!formData.name.trim()) return;
    await createEquipment.mutateAsync({
      name: formData.name,
      equipmentType: formData.equipmentType,
      location: formData.location || undefined,
      serialNumber: formData.serialNumber || undefined,
      notes: formData.notes || undefined,
    });
    resetForm();
    setIsAddOpen(false);
  };

  const handleEdit = async () => {
    if (!editingItem || !formData.name.trim()) return;
    await updateEquipment.mutateAsync({
      id: editingItem.id,
      name: formData.name,
      equipmentType: formData.equipmentType,
      location: formData.location || null,
      serialNumber: formData.serialNumber || null,
      notes: formData.notes || null,
    });
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteEquipment.mutateAsync(id);
  };

  const openEdit = (item: Equipment) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      equipmentType: item.equipmentType,
      location: item.location || '',
      serialNumber: item.serialNumber || '',
      notes: item.notes || '',
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'projector': return Projector;
      case 'audio': case 'microphone': return Mic;
      case 'camera': return Camera;
      case 'display': case 'monitor': return Monitor;
      case 'speaker': return Speaker;
      case 'network': return Wifi;
      case 'lighting': return Lightbulb;
      default: return Package;
    }
  };

  const getStatusBadge = (status: Equipment['status']) => {
    switch (status) {
      case 'passed':
        return <Badge className="bg-success/10 text-success border-success/20">Operational</Badge>;
      case 'testing':
        return <Badge className="bg-info/10 text-info border-info/20">Testing</Badge>;
      case 'pending':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Pending</Badge>;
      case 'maintenance':
        return <Badge className="bg-muted/50 text-muted-foreground border-muted">Maintenance</Badge>;
      case 'failed':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Faulty</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold text-foreground">Equipment Inventory</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.total} items • {stats.passed} operational • {stats.failed} faulty
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Equipment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Main Stage Projector"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formData.equipmentType} onValueChange={(v) => setFormData({ ...formData, equipmentType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="projector">Projector</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="display">Display</SelectItem>
                    <SelectItem value="camera">Camera</SelectItem>
                    <SelectItem value="network">Network</SelectItem>
                    <SelectItem value="lighting">Lighting</SelectItem>
                    <SelectItem value="computer">Computer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Main Hall"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Serial Number</Label>
                  <Input
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    placeholder="e.g., PRJ-001"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button onClick={handleAdd} disabled={!formData.name.trim() || createEquipment.isPending}>
                  {createEquipment.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Add Equipment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {equipment.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">No equipment added yet</p>
            <Button variant="outline" size="sm" onClick={() => createDefaultTemplate()}>
              Load Default Template
            </Button>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {equipment.map((item) => {
              const Icon = getIcon(item.equipmentType);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.location || 'No location'}
                        {item.serialNumber && ` • ${item.serialNumber}`}
                        {item.assignedToName && ` • ${item.assignedToName}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {getStatusBadge(item.status)}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(item)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive" 
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingItem} onOpenChange={(open) => !open && resetForm()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Equipment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formData.equipmentType} onValueChange={(v) => setFormData({ ...formData, equipmentType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="projector">Projector</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="display">Display</SelectItem>
                    <SelectItem value="camera">Camera</SelectItem>
                    <SelectItem value="network">Network</SelectItem>
                    <SelectItem value="lighting">Lighting</SelectItem>
                    <SelectItem value="computer">Computer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Serial Number</Label>
                  <Input
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={handleEdit} disabled={!formData.name.trim() || updateEquipment.isPending}>
                  {updateEquipment.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
