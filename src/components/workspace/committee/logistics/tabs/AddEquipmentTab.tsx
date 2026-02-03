import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  useLogisticsEquipment, 
  useCreateEquipment, 
  useUpdateEquipment, 
  useDeleteEquipment 
} from '@/hooks/useLogisticsCommitteeData';
import { 
  Package, 
  Plus, 
  Wrench, 
  CheckCircle,
  Trash2,
  Box
} from 'lucide-react';

interface AddEquipmentTabProps {
  workspaceId: string;
}

type EquipmentStatus = 'available' | 'in_use' | 'maintenance' | 'reserved';

const statusConfig: Record<EquipmentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Package }> = {
  available: { label: 'Available', variant: 'outline', icon: CheckCircle },
  in_use: { label: 'In Use', variant: 'default', icon: Package },
  maintenance: { label: 'Maintenance', variant: 'destructive', icon: Wrench },
  reserved: { label: 'Reserved', variant: 'secondary', icon: Box },
};

const categories = [
  { value: 'av', label: 'Audio/Visual' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'signage', label: 'Signage' },
  { value: 'tech', label: 'Technology' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'staging', label: 'Staging' },
  { value: 'general', label: 'General' },
];

export function AddEquipmentTab({ workspaceId }: AddEquipmentTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    quantity: 1,
    category: 'general',
    status: 'available',
  });

  const { data: equipment, isLoading } = useLogisticsEquipment(workspaceId);
  const createEquipment = useCreateEquipment(workspaceId);
  const updateEquipment = useUpdateEquipment(workspaceId);
  const deleteEquipment = useDeleteEquipment(workspaceId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEquipment.mutate(formData, {
      onSuccess: () => {
        setFormData({ name: '', quantity: 1, category: 'general', status: 'available' });
        setIsAdding(false);
      },
    });
  };

  const stats = {
    available: equipment?.filter(e => e.status === 'available').length || 0,
    inUse: equipment?.filter(e => e.status === 'in_use').length || 0,
    maintenance: equipment?.filter(e => e.status === 'maintenance').length || 0,
    reserved: equipment?.filter(e => e.status === 'reserved').length || 0,
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading equipment...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.available}</p>
                <p className="text-sm text-muted-foreground">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.inUse}</p>
                <p className="text-sm text-muted-foreground">In Use</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Wrench className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{stats.maintenance}</p>
                <p className="text-sm text-muted-foreground">Maintenance</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Box className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.reserved}</p>
                <p className="text-sm text-muted-foreground">Reserved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Equipment Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Equipment Inventory
          </CardTitle>
          <Button onClick={() => setIsAdding(!isAdding)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Equipment
          </Button>
        </CardHeader>
        <CardContent>
          {isAdding && (
            <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 border rounded-lg bg-muted/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Equipment Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Projector, Microphone"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Initial Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="in_use">In Use</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="reserved">Reserved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createEquipment.isPending}>
                  {createEquipment.isPending ? 'Adding...' : 'Add Equipment'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Equipment List */}
          {!equipment?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No equipment added yet</p>
              <p className="text-sm">Add your first equipment item to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {equipment.map((item) => {
                const status = (item.status as EquipmentStatus) || 'available';
                const config = statusConfig[status];
                const StatusIcon = config.icon;
                const category = (item.metadata as { category?: string })?.category || 'general';
                const categoryLabel = categories.find(c => c.value === category)?.label || 'General';

                return (
                  <Card key={item.id} className="relative">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <StatusIcon className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">{categoryLabel}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => deleteEquipment.mutate(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={config.variant}>{config.label}</Badge>
                          <span className="text-sm text-muted-foreground">
                            Qty: {item.available}/{item.quantity}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Select
                          value={status}
                          onValueChange={(value) => updateEquipment.mutate({ id: item.id, status: value })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Update status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="in_use">In Use</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="reserved">Reserved</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
