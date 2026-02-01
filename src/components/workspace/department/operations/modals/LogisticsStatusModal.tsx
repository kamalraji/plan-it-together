import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Truck, Package, MapPin, Clock } from 'lucide-react';

interface LogisticsStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Shipment {
  id: string;
  item: string;
  carrier: string;
  origin: string;
  destination: string;
  status: 'delivered' | 'in-transit' | 'pending' | 'delayed';
  progress: number;
  eta: string;
}

export function LogisticsStatusModal({ open, onOpenChange }: LogisticsStatusModalProps) {
  const [shipments] = useState<Shipment[]>([
    { id: 'SHP001', item: 'AV Equipment', carrier: 'FedEx', origin: 'Los Angeles', destination: 'Venue', status: 'delivered', progress: 100, eta: 'Delivered' },
    { id: 'SHP002', item: 'Stage Decorations', carrier: 'UPS', origin: 'San Francisco', destination: 'Venue', status: 'in-transit', progress: 75, eta: '2 hours' },
    { id: 'SHP003', item: 'Promotional Materials', carrier: 'DHL', origin: 'Chicago', destination: 'Venue', status: 'in-transit', progress: 45, eta: '4 hours' },
    { id: 'SHP004', item: 'Gift Bags', carrier: 'FedEx', origin: 'New York', destination: 'Venue', status: 'pending', progress: 10, eta: 'Tomorrow' },
    { id: 'SHP005', item: 'Backup Equipment', carrier: 'Local', origin: 'Warehouse', destination: 'Venue', status: 'delayed', progress: 30, eta: 'Delayed 1hr' },
  ]);

  const getStatusBadge = (status: Shipment['status']) => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Delivered</Badge>;
      case 'in-transit':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">In Transit</Badge>;
      case 'pending':
        return <Badge className="bg-muted-foreground/30/10 text-muted-foreground border-gray-500/30">Pending</Badge>;
      case 'delayed':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/30">Delayed</Badge>;
    }
  };

  const getProgressColor = (status: Shipment['status']) => {
    switch (status) {
      case 'delivered': return 'bg-green-500';
      case 'in-transit': return 'bg-blue-500';
      case 'pending': return 'bg-muted-foreground/20';
      case 'delayed': return 'bg-red-500';
    }
  };

  const deliveredCount = shipments.filter(s => s.status === 'delivered').length;
  const inTransitCount = shipments.filter(s => s.status === 'in-transit').length;
  const delayedCount = shipments.filter(s => s.status === 'delayed').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-green-500" />
            Logistics Status - Shipment Tracking
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 py-4">
          <div className="p-3 rounded-lg bg-green-500/10 text-center">
            <p className="text-2xl font-bold text-green-600">{deliveredCount}</p>
            <p className="text-xs text-muted-foreground">Delivered</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 text-center">
            <p className="text-2xl font-bold text-blue-600">{inTransitCount}</p>
            <p className="text-xs text-muted-foreground">In Transit</p>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10 text-center">
            <p className="text-2xl font-bold text-red-600">{delayedCount}</p>
            <p className="text-xs text-muted-foreground">Delayed</p>
          </div>
        </div>

        <ScrollArea className="h-[320px] pr-4">
          <div className="space-y-3">
            {shipments.map((shipment) => (
              <div key={shipment.id} className="p-4 rounded-lg border border-border">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{shipment.item}</p>
                      <p className="text-xs text-muted-foreground">{shipment.id} • {shipment.carrier}</p>
                    </div>
                  </div>
                  {getStatusBadge(shipment.status)}
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {shipment.origin}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> ETA: {shipment.eta}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {shipment.destination}
                    </span>
                  </div>
                  <div className="relative">
                    <Progress value={shipment.progress} className="h-2" />
                    <div 
                      className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getProgressColor(shipment.status)}`}
                      style={{ width: `${shipment.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
