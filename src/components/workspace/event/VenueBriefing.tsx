import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, MapPin, Phone, User, Plus, Check, AlertTriangle } from 'lucide-react';

interface VenueBriefingProps {
  workspaceId?: string;
}

interface VenueZone {
  id: string;
  name: string;
  capacity: number;
  status: 'ready' | 'in-progress' | 'issue';
  contact?: string;
  notes?: string;
}

export function VenueBriefing(_props: VenueBriefingProps) {
  const venueZones: VenueZone[] = [
    { id: '1', name: 'Main Hall', capacity: 500, status: 'ready', contact: 'John M.', notes: 'Stage setup complete' },
    { id: '2', name: 'Registration Area', capacity: 100, status: 'ready', contact: 'Sarah K.' },
    { id: '3', name: 'Breakout Room A', capacity: 50, status: 'in-progress', contact: 'Mike T.', notes: 'AV pending' },
    { id: '4', name: 'Breakout Room B', capacity: 50, status: 'ready', contact: 'Mike T.' },
    { id: '5', name: 'Networking Lounge', capacity: 80, status: 'issue', contact: 'Lisa P.', notes: 'Furniture delayed' },
    { id: '6', name: 'VIP Green Room', capacity: 20, status: 'ready', contact: 'Anna W.', notes: 'Catering at 11AM' },
  ];

  const getStatusIcon = (status: VenueZone['status']) => {
    switch (status) {
      case 'ready': return <Check className="h-3 w-3" />;
      case 'in-progress': return <Building className="h-3 w-3" />;
      case 'issue': return <AlertTriangle className="h-3 w-3" />;
    }
  };

  const getStatusStyle = (status: VenueZone['status']) => {
    switch (status) {
      case 'ready': return 'bg-success/10 text-success border-success/30';
      case 'in-progress': return 'bg-info/10 text-info border-info/30';
      case 'issue': return 'bg-destructive/10 text-destructive border-destructive/30';
    }
  };

  const readyCount = venueZones.filter(z => z.status === 'ready').length;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4 text-success" />
            Venue Zones
          </CardTitle>
          <Badge variant="outline" className="text-xs gap-1">
            <Check className="h-3 w-3 text-success" />
            {readyCount}/{venueZones.length} Ready
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {venueZones.map((zone) => (
            <div
              key={zone.id}
              className="p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-accent/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-medium text-sm">{zone.name}</h4>
                <Badge variant="outline" className={`text-xs gap-1 ${getStatusStyle(zone.status)}`}>
                  {getStatusIcon(zone.status)}
                  {zone.status}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Cap: {zone.capacity}
                </span>
                {zone.contact && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {zone.contact}
                  </span>
                )}
              </div>

              {zone.notes && (
                <p className={`text-xs ${zone.status === 'issue' ? 'text-destructive' : 'text-info'}`}>
                  📌 {zone.notes}
                </p>
              )}
            </div>
          ))}
        </div>

        <Button variant="outline" size="sm" className="w-full mt-4 gap-2">
          <Plus className="h-4 w-4" />
          Add Zone
        </Button>
      </CardContent>
    </Card>
  );
}
