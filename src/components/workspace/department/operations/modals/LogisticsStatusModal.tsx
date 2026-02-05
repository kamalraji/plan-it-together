import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Truck, Package, MapPin, Clock, Loader2 } from 'lucide-react';
import { useLogisticsShipments } from '@/hooks/useLogisticsCommitteeData';

interface LogisticsStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId?: string;
}

export function LogisticsStatusModal({ open, onOpenChange, workspaceId }: LogisticsStatusModalProps) {
  const { data: shipments = [], isLoading } = useLogisticsShipments(workspaceId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-success/10 text-success border-success/30">Delivered</Badge>;
      case 'in_transit':
      case 'in-transit':
        return <Badge className="bg-info/10 text-info border-info/30">In Transit</Badge>;
      case 'pending':
        return <Badge className="bg-muted-foreground/30/10 text-muted-foreground border-gray-500/30">Pending</Badge>;
      case 'delayed':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/30">Delayed</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground">Unknown</Badge>;
    }
  };

  const getProgressValue = (status: string) => {
    switch (status) {
      case 'delivered': return 100;
      case 'in_transit':
      case 'in-transit': return 60;
      case 'delayed': return 30;
      case 'pending': return 10;
      default: return 0;
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-success';
      case 'in_transit':
      case 'in-transit': return 'bg-info';
      case 'pending': return 'bg-muted-foreground/20';
      case 'delayed': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const deliveredCount = shipments.filter(s => s.status === 'delivered').length;
  const inTransitCount = shipments.filter(s => s.status === 'in_transit' || s.status === 'in-transit').length;
  const delayedCount = shipments.filter(s => s.status === 'delayed').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-success" />
            Logistics Status - Shipment Tracking
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 py-4">
          <div className="p-3 rounded-lg bg-success/10 text-center">
            <p className="text-2xl font-bold text-success">{deliveredCount}</p>
            <p className="text-xs text-muted-foreground">Delivered</p>
          </div>
          <div className="p-3 rounded-lg bg-info/10 text-center">
            <p className="text-2xl font-bold text-info">{inTransitCount}</p>
            <p className="text-xs text-muted-foreground">In Transit</p>
          </div>
          <div className="p-3 rounded-lg bg-destructive/10 text-center">
            <p className="text-2xl font-bold text-destructive">{delayedCount}</p>
            <p className="text-xs text-muted-foreground">Delayed</p>
          </div>
        </div>

        <ScrollArea className="h-[320px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : shipments.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No shipments found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {shipments.map((shipment) => {
                const progress = getProgressValue(shipment.status || 'pending');
                return (
                  <div key={shipment.id} className="p-4 rounded-lg border border-border">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{shipment.item_name}</p>
                          <p className="text-xs text-muted-foreground">{shipment.tracking_number} • {shipment.carrier}</p>
                        </div>
                      </div>
                      {getStatusBadge(shipment.status || 'pending')}
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {shipment.origin || 'Origin'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> ETA: {shipment.eta ? new Date(shipment.eta).toLocaleDateString() : 'TBD'}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {shipment.destination || 'Destination'}
                        </span>
                      </div>
                      <div className="relative">
                        <Progress value={progress} className="h-2" />
                        <div 
                          className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getProgressColor(shipment.status || 'pending')}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
