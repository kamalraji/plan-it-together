import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plane, 
  Search, 
  Hotel, 
  Car, 
  Utensils,
  CheckCircle,
  Clock,
  XCircle,
  Edit
} from 'lucide-react';
import { 
  useSpeakerTravel, 
  useSpeakerLiaisonSpeakers,
  SpeakerTravel 
} from '@/hooks/useSpeakerLiaisonData';
import { TravelEditDialog } from '../../../speaker-liaison/TravelEditDialog';

interface TravelCoordinationTabProps {
  workspaceId: string;
}

export function TravelCoordinationTab({ workspaceId }: TravelCoordinationTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTravel, setSelectedTravel] = useState<{ speakerId: string; speakerName: string; travel?: SpeakerTravel } | null>(null);

  const { data: speakers = [], isLoading: loadingSpeakers } = useSpeakerLiaisonSpeakers(workspaceId);
  const { data: travelRecords = [], isLoading: loadingTravel } = useSpeakerTravel(workspaceId);

  const isLoading = loadingSpeakers || loadingTravel;

  // Combine speakers with their travel records
  const speakersWithTravel = speakers.map(speaker => {
    const travel = travelRecords.find(t => t.speaker_id === speaker.id);
    return { speaker, travel };
  });

  const filteredSpeakers = speakersWithTravel.filter(({ speaker }) =>
    speaker.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string | null | undefined) => {
    const config: Record<string, { color: string; icon: React.ElementType; label: string }> = {
      confirmed: { color: 'bg-emerald-500/10 text-emerald-600', icon: CheckCircle, label: 'Confirmed' },
      pending: { color: 'bg-amber-500/10 text-amber-600', icon: Clock, label: 'Pending' },
      not_needed: { color: 'bg-muted text-muted-foreground', icon: XCircle, label: 'N/A' },
    };
    const { color, icon: Icon, label } = config[status || 'pending'] || config.pending;
    return (
      <Badge className={`${color} text-[10px] gap-1`}>
        <Icon className="h-2.5 w-2.5" />
        {label}
      </Badge>
    );
  };

  const handleEditTravel = (speakerId: string, speakerName: string, travel?: SpeakerTravel) => {
    setSelectedTravel({ speakerId, speakerName, travel });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground mt-2">Loading travel data...</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate stats
  const flightConfirmed = travelRecords.filter(t => t.flight_status === 'confirmed').length;
  const hotelConfirmed = travelRecords.filter(t => t.hotel_status === 'confirmed').length;
  const transportConfirmed = travelRecords.filter(t => t.transport_status === 'confirmed').length;

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-sky-500/10">
                <Plane className="h-5 w-5 text-sky-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{flightConfirmed}</p>
                <p className="text-xs text-muted-foreground">Flights Confirmed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Hotel className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{hotelConfirmed}</p>
                <p className="text-xs text-muted-foreground">Hotels Confirmed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Car className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{transportConfirmed}</p>
                <p className="text-xs text-muted-foreground">Transport Confirmed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Utensils className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{speakers.length}</p>
                <p className="text-xs text-muted-foreground">Total Speakers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Travel Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-primary" />
              Travel Coordination
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search speakers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-[200px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Speaker</th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">
                    <div className="flex items-center justify-center gap-1">
                      <Plane className="h-4 w-4" /> Flight
                    </div>
                  </th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">
                    <div className="flex items-center justify-center gap-1">
                      <Hotel className="h-4 w-4" /> Hotel
                    </div>
                  </th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">
                    <div className="flex items-center justify-center gap-1">
                      <Car className="h-4 w-4" /> Transport
                    </div>
                  </th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">
                    <div className="flex items-center justify-center gap-1">
                      <Utensils className="h-4 w-4" /> Meals
                    </div>
                  </th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredSpeakers.map(({ speaker, travel }) => (
                  <tr key={speaker.id} className="hover:bg-muted/30">
                    <td className="py-3 px-2">
                      <div>
                        <span className="font-medium text-sm">{speaker.name}</span>
                        {speaker.status === 'confirmed' && (
                          <Badge className="ml-2 bg-emerald-500/10 text-emerald-600 text-[10px]">
                            Confirmed
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="text-center py-3 px-2">
                      {getStatusBadge(travel?.flight_status)}
                    </td>
                    <td className="text-center py-3 px-2">
                      {getStatusBadge(travel?.hotel_status)}
                    </td>
                    <td className="text-center py-3 px-2">
                      {getStatusBadge(travel?.transport_status)}
                    </td>
                    <td className="text-center py-3 px-2">
                      {getStatusBadge(travel?.meals_status)}
                    </td>
                    <td className="text-center py-3 px-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTravel(speaker.id, speaker.name, travel)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSpeakers.length === 0 && (
            <div className="text-center py-12">
              <Plane className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No speakers found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedTravel && (
        <TravelEditDialog
          open={!!selectedTravel}
          onOpenChange={(open) => !open && setSelectedTravel(null)}
          workspaceId={workspaceId}
          speakerId={selectedTravel.speakerId}
          speakerName={selectedTravel.speakerName}
          existingTravel={selectedTravel.travel}
        />
      )}
    </div>
  );
}
