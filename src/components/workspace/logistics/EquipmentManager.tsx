import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Plus, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EquipmentManagerProps {
  workspaceId: string;
}

type EquipmentStatus = 'available' | 'in_use' | 'maintenance' | 'reserved';

export function EquipmentManager({ workspaceId }: EquipmentManagerProps) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '1',
    status: 'available' as EquipmentStatus,
  });

  const { data: equipment = [], isLoading } = useQuery({
    queryKey: ['logistics-equipment', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_resources')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('type', 'equipment');
      if (error) throw error;
      return data;
    },
  });

  const addEquipment = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('workspace_resources').insert({
        workspace_id: workspaceId,
        name: data.name,
        type: 'equipment',
        quantity: parseInt(data.quantity),
        available: data.status === 'available' ? parseInt(data.quantity) : 0,
        status: data.status,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-equipment', workspaceId] });
      setFormData({ name: '', quantity: '1', status: 'available' });
      setIsAdding(false);
      toast.success('Equipment added');
    },
    onError: () => toast.error('Failed to add equipment'),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: EquipmentStatus }) => {
      const { error } = await supabase
        .from('workspace_resources')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-equipment', workspaceId] });
      toast.success('Status updated');
    },
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'available':
        return { label: 'Available', variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' };
      case 'in_use':
        return { label: 'In Use', variant: 'secondary' as const, icon: Clock, color: 'text-blue-600' };
      case 'maintenance':
        return { label: 'Maintenance', variant: 'destructive' as const, icon: AlertTriangle, color: 'text-amber-600' };
      case 'reserved':
        return { label: 'Reserved', variant: 'outline' as const, icon: Clock, color: 'text-purple-600' };
      default:
        return { label: status, variant: 'secondary' as const, icon: Package, color: 'text-muted-foreground' };
    }
  };

  if (isLoading) {
    return <Card><CardContent className="p-6"><p>Loading equipment...</p></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Equipment Manager
        </CardTitle>
        <Button size="sm" onClick={() => setIsAdding(!isAdding)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Equipment
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding && (
          <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
            <Input
              placeholder="Equipment name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                min="1"
                placeholder="Quantity"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as EquipmentStatus })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="in_use">In Use</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => addEquipment.mutate(formData)} disabled={!formData.name}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {equipment.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No equipment added yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {equipment.map((item) => {
              const config = getStatusConfig(item.status);
              return (
                <div
                  key={item.id}
                  className="p-3 border rounded-lg flex items-center justify-between hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Package className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity} • Available: {item.available}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={config.variant}>
                      <config.icon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                    <Select
                      value={item.status}
                      onValueChange={(value) => updateStatus.mutate({ id: item.id, status: value as EquipmentStatus })}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="in_use">In Use</SelectItem>
                        <SelectItem value="reserved">Reserved</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
