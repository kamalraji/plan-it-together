import { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Truck, Package, Clock, CheckCircle2, AlertTriangle, Plus, Loader2 } from 'lucide-react';
import {
  useLogistics,
  useCreateLogistics,
  useUpdateLogistics,
  useDeleteLogistics,
  LogisticsItem,
} from '@/hooks/useOperationsDepartmentData';
import { format } from 'date-fns';

interface LogisticsStatusTabProps {
  workspace: Workspace;
}

export function LogisticsStatusTab({ workspace }: LogisticsStatusTabProps) {
  const { data: logistics, isLoading } = useLogistics(workspace.id);
  const createLogistics = useCreateLogistics(workspace.id);
  const updateLogistics = useUpdateLogistics(workspace.id);
  const deleteLogistics = useDeleteLogistics(workspace.id);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    item_name: '',
    carrier: '',
    tracking_number: '',
    origin: '',
    destination: '',
    eta: '',
    priority: 'normal' as LogisticsItem['priority'],
  });

  const getStatusBadge = (status: LogisticsItem['status']) => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />Delivered</Badge>;
      case 'in_transit':
        return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30"><Truck className="h-3 w-3 mr-1" />In Transit</Badge>;
      case 'delayed':
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30"><AlertTriangle className="h-3 w-3 mr-1" />Delayed</Badge>;
      case 'cancelled':
        return <Badge className="bg-muted text-muted-foreground">Cancelled</Badge>;
      default:
        return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const getPriorityBadge = (priority: LogisticsItem['priority']) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30">High</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return null;
    }
  };

  const getProgressColor = (status: LogisticsItem['status']) => {
    switch (status) {
      case 'delivered':
        return 'bg-emerald-500';
      case 'delayed':
        return 'bg-red-500';
      default:
        return 'bg-primary';
    }
  };

  const handleAddItem = () => {
    if (!newItem.item_name.trim()) return;
    createLogistics.mutate({
      item_name: newItem.item_name,
      carrier: newItem.carrier || null,
      tracking_number: newItem.tracking_number || null,
      origin: newItem.origin || null,
      destination: newItem.destination || null,
      eta: newItem.eta ? new Date(newItem.eta).toISOString() : null,
      priority: newItem.priority,
      status: 'pending',
      progress: 0,
    });
    setNewItem({ item_name: '', carrier: '', tracking_number: '', origin: '', destination: '', eta: '', priority: 'normal' });
    setIsAddModalOpen(false);
  };

  const handleStatusChange = (id: string, status: LogisticsItem['status']) => {
    let progress = 0;
    if (status === 'in_transit') progress = 50;
    if (status === 'delivered') progress = 100;
    if (status === 'delayed') progress = 75;
    updateLogistics.mutate({ id, status, progress });
  };

  const deliveredCount = logistics?.filter(l => l.status === 'delivered').length || 0;
  const inTransitCount = logistics?.filter(l => l.status === 'in_transit').length || 0;
  const delayedCount = logistics?.filter(l => l.status === 'delayed').length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Logistics Status</h2>
          <p className="text-muted-foreground">Track shipments and deliveries</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Shipment
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-emerald-500/10 border-emerald-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/20 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <div className="text-3xl font-bold text-emerald-500">{deliveredCount}</div>
                <p className="text-sm text-muted-foreground">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-full">
                <Truck className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-500">{inTransitCount}</div>
                <p className="text-sm text-muted-foreground">In Transit</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/20 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <div className="text-3xl font-bold text-red-500">{delayedCount}</div>
                <p className="text-sm text-muted-foreground">Delayed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shipments List */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">All Shipments</CardTitle>
          <CardDescription>{logistics?.length || 0} total shipments</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            {logistics && logistics.length > 0 ? (
              <div className="space-y-4">
                {logistics.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h4 className="font-semibold text-foreground">{item.item_name}</h4>
                          {item.carrier && (
                            <p className="text-sm text-muted-foreground">{item.carrier} {item.tracking_number && `• ${item.tracking_number}`}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getPriorityBadge(item.priority)}
                        {getStatusBadge(item.status)}
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="text-foreground">{item.progress}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${getProgressColor(item.status)}`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                      {item.origin && item.destination && (
                        <span>{item.origin} → {item.destination}</span>
                      )}
                      {item.eta && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          ETA: {format(new Date(item.eta), 'MMM d, h:mm a')}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Select
                        value={item.status}
                        onValueChange={(value) => handleStatusChange(item.id, value as LogisticsItem['status'])}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_transit">In Transit</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="delayed">Delayed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-destructive hover:text-destructive"
                        onClick={() => deleteLogistics.mutate(item.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No shipments tracked</p>
                <p className="text-sm">Add shipments to monitor their delivery status</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Add Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Shipment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Item Name *</Label>
              <Input
                placeholder="e.g., Event Banners"
                value={newItem.item_name}
                onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Carrier</Label>
                <Input
                  placeholder="e.g., FedEx"
                  value={newItem.carrier}
                  onChange={(e) => setNewItem({ ...newItem, carrier: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tracking Number</Label>
                <Input
                  placeholder="e.g., 1234567890"
                  value={newItem.tracking_number}
                  onChange={(e) => setNewItem({ ...newItem, tracking_number: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Origin</Label>
                <Input
                  placeholder="e.g., New York"
                  value={newItem.origin}
                  onChange={(e) => setNewItem({ ...newItem, origin: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Destination</Label>
                <Input
                  placeholder="e.g., Los Angeles"
                  value={newItem.destination}
                  onChange={(e) => setNewItem({ ...newItem, destination: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ETA</Label>
                <Input
                  type="datetime-local"
                  value={newItem.eta}
                  onChange={(e) => setNewItem({ ...newItem, eta: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={newItem.priority}
                  onValueChange={(value) => setNewItem({ ...newItem, priority: value as LogisticsItem['priority'] })}
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
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddItem} disabled={createLogistics.isPending}>
              {createLogistics.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add Shipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
