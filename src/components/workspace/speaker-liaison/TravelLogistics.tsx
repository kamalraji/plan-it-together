import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Hotel, 
  Plane, 
  Car, 
  Utensils,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface TravelArrangement {
  speakerId: string;
  speakerName: string;
  flight: { status: 'confirmed' | 'pending' | 'not_needed'; details?: string };
  hotel: { status: 'confirmed' | 'pending' | 'not_needed'; details?: string };
  transport: { status: 'confirmed' | 'pending' | 'not_needed'; details?: string };
  meals: { status: 'confirmed' | 'pending' | 'not_needed'; details?: string };
}

export function TravelLogistics() {
  const arrangements: TravelArrangement[] = [
    {
      speakerId: '1',
      speakerName: 'Dr. Sarah Chen',
      flight: { status: 'confirmed', details: 'AA 1234, Jan 14' },
      hotel: { status: 'confirmed', details: 'Marriott, 2 nights' },
      transport: { status: 'confirmed', details: 'Airport pickup' },
      meals: { status: 'confirmed', details: 'VIP dinner' },
    },
    {
      speakerId: '2',
      speakerName: 'James Wilson',
      flight: { status: 'pending', details: 'Awaiting confirmation' },
      hotel: { status: 'confirmed', details: 'Hilton, 1 night' },
      transport: { status: 'pending' },
      meals: { status: 'not_needed' },
    },
    {
      speakerId: '3',
      speakerName: 'Maria Garcia',
      flight: { status: 'not_needed', details: 'Local speaker' },
      hotel: { status: 'not_needed' },
      transport: { status: 'pending' },
      meals: { status: 'confirmed', details: 'Speaker lunch' },
    },
    {
      speakerId: '4',
      speakerName: 'Prof. Robert Kim',
      flight: { status: 'confirmed', details: 'UA 567, Jan 15' },
      hotel: { status: 'confirmed', details: 'Marriott, 1 night' },
      transport: { status: 'confirmed', details: 'Uber voucher' },
      meals: { status: 'confirmed', details: 'All meals' },
    },
  ];

  const getStatusIcon = (status: string) => {
    if (status === 'confirmed') return <CheckCircle2 className="h-3 w-3 text-emerald-500" />;
    if (status === 'pending') return <Clock className="h-3 w-3 text-amber-500" />;
    return <span className="text-xs text-muted-foreground">—</span>;
  };

  const getStatusBg = (status: string) => {
    if (status === 'confirmed') return 'bg-emerald-500/10';
    if (status === 'pending') return 'bg-amber-500/10';
    return 'bg-muted/30';
  };

  const confirmedCount = arrangements.reduce((sum, a) => {
    return sum + [a.flight, a.hotel, a.transport, a.meals].filter(i => i.status === 'confirmed').length;
  }, 0);

  const pendingCount = arrangements.reduce((sum, a) => {
    return sum + [a.flight, a.hotel, a.transport, a.meals].filter(i => i.status === 'pending').length;
  }, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plane className="h-5 w-5 text-primary" />
              Travel & Logistics
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {confirmedCount} confirmed • {pendingCount} pending
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Column Headers */}
        <div className="grid grid-cols-5 gap-2 text-xs text-muted-foreground px-3 pb-2 border-b border-border/50">
          <span>Speaker</span>
          <span className="text-center flex items-center justify-center gap-1">
            <Plane className="h-3 w-3" /> Flight
          </span>
          <span className="text-center flex items-center justify-center gap-1">
            <Hotel className="h-3 w-3" /> Hotel
          </span>
          <span className="text-center flex items-center justify-center gap-1">
            <Car className="h-3 w-3" /> Transport
          </span>
          <span className="text-center flex items-center justify-center gap-1">
            <Utensils className="h-3 w-3" /> Meals
          </span>
        </div>

        {arrangements.map((arrangement) => (
          <div
            key={arrangement.speakerId}
            className="p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
          >
            <div className="grid grid-cols-5 gap-2 items-center">
              <span className="text-sm font-medium truncate">{arrangement.speakerName}</span>
              
              <div className={`flex flex-col items-center p-1.5 rounded ${getStatusBg(arrangement.flight.status)}`}>
                {getStatusIcon(arrangement.flight.status)}
                {arrangement.flight.details && (
                  <span className="text-[9px] text-muted-foreground text-center mt-0.5 truncate max-w-full">
                    {arrangement.flight.details}
                  </span>
                )}
              </div>
              
              <div className={`flex flex-col items-center p-1.5 rounded ${getStatusBg(arrangement.hotel.status)}`}>
                {getStatusIcon(arrangement.hotel.status)}
                {arrangement.hotel.details && (
                  <span className="text-[9px] text-muted-foreground text-center mt-0.5 truncate max-w-full">
                    {arrangement.hotel.details}
                  </span>
                )}
              </div>
              
              <div className={`flex flex-col items-center p-1.5 rounded ${getStatusBg(arrangement.transport.status)}`}>
                {getStatusIcon(arrangement.transport.status)}
                {arrangement.transport.details && (
                  <span className="text-[9px] text-muted-foreground text-center mt-0.5 truncate max-w-full">
                    {arrangement.transport.details}
                  </span>
                )}
              </div>
              
              <div className={`flex flex-col items-center p-1.5 rounded ${getStatusBg(arrangement.meals.status)}`}>
                {getStatusIcon(arrangement.meals.status)}
                {arrangement.meals.details && (
                  <span className="text-[9px] text-muted-foreground text-center mt-0.5 truncate max-w-full">
                    {arrangement.meals.details}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
