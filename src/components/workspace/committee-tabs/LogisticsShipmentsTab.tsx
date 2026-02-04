import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Truck,
  Plus,
  Search,
  Package,
  CheckCircle2,
  Clock,
  MapPin,
  AlertTriangle,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useLogisticsShipments, useCreateShipment } from '@/hooks/useLogisticsCommitteeData';

interface LogisticsShipmentsTabProps {
  workspaceId?: string;
}

export function LogisticsShipmentsTab({ workspaceId }: LogisticsShipmentsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  // Form state for new shipment
  const [formData, setFormData] = useState({
    tracking_number: '',
    carrier: '',
    priority: 'normal' as const,
    origin: '',
    destination: '',
    item_name: '',
    eta: '',
  });

  const { data: shipments = [], isLoading } = useLogisticsShipments(workspaceId);
  const createShipment = useCreateShipment(workspaceId || '');

  const filteredShipments = shipments.filter(s => {
    const matchesSearch = 
      (s.tracking_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.item_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.carrier || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = shipments.filter(s => s.status === 'pending').length;
  const inTransitCount = shipments.filter(s => s.status === 'in_transit' || s.status === 'out_for_delivery').length;
  const deliveredCount = shipments.filter(s => s.status === 'delivered').length;
  const delayedCount = shipments.filter(s => s.status === 'delayed').length;

  const getStatusBadge = (status: string) => {
    const config = {
      'pending': { class: 'bg-slate-500/10 text-muted-foreground border-slate-500/20', label: 'Pending', icon: Clock },
      'in_transit': { class: 'bg-blue-500/10 text-blue-600 border-blue-500/20', label: 'In Transit', icon: Truck },
      'out_for_delivery': { class: 'bg-purple-500/10 text-purple-600 border-purple-500/20', label: 'Out for Delivery', icon: Package },
      'delivered': { class: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', label: 'Delivered', icon: CheckCircle2 },
      'delayed': { class: 'bg-red-500/10 text-red-600 border-red-500/20', label: 'Delayed', icon: AlertTriangle },
    };
    const { class: className, label, icon: Icon } = config[status as keyof typeof config] || config.pending;
    return (
      <Badge variant="outline" className={cn('gap-1', className)}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const config = {
      'low': { class: 'bg-muted text-muted-foreground', label: 'Low' },
      'normal': { class: 'bg-blue-100 text-blue-600', label: 'Normal' },
      'high': { class: 'bg-amber-100 text-amber-600', label: 'High' },
      'urgent': { class: 'bg-red-100 text-red-600', label: 'Urgent' },
    };
    const { class: className, label } = config[priority as keyof typeof config] || config.normal;
    return <Badge className={className}>{label}</Badge>;
  };

  const handleAddShipment = () => {
    if (!workspaceId) return;
    
    createShipment.mutate({
      workspace_id: workspaceId,
      tracking_number: formData.tracking_number || `SHP-${Date.now()}`,
      carrier: formData.carrier,
      origin: formData.origin,
      destination: formData.destination,
      item_name: formData.item_name,
      status: 'pending',
      priority: formData.priority,
      eta: formData.eta || null,
    }, {
      onSuccess: () => {
        setIsAddOpen(false);
        setFormData({
          tracking_number: '',
          carrier: '',
          priority: 'normal',
          origin: '',
          destination: '',
          item_name: '',
          eta: '',
        });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Shipment Tracking</h2>
          <p className="text-muted-foreground">Monitor and manage all logistics shipments</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Shipment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Shipment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Tracking Number</Label>
                <Input 
                  placeholder="e.g., SHP-2024-005"
                  value={formData.tracking_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, tracking_number: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Carrier</Label>
                  <Select value={formData.carrier} onValueChange={(v) => setFormData(prev => ({ ...prev, carrier: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select carrier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FedEx">FedEx</SelectItem>
                      <SelectItem value="Blue Dart">Blue Dart</SelectItem>
                      <SelectItem value="Delhivery">Delhivery</SelectItem>
                      <SelectItem value="DTDC">DTDC</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={formData.priority} onValueChange={(v: any) => setFormData(prev => ({ ...prev, priority: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Origin</Label>
                <Input 
                  placeholder="e.g., Mumbai Warehouse"
                  value={formData.origin}
                  onChange={(e) => setFormData(prev => ({ ...prev, origin: e.target.value }))}
                />
              </div>
              <div>
                <Label>Destination</Label>
                <Input 
                  placeholder="e.g., Venue - Main Hall"
                  value={formData.destination}
                  onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                />
              </div>
              <div>
                <Label>Items</Label>
                <Textarea 
                  placeholder="Description of items being shipped"
                  value={formData.item_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, item_name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Estimated Arrival</Label>
                <Input 
                  type="datetime-local"
                  value={formData.eta}
                  onChange={(e) => setFormData(prev => ({ ...prev, eta: e.target.value }))}
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleAddShipment}
                disabled={createShipment.isPending}
              >
                {createShipment.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Add Shipment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Delayed Alert */}
      {delayedCount > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">Shipment Delays</p>
                <p className="text-sm text-red-700">
                  {delayedCount} shipment(s) are delayed. Please follow up with carriers.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-500/10">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Truck className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inTransitCount}</p>
                <p className="text-xs text-muted-foreground">In Transit</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{deliveredCount}</p>
                <p className="text-xs text-muted-foreground">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{delayedCount}</p>
                <p className="text-xs text-muted-foreground">Delayed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shipments List */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-green-500" />
              All Shipments
            </CardTitle>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search shipments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredShipments.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <h3 className="font-medium">No shipments found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery ? 'No matches found' : 'Add shipments to track your logistics'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredShipments.map((shipment) => (
                <div
                  key={shipment.id}
                  className={cn(
                    'p-4 rounded-lg border transition-colors hover:bg-muted/30',
                    shipment.status === 'delayed' && 'bg-red-50/50 border-red-200',
                    shipment.status === 'delivered' && 'bg-emerald-50/30 border-emerald-200'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-medium">{shipment.tracking_number}</span>
                        {getStatusBadge(shipment.status || 'pending')}
                        {getPriorityBadge(shipment.priority || 'normal')}
                      </div>
                      <p className="text-sm text-muted-foreground">{shipment.item_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{shipment.origin}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span>{shipment.destination}</span>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-xs text-muted-foreground">
                        {shipment.status === 'delivered' ? 'Delivered' : 'ETA'}
                      </p>
                      <p className="text-sm font-medium">
                        {shipment.actual_arrival || shipment.eta
                          ? format(new Date(shipment.actual_arrival || shipment.eta!), 'MMM d, h:mm a')
                          : 'TBD'}
                      </p>
                      <p className="text-xs text-muted-foreground">{shipment.carrier}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
