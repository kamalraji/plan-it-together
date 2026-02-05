import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DoorOpen, 
  Plus, 
  CheckCircle2, 
  Clock,
  PlayCircle,
  Loader2,
  Users,
  Building,
  Layers,
} from 'lucide-react';
import {
  useRooms,
  useAddRoom,
  useUpdateRoomStatus,
} from '@/hooks/useFacilityCommitteeData';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface RoomStatusTabProps {
  workspaceId: string;
}

const ROOM_TYPES = [
  { value: 'conference', label: 'Conference Room' },
  { value: 'auditorium', label: 'Auditorium' },
  { value: 'breakout', label: 'Breakout Room' },
  { value: 'workshop', label: 'Workshop Space' },
  { value: 'lounge', label: 'Lounge' },
  { value: 'exhibition', label: 'Exhibition Hall' },
  { value: 'registration', label: 'Registration Area' },
  { value: 'storage', label: 'Storage' },
];

const ROOM_STATUSES = [
  { value: 'pending', label: 'Pending', icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted' },
  { value: 'setup_in_progress', label: 'Setup In Progress', icon: PlayCircle, color: 'text-warning', bg: 'bg-warning/10' },
  { value: 'ready', label: 'Ready', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { value: 'in_use', label: 'In Use', icon: Users, color: 'text-info', bg: 'bg-info/10' },
];

export function RoomStatusTab({ workspaceId }: RoomStatusTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'conference',
    capacity: '',
    floor: '',
  });

  const { data: rooms, isLoading } = useRooms(workspaceId);
  const addRoom = useAddRoom(workspaceId);
  const updateStatus = useUpdateRoomStatus(workspaceId);

  const getStatusConfig = (status: string) => {
    return ROOM_STATUSES.find(s => s.value === status) || ROOM_STATUSES[0];
  };

  const getTypeLabel = (type: string) => {
    return ROOM_TYPES.find(t => t.value === type)?.label || type;
  };

  const handleCreate = () => {
    if (!formData.name.trim()) return;
    addRoom.mutate({
      name: formData.name,
      type: formData.type,
      capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
      floor: formData.floor || undefined,
    }, {
      onSuccess: () => {
        setFormData({ name: '', type: 'conference', capacity: '', floor: '' });
        setIsAdding(false);
      },
    });
  };

  // Stats
  const readyCount = rooms?.filter(r => r.status === 'ready').length || 0;
  const inUseCount = rooms?.filter(r => r.status === 'in_use').length || 0;
  const setupCount = rooms?.filter(r => r.status === 'setup_in_progress').length || 0;
  const pendingCount = rooms?.filter(r => r.status === 'pending').length || 0;
  const totalCapacity = rooms?.reduce((sum, r) => sum + (r.capacity || 0), 0) || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ready</p>
                <p className="text-2xl font-bold text-emerald-500">{readyCount}</p>
              </div>
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Use</p>
                <p className="text-2xl font-bold text-info">{inUseCount}</p>
              </div>
              <Users className="h-6 w-6 text-info" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Setting Up</p>
                <p className="text-2xl font-bold text-warning">{setupCount}</p>
              </div>
              <PlayCircle className="h-6 w-6 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Capacity</p>
                <p className="text-2xl font-bold">{totalCapacity}</p>
              </div>
              <Building className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <DoorOpen className="h-5 w-5 text-info" />
          Room Manager
        </h2>
        <Button onClick={() => setIsAdding(!isAdding)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Room
        </Button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add New Room</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1">
                <Label>Room Name *</Label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Main Conference Hall"
                />
              </div>
              <div>
                <Label>Room Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOM_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Capacity</Label>
                <Input 
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                  placeholder="Number of people"
                />
              </div>
              <div>
                <Label>Floor/Location</Label>
                <Input 
                  value={formData.floor}
                  onChange={(e) => setFormData(prev => ({ ...prev, floor: e.target.value }))}
                  placeholder="e.g., Floor 2, West Wing"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={addRoom.isPending || !formData.name.trim()}>
                {addRoom.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add Room
              </Button>
              <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rooms Grid */}
      <Card>
        <CardContent className="pt-6">
          {rooms?.length === 0 ? (
            <div className="text-center py-12">
              <DoorOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No rooms added</h3>
              <p className="text-sm text-muted-foreground">Add rooms to track their setup status.</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms?.map((room) => {
                  const statusConfig = getStatusConfig(room.status);
                  const StatusIcon = statusConfig.icon;
                  return (
                    <div
                      key={room.id}
                      className="p-4 rounded-lg border border-border hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{room.name}</h4>
                          <p className="text-xs text-muted-foreground">{getTypeLabel(room.type)}</p>
                        </div>
                        <div className={`p-2 rounded-lg ${statusConfig.bg}`}>
                          <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        {room.capacity && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {room.capacity}
                          </span>
                        )}
                        {room.floor && (
                          <span className="flex items-center gap-1">
                            <Layers className="h-3 w-3" />
                            {room.floor}
                          </span>
                        )}
                      </div>

                      <Select 
                        value={room.status}
                        onValueChange={(v) => updateStatus.mutate({ id: room.id, status: v })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROOM_STATUSES.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
