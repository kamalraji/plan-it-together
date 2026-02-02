import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface FacilityCheckModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FacilityItem {
  id: string;
  area: string;
  item: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  lastChecked: string;
  notes: string;
}

export function FacilityCheckModal({ open, onOpenChange }: FacilityCheckModalProps) {
  const [facilities, setFacilities] = useState<FacilityItem[]>([
    { id: '1', area: 'Main Hall', item: 'Fire Exits', status: 'pass', lastChecked: '08:00 AM', notes: 'All exits clear' },
    { id: '2', area: 'Main Hall', item: 'Emergency Lighting', status: 'pass', lastChecked: '08:00 AM', notes: 'Fully operational' },
    { id: '3', area: 'Main Hall', item: 'AV System', status: 'pass', lastChecked: '08:15 AM', notes: 'Sound check complete' },
    { id: '4', area: 'Lobby', item: 'Registration Desks', status: 'pass', lastChecked: '08:30 AM', notes: '6 stations ready' },
    { id: '5', area: 'Lobby', item: 'Signage', status: 'warning', lastChecked: '08:30 AM', notes: 'One sign needs adjustment' },
    { id: '6', area: 'Dining Area', item: 'HVAC', status: 'pass', lastChecked: '07:45 AM', notes: 'Temperature set to 72°F' },
    { id: '7', area: 'Dining Area', item: 'Seating Arrangement', status: 'pending', lastChecked: '-', notes: 'Setup in progress' },
    { id: '8', area: 'Restrooms', item: 'Supplies', status: 'pass', lastChecked: '07:30 AM', notes: 'Fully stocked' },
    { id: '9', area: 'Parking', item: 'Accessibility Spots', status: 'pass', lastChecked: '07:00 AM', notes: '12 spots reserved' },
    { id: '10', area: 'Parking', item: 'Valet Station', status: 'fail', lastChecked: '07:00 AM', notes: 'Canopy damaged - fixing' },
  ]);

  const getStatusIcon = (status: FacilityItem['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'pending':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
    }
  };

  const getStatusBadge = (status: FacilityItem['status']) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-500/10 text-green-600">Pass</Badge>;
      case 'fail':
        return <Badge className="bg-red-500/10 text-red-600">Fail</Badge>;
      case 'warning':
        return <Badge className="bg-amber-500/10 text-amber-600">Warning</Badge>;
      case 'pending':
        return <Badge className="bg-blue-500/10 text-blue-600">Pending</Badge>;
    }
  };

  const passCount = facilities.filter(f => f.status === 'pass').length;
  const failCount = facilities.filter(f => f.status === 'fail').length;
  const warningCount = facilities.filter(f => f.status === 'warning').length;

  const handleRecheck = (id: string) => {
    setFacilities(prev => prev.map(f => 
      f.id === id ? { ...f, status: 'pending' as const, lastChecked: 'Checking...' } : f
    ));
    
    setTimeout(() => {
      setFacilities(prev => prev.map(f => 
        f.id === id ? { ...f, status: 'pass' as const, lastChecked: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : f
      ));
      toast.success('Facility check updated');
    }, 1500);
  };

  const groupedFacilities = facilities.reduce((acc, facility) => {
    if (!acc[facility.area]) {
      acc[facility.area] = [];
    }
    acc[facility.area].push(facility);
    return acc;
  }, {} as Record<string, FacilityItem[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-500" />
            Facility Check - Safety & Setup Status
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 py-4">
          <div className="p-3 rounded-lg bg-green-500/10 text-center">
            <p className="text-2xl font-bold text-green-600">{passCount}</p>
            <p className="text-xs text-muted-foreground">Passed</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 text-center">
            <p className="text-2xl font-bold text-amber-600">{warningCount}</p>
            <p className="text-xs text-muted-foreground">Warnings</p>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10 text-center">
            <p className="text-2xl font-bold text-red-600">{failCount}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </div>
        </div>

        <ScrollArea className="h-[320px] pr-4">
          <div className="space-y-4">
            {Object.entries(groupedFacilities).map(([area, items]) => (
              <div key={area}>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">{area}</h4>
                <div className="space-y-2">
                  {items.map((facility) => (
                    <div key={facility.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(facility.status)}
                        <div>
                          <p className="font-medium">{facility.item}</p>
                          <p className="text-xs text-muted-foreground">{facility.notes}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{facility.lastChecked}</span>
                        {getStatusBadge(facility.status)}
                        {(facility.status === 'fail' || facility.status === 'warning') && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRecheck(facility.id)}
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
