import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  useLogisticsShipments, 
  useCreateShipment, 
  useUpdateShipment, 
  useDeleteShipment 
} from '@/hooks/useLogisticsCommitteeData';
import { 
  Package, 
  Plus, 
  Truck, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  MapPin,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';

interface TrackShipmentTabProps {
  workspaceId: string;
}

type ShipmentStatus = 'pending' | 'in_transit' | 'delivered' | 'delayed';

const statusConfig: Record<ShipmentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Package }> = {
  pending: { label: 'Pending', variant: 'secondary', icon: Clock },
  in_transit: { label: 'In Transit', variant: 'default', icon: Truck },
  delivered: { label: 'Delivered', variant: 'outline', icon: CheckCircle },
  delayed: { label: 'Delayed', variant: 'destructive', icon: AlertTriangle },
};

export function TrackShipmentTab({ workspaceId }: TrackShipmentTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    item_name: '',
    carrier: '',
    tracking_number: '',
    origin: '',
    destination: '',
    eta: '',
    priority: 'normal',
  });

  const { data: shipments, isLoading } = useLogisticsShipments(workspaceId);
  const createShipment = useCreateShipment(workspaceId);
  const updateShipment = useUpdateShipment(workspaceId);
  const deleteShipment = useDeleteShipment(workspaceId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createShipment.mutate({
      ...formData,
      status: 'pending',
    }, {
      onSuccess: () => {
        setFormData({ item_name: '', carrier: '', tracking_number: '', origin: '', destination: '', eta: '', priority: 'normal' });
        setIsAdding(false);
      },
    });
  };

  const stats = {
    pending: shipments?.filter(s => s.status === 'pending').length || 0,
    inTransit: shipments?.filter(s => s.status === 'in_transit').length || 0,
    delivered: shipments?.filter(s => s.status === 'delivered').length || 0,
    delayed: shipments?.filter(s => s.status === 'delayed').length || 0,
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading shipments...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Truck className="h-8 w-8 text-info" />
              <div>
                <p className="text-2xl font-bold">{stats.inTransit}</p>
                <p className="text-sm text-muted-foreground">In Transit</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold">{stats.delivered}</p>
                <p className="text-sm text-muted-foreground">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{stats.delayed}</p>
                <p className="text-sm text-muted-foreground">Delayed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Shipment Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Shipment Tracker
          </CardTitle>
          <Button onClick={() => setIsAdding(!isAdding)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Shipment
          </Button>
        </CardHeader>
        <CardContent>
          {isAdding && (
            <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 border rounded-lg bg-muted/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="item_name">Item Name *</Label>
                  <Input
                    id="item_name"
                    value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                    placeholder="e.g., AV Equipment"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carrier">Carrier</Label>
                  <Input
                    id="carrier"
                    value={formData.carrier}
                    onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                    placeholder="e.g., FedEx, UPS"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tracking_number">Tracking Number</Label>
                  <Input
                    id="tracking_number"
                    value={formData.tracking_number}
                    onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
                    placeholder="e.g., 1Z999AA10123456784"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="origin">Origin</Label>
                  <Input
                    id="origin"
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    placeholder="e.g., Warehouse A"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination</Label>
                  <Input
                    id="destination"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    placeholder="e.g., Main Venue"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="eta">Estimated Arrival</Label>
                  <Input
                    id="eta"
                    type="datetime-local"
                    value={formData.eta}
                    onChange={(e) => setFormData({ ...formData, eta: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createShipment.isPending}>
                  {createShipment.isPending ? 'Adding...' : 'Add Shipment'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Shipments List */}
          {!shipments?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No shipments tracked yet</p>
              <p className="text-sm">Add your first shipment to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {shipments.map((shipment) => {
                const status = (shipment.status as ShipmentStatus) || 'pending';
                const config = statusConfig[status];
                const StatusIcon = config.icon;

                return (
                  <div
                    key={shipment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <StatusIcon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{shipment.item_name}</p>
                          <Badge variant={config.variant}>{config.label}</Badge>
                          {shipment.priority === 'urgent' && (
                            <Badge variant="destructive">Urgent</Badge>
                          )}
                          {shipment.priority === 'high' && (
                            <Badge variant="secondary">High Priority</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          {shipment.origin && shipment.destination && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {shipment.origin}
                              <ArrowRight className="h-3 w-3" />
                              {shipment.destination}
                            </span>
                          )}
                          {shipment.carrier && (
                            <span>• {shipment.carrier}</span>
                          )}
                          {shipment.tracking_number && (
                            <span>• #{shipment.tracking_number}</span>
                          )}
                        </div>
                        {shipment.eta && (
                          <p className="text-xs text-muted-foreground mt-1">
                            ETA: {format(new Date(shipment.eta), 'MMM d, yyyy h:mm a')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={status}
                        onValueChange={(value) => updateShipment.mutate({ id: shipment.id, status: value })}
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteShipment.mutate(shipment.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
