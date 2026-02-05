import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Hotel, 
  Plane, 
  Car, 
  Utensils,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react';
import { useSpeakerTravel, useSpeakerLiaisonSpeakers } from '@/hooks/useSpeakerLiaisonData';
import { Workspace } from '@/types';
import { TravelEditDialog } from './TravelEditDialog';

interface TravelLogisticsProps {
  workspace?: Workspace;
}

interface TravelArrangement {
  speakerId: string;
  speakerName: string;
  flight: { status: string; details?: string };
  hotel: { status: string; details?: string };
  transport: { status: string; details?: string };
  meals: { status: string; details?: string };
}

export function TravelLogistics({ workspace }: TravelLogisticsProps) {
  const { data: travelData = [], isLoading: travelLoading } = useSpeakerTravel(workspace?.id);
  const { data: speakers = [], isLoading: speakersLoading } = useSpeakerLiaisonSpeakers(workspace?.id);
  const [editingSpeakerId, setEditingSpeakerId] = useState<string | null>(null);

  const isLoading = travelLoading || speakersLoading;

  // Combine speakers with their travel data
  const arrangements: TravelArrangement[] = speakers.map(speaker => {
    const travel = travelData.find(t => t.speaker_id === speaker.id);
    return {
      speakerId: speaker.id,
      speakerName: speaker.name,
      flight: { 
        status: travel?.flight_status || 'not_needed', 
        details: travel?.flight_details || undefined 
      },
      hotel: { 
        status: travel?.hotel_status || 'not_needed', 
        details: travel?.hotel_details || undefined 
      },
      transport: { 
        status: travel?.transport_status || 'not_needed', 
        details: travel?.transport_details || undefined 
      },
      meals: { 
        status: travel?.meals_status || 'not_needed', 
        details: travel?.meals_details || undefined 
      },
    };
  });

  const getStatusIcon = (status: string) => {
    if (status === 'confirmed') return <CheckCircle2 className="h-3 w-3 text-emerald-500" />;
    if (status === 'pending') return <Clock className="h-3 w-3 text-warning" />;
    return <span className="text-xs text-muted-foreground">—</span>;
  };

  const getStatusBg = (status: string) => {
    if (status === 'confirmed') return 'bg-emerald-500/10';
    if (status === 'pending') return 'bg-warning/10';
    return 'bg-muted/30';
  };

  const confirmedCount = arrangements.reduce((sum, a) => {
    return sum + [a.flight, a.hotel, a.transport, a.meals].filter(i => i.status === 'confirmed').length;
  }, 0);

  const pendingCount = arrangements.reduce((sum, a) => {
    return sum + [a.flight, a.hotel, a.transport, a.meals].filter(i => i.status === 'pending').length;
  }, 0);

  const selectedTravel = editingSpeakerId 
    ? travelData.find(t => t.speaker_id === editingSpeakerId)
    : null;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
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
          {arrangements.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No speakers to manage travel for
            </div>
          ) : (
            <>
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
                  className="p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setEditingSpeakerId(arrangement.speakerId)}
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
            </>
          )}
        </CardContent>
      </Card>

      <TravelEditDialog
        open={!!editingSpeakerId}
        onOpenChange={(open) => !open && setEditingSpeakerId(null)}
        workspaceId={workspace?.id}
        speakerId={editingSpeakerId}
        speakerName={arrangements.find(a => a.speakerId === editingSpeakerId)?.speakerName}
        existingTravel={selectedTravel}
      />
    </>
  );
}
