import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DoorOpen, Plus, Users, CheckCircle, Clock, Settings } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RoomManagerProps {
  workspaceId: string;
}

type RoomStatus = 'pending' | 'setup_in_progress' | 'ready' | 'in_use';
type RoomType = 'conference' | 'auditorium' | 'breakout' | 'workshop' | 'lounge';

export function RoomManager({ workspaceId }: RoomManagerProps) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'conference' as RoomType,
    capacity: '',
    floor: '',
    status: 'pending' as RoomStatus,
  });

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['facility-rooms', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_resources')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('type', 'venue');
      if (error) throw error;
      return data;
    },
  });

  const addRoom = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('workspace_resources').insert({
        workspace_id: workspaceId,
        name: data.name,
        type: 'venue',
        quantity: parseInt(data.capacity) || 0,
        available: parseInt(data.capacity) || 0,
        status: data.status,
        metadata: { roomType: data.type, floor: data.floor },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-rooms', workspaceId] });
      setFormData({ name: '', type: 'conference', capacity: '', floor: '', status: 'pending' });
      setIsAdding(false);
      toast.success('Room added');
    },
    onError: () => toast.error('Failed to add room'),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RoomStatus }) => {
      const { error } = await supabase
        .from('workspace_resources')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-rooms', workspaceId] });
      toast.success('Status updated');
    },
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', variant: 'secondary' as const, icon: Clock };
      case 'setup_in_progress':
        return { label: 'Setting Up', variant: 'default' as const, icon: Settings };
      case 'ready':
        return { label: 'Ready', variant: 'outline' as const, icon: CheckCircle };
      case 'in_use':
        return { label: 'In Use', variant: 'default' as const, icon: Users };
      default:
        return { label: status, variant: 'secondary' as const, icon: DoorOpen };
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      conference: 'Conference',
      auditorium: 'Auditorium',
      breakout: 'Breakout',
      workshop: 'Workshop',
      lounge: 'Lounge',
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return <Card><CardContent className="p-6"><p>Loading rooms...</p></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <DoorOpen className="h-5 w-5 text-primary" />
          Room Manager
        </CardTitle>
        <Button size="sm" onClick={() => setIsAdding(!isAdding)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Room
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding && (
          <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
            <Input
              placeholder="Room name (e.g., Main Hall)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as RoomType })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conference">Conference</SelectItem>
                  <SelectItem value="auditorium">Auditorium</SelectItem>
                  <SelectItem value="breakout">Breakout Room</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="lounge">Lounge</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Capacity"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Floor (e.g., 1st Floor)"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
              />
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as RoomStatus })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="setup_in_progress">Setup In Progress</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="in_use">In Use</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => addRoom.mutate(formData)} disabled={!formData.name}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {rooms.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <DoorOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No rooms added yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rooms.map((room) => {
              const config = getStatusConfig(room.status);
              const metadata = room.metadata as { roomType?: string; floor?: string } | null;
              return (
                <div
                  key={room.id}
                  className="p-3 border rounded-lg flex items-center justify-between hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <DoorOpen className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{room.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(metadata?.roomType || 'conference')}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {room.quantity}
                        </span>
                        {metadata?.floor && <span>{metadata.floor}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={config.variant}>
                      <config.icon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                    <Select
                      value={room.status}
                      onValueChange={(value) => updateStatus.mutate({ id: room.id, status: value as RoomStatus })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="setup_in_progress">Setting Up</SelectItem>
                        <SelectItem value="ready">Ready</SelectItem>
                        <SelectItem value="in_use">In Use</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
