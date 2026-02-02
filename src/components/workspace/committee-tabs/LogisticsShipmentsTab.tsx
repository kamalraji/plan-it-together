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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface LogisticsShipmentsTabProps {
  workspaceId?: string;
}

interface Shipment {
  id: string;
  trackingNumber: string;
  carrier: string;
  origin: string;
  destination: string;
  items: string;
  status: 'pending' | 'in-transit' | 'out-for-delivery' | 'delivered' | 'delayed';
  estimatedArrival: string;
  actualArrival?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

// Mock data for demonstration
const mockShipments: Shipment[] = [
  {
    id: '1',
    trackingNumber: 'SHP-2024-001',
    carrier: 'FedEx',
    origin: 'Mumbai Warehouse',
    destination: 'Venue - Main Hall',
    items: 'AV Equipment (Projectors x2, Screens x4)',
    status: 'in-transit',
    estimatedArrival: '2024-02-15T10:00:00',
    priority: 'high',
  },
  {
    id: '2',
    trackingNumber: 'SHP-2024-002',
    carrier: 'Blue Dart',
    origin: 'Bangalore Office',
    destination: 'Venue - Conference Room A',
    items: 'Marketing Materials (Banners x10, Standees x5)',
    status: 'delivered',
    estimatedArrival: '2024-02-14T14:00:00',
    actualArrival: '2024-02-14T13:45:00',
    priority: 'normal',
  },
  {
    id: '3',
    trackingNumber: 'SHP-2024-003',
    carrier: 'DTDC',
    origin: 'Delhi Supplier',
    destination: 'Venue - Back Stage',
    items: 'Stage Props, Lighting Equipment',
    status: 'delayed',
    estimatedArrival: '2024-02-14T09:00:00',
    priority: 'urgent',
  },
  {
    id: '4',
    trackingNumber: 'SHP-2024-004',
    carrier: 'Delhivery',
    origin: 'Chennai Vendor',
    destination: 'Venue - Kitchen Area',
    items: 'Catering Equipment (Chafing Dishes x20)',
    status: 'pending',
    estimatedArrival: '2024-02-16T08:00:00',
    priority: 'normal',
  },
];

export function LogisticsShipmentsTab({ workspaceId: _workspaceId }: LogisticsShipmentsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [shipments] = useState<Shipment[]>(mockShipments);

  const filteredShipments = shipments.filter(s => {
    const matchesSearch = 
      s.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.items.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.carrier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = shipments.filter(s => s.status === 'pending').length;
  const inTransitCount = shipments.filter(s => s.status === 'in-transit' || s.status === 'out-for-delivery').length;
  const deliveredCount = shipments.filter(s => s.status === 'delivered').length;
  const delayedCount = shipments.filter(s => s.status === 'delayed').length;

  const getStatusBadge = (status: string) => {
    const config = {
      'pending': { class: 'bg-slate-500/10 text-muted-foreground border-slate-500/20', label: 'Pending', icon: Clock },
      'in-transit': { class: 'bg-blue-500/10 text-blue-600 border-blue-500/20', label: 'In Transit', icon: Truck },
      'out-for-delivery': { class: 'bg-purple-500/10 text-purple-600 border-purple-500/20', label: 'Out for Delivery', icon: Package },
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
                <Input placeholder="e.g., SHP-2024-005" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Carrier</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select carrier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fedex">FedEx</SelectItem>
                      <SelectItem value="bluedart">Blue Dart</SelectItem>
                      <SelectItem value="delhivery">Delhivery</SelectItem>
                      <SelectItem value="dtdc">DTDC</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select>
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
                <Input placeholder="e.g., Mumbai Warehouse" />
              </div>
              <div>
                <Label>Destination</Label>
                <Input placeholder="e.g., Venue - Main Hall" />
              </div>
              <div>
                <Label>Items</Label>
                <Textarea placeholder="Description of items being shipped" />
              </div>
              <div>
                <Label>Estimated Arrival</Label>
                <Input type="datetime-local" />
              </div>
              <Button className="w-full">Add Shipment</Button>
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
                  <SelectItem value="in-transit">In Transit</SelectItem>
                  <SelectItem value="out-for-delivery">Out for Delivery</SelectItem>
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
                        <span className="font-mono font-medium">{shipment.trackingNumber}</span>
                        {getStatusBadge(shipment.status)}
                        {getPriorityBadge(shipment.priority)}
                      </div>
                      <p className="text-sm text-muted-foreground">{shipment.items}</p>
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
                        {format(new Date(shipment.actualArrival || shipment.estimatedArrival), 'MMM d, h:mm a')}
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
