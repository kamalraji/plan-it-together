import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  useTransportSchedules, 
  useCreateTransport, 
  useUpdateTransport, 
  useDeleteTransport,
  TransportType,
  TransportStatus
} from '@/hooks/useLogisticsCommitteeData';
import { 
  Bus, 
  Plus, 
  Clock, 
  CheckCircle,
  Trash2,
  MapPin,
  Users,
  Car,
  Truck,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';

interface ScheduleTransportTabProps {
  workspaceId: string;
}

const typeConfig: Record<TransportType, { label: string; icon: typeof Bus }> = {
  shuttle: { label: 'Shuttle', icon: Bus },
  vip: { label: 'VIP', icon: Car },
  equipment: { label: 'Equipment', icon: Truck },
  staff: { label: 'Staff', icon: Users },
  cargo: { label: 'Cargo', icon: Truck },
};

const statusConfig: Record<TransportStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  scheduled: { label: 'Scheduled', variant: 'secondary' },
  in_progress: { label: 'In Progress', variant: 'default' },
  completed: { label: 'Completed', variant: 'outline' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
  delayed: { label: 'Delayed', variant: 'destructive' },
};

export function ScheduleTransportTab({ workspaceId }: ScheduleTransportTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    transport_type: 'shuttle' as TransportType,
    departure_time: '',
    pickup_location: '',
    dropoff_location: '',
    capacity: 10,
    vehicle_info: '',
    driver_name: '',
    driver_contact: '',
    notes: '',
  });

  const { data: transports, isLoading } = useTransportSchedules(workspaceId);
  const createTransport = useCreateTransport(workspaceId);
  const updateTransport = useUpdateTransport(workspaceId);
  const deleteTransport = useDeleteTransport(workspaceId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTransport.mutate({
      ...formData,
      status: 'scheduled',
      passengers_booked: 0,
    }, {
      onSuccess: () => {
        setFormData({
          name: '',
          transport_type: 'shuttle',
          departure_time: '',
          pickup_location: '',
          dropoff_location: '',
          capacity: 10,
          vehicle_info: '',
          driver_name: '',
          driver_contact: '',
          notes: '',
        });
        setIsAdding(false);
      },
    });
  };

  const stats = {
    scheduled: transports?.filter(t => t.status === 'scheduled').length || 0,
    inProgress: transports?.filter(t => t.status === 'in_progress').length || 0,
    completed: transports?.filter(t => t.status === 'completed').length || 0,
    total: transports?.length || 0,
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading transport schedules...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.scheduled}</p>
                <p className="text-sm text-muted-foreground">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Bus className="h-8 w-8 text-info" />
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Truck className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Routes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Transport Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bus className="h-5 w-5" />
            Transport Schedule
          </CardTitle>
          <Button onClick={() => setIsAdding(!isAdding)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Schedule Transport
          </Button>
        </CardHeader>
        <CardContent>
          {isAdding && (
            <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 border rounded-lg bg-muted/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Route Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Morning Shuttle Run"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transport_type">Transport Type</Label>
                  <Select
                    value={formData.transport_type}
                    onValueChange={(value: TransportType) => setFormData({ ...formData, transport_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shuttle">Shuttle</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="cargo">Cargo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="departure_time">Departure Time</Label>
                  <Input
                    id="departure_time"
                    type="datetime-local"
                    value={formData.departure_time}
                    onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pickup_location">Pickup Location</Label>
                  <Input
                    id="pickup_location"
                    value={formData.pickup_location}
                    onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
                    placeholder="e.g., Hotel Lobby"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dropoff_location">Dropoff Location</Label>
                  <Input
                    id="dropoff_location"
                    value={formData.dropoff_location}
                    onChange={(e) => setFormData({ ...formData, dropoff_location: e.target.value })}
                    placeholder="e.g., Convention Center"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 10 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicle_info">Vehicle Info</Label>
                  <Input
                    id="vehicle_info"
                    value={formData.vehicle_info}
                    onChange={(e) => setFormData({ ...formData, vehicle_info: e.target.value })}
                    placeholder="e.g., White 15-passenger van"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driver_name">Driver Name</Label>
                  <Input
                    id="driver_name"
                    value={formData.driver_name}
                    onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                    placeholder="Driver's name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driver_contact">Driver Contact</Label>
                  <Input
                    id="driver_contact"
                    value={formData.driver_contact}
                    onChange={(e) => setFormData({ ...formData, driver_contact: e.target.value })}
                    placeholder="Phone number"
                  />
                </div>
                <div className="space-y-2 md:col-span-2 lg:col-span-3">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes..."
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createTransport.isPending}>
                  {createTransport.isPending ? 'Scheduling...' : 'Schedule Transport'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Transport List */}
          {!transports?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bus className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No transport scheduled yet</p>
              <p className="text-sm">Schedule your first transport to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transports.map((transport) => {
                const type = transport.transport_type as TransportType;
                const status = transport.status as TransportStatus;
                const typeInfo = typeConfig[type] || typeConfig.shuttle;
                const statusInfo = statusConfig[status] || statusConfig.scheduled;
                const TypeIcon = typeInfo.icon;

                return (
                  <div
                    key={transport.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <TypeIcon className="h-6 w-6 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{transport.name}</p>
                          <Badge variant="outline">{typeInfo.label}</Badge>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          {transport.pickup_location && transport.dropoff_location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {transport.pickup_location}
                              <ArrowRight className="h-3 w-3" />
                              {transport.dropoff_location}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          {transport.departure_time && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(transport.departure_time), 'MMM d, h:mm a')}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {transport.passengers_booked}/{transport.capacity} booked
                          </span>
                          {transport.driver_name && (
                            <span>Driver: {transport.driver_name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={status}
                        onValueChange={(value) => updateTransport.mutate({ id: transport.id, status: value as TransportStatus })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="delayed">Delayed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTransport.mutate(transport.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
