import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Plus, Truck, MapPin, Clock, CheckCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ShipmentTrackerProps {
  workspaceId: string;
}

type ShipmentStatus = 'pending' | 'in_transit' | 'delivered' | 'delayed';

interface Shipment {
  id: string;
  name: string;
  origin: string;
  destination: string;
  status: ShipmentStatus;
  estimated_arrival: string;
  tracking_number?: string;
}

export function ShipmentTracker({ workspaceId }: ShipmentTrackerProps) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    origin: '',
    destination: '',
    status: 'pending' as ShipmentStatus,
    estimated_arrival: '',
    tracking_number: '',
  });

  // Using workspace_tasks as a proxy for shipments with metadata
  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ['logistics-shipments', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_tasks')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('role_scope', 'shipment');
      if (error) throw error;
      return data.map(task => ({
        id: task.id,
        name: task.title,
        origin: task.description?.split('|')[0] || 'Warehouse',
        destination: task.description?.split('|')[1] || 'Venue',
        status: task.status === 'DONE' ? 'delivered' : task.status === 'IN_PROGRESS' ? 'in_transit' : 'pending',
        estimated_arrival: task.due_date || '',
        tracking_number: task.description?.split('|')[2] || '',
      })) as Shipment[];
    },
  });

  const addShipment = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('workspace_tasks').insert({
        workspace_id: workspaceId,
        title: data.name,
        description: `${data.origin}|${data.destination}|${data.tracking_number}`,
        status: 'TODO',
        priority: 'medium',
        role_scope: 'shipment',
        due_date: data.estimated_arrival || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-shipments', workspaceId] });
      setFormData({ name: '', origin: '', destination: '', status: 'pending', estimated_arrival: '', tracking_number: '' });
      setIsAdding(false);
      toast.success('Shipment added');
    },
    onError: () => toast.error('Failed to add shipment'),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ShipmentStatus }) => {
      const dbStatus = status === 'delivered' ? 'DONE' : status === 'in_transit' ? 'IN_PROGRESS' : 'TODO';
      const { error } = await supabase
        .from('workspace_tasks')
        .update({ status: dbStatus })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-shipments', workspaceId] });
      toast.success('Status updated');
    },
  });

  const getStatusConfig = (status: ShipmentStatus) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', variant: 'secondary' as const, icon: Clock };
      case 'in_transit':
        return { label: 'In Transit', variant: 'default' as const, icon: Truck };
      case 'delivered':
        return { label: 'Delivered', variant: 'outline' as const, icon: CheckCircle };
      case 'delayed':
        return { label: 'Delayed', variant: 'destructive' as const, icon: Clock };
    }
  };

  if (isLoading) {
    return <Card><CardContent className="p-6"><p>Loading shipments...</p></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          Shipment Tracker
        </CardTitle>
        <Button size="sm" onClick={() => setIsAdding(!isAdding)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Shipment
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding && (
          <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
            <Input
              placeholder="Shipment name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Origin"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
              />
              <Input
                placeholder="Destination"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                placeholder="ETA"
                value={formData.estimated_arrival}
                onChange={(e) => setFormData({ ...formData, estimated_arrival: e.target.value })}
              />
              <Input
                placeholder="Tracking #"
                value={formData.tracking_number}
                onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => addShipment.mutate(formData)} disabled={!formData.name}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {shipments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No shipments tracked yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shipments.map((shipment) => {
              const config = getStatusConfig(shipment.status);
              return (
                <div
                  key={shipment.id}
                  className="p-3 border rounded-lg flex items-center justify-between hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{shipment.name}</p>
                      <Badge variant={config.variant}>
                        <config.icon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {shipment.origin} → {shipment.destination}
                      </span>
                      {shipment.estimated_arrival && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          ETA: {new Date(shipment.estimated_arrival).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <Select
                    value={shipment.status}
                    onValueChange={(value) => updateStatus.mutate({ id: shipment.id, status: value as ShipmentStatus })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_transit">In Transit</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="delayed">Delayed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
