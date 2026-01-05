import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppWindow, Check, Clock, X } from 'lucide-react';

interface Software {
  id: string;
  name: string;
  version: string;
  license: 'active' | 'expiring' | 'expired';
  expiryDate?: string;
  seats: { used: number; total: number };
}

export function SoftwareLicenses() {
  const software: Software[] = [
    { id: '1', name: 'Badge Printing Suite', version: 'v3.2.1', license: 'active', seats: { used: 8, total: 10 } },
    { id: '2', name: 'Registration Portal', version: 'v2.0.0', license: 'active', seats: { used: 5, total: 20 } },
    { id: '3', name: 'Analytics Dashboard', version: 'v1.5.3', license: 'expiring', expiryDate: 'Jan 15, 2026', seats: { used: 3, total: 5 } },
    { id: '4', name: 'Email Campaign Tool', version: 'v4.1.0', license: 'active', seats: { used: 2, total: 5 } },
  ];

  const getLicenseBadge = (license: Software['license']) => {
    switch (license) {
      case 'active':
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <Check className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case 'expiring':
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            <Clock className="h-3 w-3 mr-1" />
            Expiring
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <X className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <AppWindow className="h-5 w-5 text-primary" />
          Software Licenses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {software.map((sw) => (
            <div key={sw.id} className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-sm font-medium text-foreground">{sw.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{sw.version}</span>
                </div>
                {getLicenseBadge(sw.license)}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Seats: {sw.seats.used} / {sw.seats.total}</span>
                {sw.expiryDate && <span>Expires: {sw.expiryDate}</span>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
