import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpsertSpeakerTravel, SpeakerTravel } from '@/hooks/useSpeakerLiaisonData';
import { Loader2, Plane, Hotel, Car, Utensils } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TravelEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string | undefined;
  speakerId: string | null;
  speakerName?: string;
  existingTravel?: SpeakerTravel | null;
}

type TravelStatus = 'confirmed' | 'pending' | 'not_needed';

export function TravelEditDialog({
  open,
  onOpenChange,
  workspaceId,
  speakerId,
  speakerName,
  existingTravel,
}: TravelEditDialogProps) {
  const upsertTravel = useUpsertSpeakerTravel(workspaceId);

  const [formData, setFormData] = useState({
    flight_status: 'not_needed' as TravelStatus,
    flight_details: '',
    flight_number: '',
    hotel_status: 'not_needed' as TravelStatus,
    hotel_details: '',
    hotel_name: '',
    transport_status: 'not_needed' as TravelStatus,
    transport_details: '',
    transport_type: '',
    meals_status: 'not_needed' as TravelStatus,
    meals_details: '',
    dietary_requirements: '',
    notes: '',
  });

  useEffect(() => {
    if (existingTravel) {
      setFormData({
        flight_status: (existingTravel.flight_status || 'not_needed') as TravelStatus,
        flight_details: existingTravel.flight_details || '',
        flight_number: existingTravel.flight_number || '',
        hotel_status: (existingTravel.hotel_status || 'not_needed') as TravelStatus,
        hotel_details: existingTravel.hotel_details || '',
        hotel_name: existingTravel.hotel_name || '',
        transport_status: (existingTravel.transport_status || 'not_needed') as TravelStatus,
        transport_details: existingTravel.transport_details || '',
        transport_type: existingTravel.transport_type || '',
        meals_status: (existingTravel.meals_status || 'not_needed') as TravelStatus,
        meals_details: existingTravel.meals_details || '',
        dietary_requirements: existingTravel.dietary_requirements || '',
        notes: existingTravel.notes || '',
      });
    } else {
      setFormData({
        flight_status: 'not_needed',
        flight_details: '',
        flight_number: '',
        hotel_status: 'not_needed',
        hotel_details: '',
        hotel_name: '',
        transport_status: 'not_needed',
        transport_details: '',
        transport_type: '',
        meals_status: 'not_needed',
        meals_details: '',
        dietary_requirements: '',
        notes: '',
      });
    }
  }, [existingTravel, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!speakerId) return;

    await upsertTravel.mutateAsync({
      speaker_id: speakerId,
      ...formData,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Travel & Logistics</DialogTitle>
          <DialogDescription>
            Manage travel arrangements for {speakerName || 'this speaker'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="flight" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="flight" className="text-xs">
                <Plane className="h-3 w-3 mr-1" /> Flight
              </TabsTrigger>
              <TabsTrigger value="hotel" className="text-xs">
                <Hotel className="h-3 w-3 mr-1" /> Hotel
              </TabsTrigger>
              <TabsTrigger value="transport" className="text-xs">
                <Car className="h-3 w-3 mr-1" /> Transport
              </TabsTrigger>
              <TabsTrigger value="meals" className="text-xs">
                <Utensils className="h-3 w-3 mr-1" /> Meals
              </TabsTrigger>
            </TabsList>

            <TabsContent value="flight" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.flight_status}
                  onValueChange={(value: TravelStatus) =>
                    setFormData({ ...formData, flight_status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_needed">Not Needed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Flight Number</Label>
                <Input
                  value={formData.flight_number}
                  onChange={(e) => setFormData({ ...formData, flight_number: e.target.value })}
                  placeholder="AA 1234"
                />
              </div>
              <div className="space-y-2">
                <Label>Details</Label>
                <Input
                  value={formData.flight_details}
                  onChange={(e) => setFormData({ ...formData, flight_details: e.target.value })}
                  placeholder="Arriving Jan 14, 3:00 PM"
                />
              </div>
            </TabsContent>

            <TabsContent value="hotel" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.hotel_status}
                  onValueChange={(value: TravelStatus) =>
                    setFormData({ ...formData, hotel_status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_needed">Not Needed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hotel Name</Label>
                <Input
                  value={formData.hotel_name}
                  onChange={(e) => setFormData({ ...formData, hotel_name: e.target.value })}
                  placeholder="Marriott Downtown"
                />
              </div>
              <div className="space-y-2">
                <Label>Details</Label>
                <Input
                  value={formData.hotel_details}
                  onChange={(e) => setFormData({ ...formData, hotel_details: e.target.value })}
                  placeholder="2 nights, Jan 14-16"
                />
              </div>
            </TabsContent>

            <TabsContent value="transport" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.transport_status}
                  onValueChange={(value: TravelStatus) =>
                    setFormData({ ...formData, transport_status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_needed">Not Needed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Transport Type</Label>
                <Input
                  value={formData.transport_type}
                  onChange={(e) => setFormData({ ...formData, transport_type: e.target.value })}
                  placeholder="Airport pickup, Uber voucher, etc."
                />
              </div>
              <div className="space-y-2">
                <Label>Details</Label>
                <Input
                  value={formData.transport_details}
                  onChange={(e) => setFormData({ ...formData, transport_details: e.target.value })}
                  placeholder="Driver will meet at arrivals"
                />
              </div>
            </TabsContent>

            <TabsContent value="meals" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.meals_status}
                  onValueChange={(value: TravelStatus) =>
                    setFormData({ ...formData, meals_status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_needed">Not Needed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Details</Label>
                <Input
                  value={formData.meals_details}
                  onChange={(e) => setFormData({ ...formData, meals_details: e.target.value })}
                  placeholder="VIP dinner, speaker lunch"
                />
              </div>
              <div className="space-y-2">
                <Label>Dietary Requirements</Label>
                <Input
                  value={formData.dietary_requirements}
                  onChange={(e) => setFormData({ ...formData, dietary_requirements: e.target.value })}
                  placeholder="Vegetarian, gluten-free, etc."
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-2 mt-4">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about travel arrangements..."
              rows={2}
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={upsertTravel.isPending}>
              {upsertTravel.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
