import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bus, Plus, Clock, MapPin, Users } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface TransportScheduleProps {
  workspaceId: string;
}

type TransportType = 'shuttle' | 'vip' | 'equipment' | 'staff';

export function TransportSchedule({ workspaceId }: TransportScheduleProps) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'shuttle' as TransportType,
    departure_time: '',
    pickup_location: '',
    dropoff_location: '',
    capacity: '10',
  });

  // Using workspace_milestones as transport schedule entries
  const { data: transports = [], isLoading } = useQuery({
    queryKey: ['logistics-transports', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_milestones')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('due_date', { ascending: true });
      if (error) throw error;
      return data.filter(m => m.description?.startsWith('TRANSPORT:')).map(m => {
        const parts = m.description?.replace('TRANSPORT:', '').split('|') || [];
        return {
          id: m.id,
          name: m.title,
          type: (parts[0] || 'shuttle') as TransportType,
          departure_time: m.due_date,
          pickup_location: parts[1] || '',
          dropoff_location: parts[2] || '',
          capacity: parseInt(parts[3] || '10'),
          status: m.status,
        };
      });
    },
  });

  const addTransport = useMutation({
    mutationFn: async (data: typeof formData) => {
      const description = `TRANSPORT:${data.type}|${data.pickup_location}|${data.dropoff_location}|${data.capacity}`;
      const { error } = await supabase.from('workspace_milestones').insert({
        workspace_id: workspaceId,
        title: data.name,
        description,
        due_date: data.departure_time || null,
        status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-transports', workspaceId] });
      setFormData({ name: '', type: 'shuttle', departure_time: '', pickup_location: '', dropoff_location: '', capacity: '10' });
      setIsAdding(false);
      toast.success('Transport scheduled');
    },
    onError: () => toast.error('Failed to add transport'),
  });

  const getTypeConfig = (type: TransportType) => {
    switch (type) {
      case 'shuttle':
        return { label: 'Shuttle', color: 'bg-blue-500/10 text-blue-600', icon: Bus };
      case 'vip':
        return { label: 'VIP', color: 'bg-purple-500/10 text-purple-600', icon: Users };
      case 'equipment':
        return { label: 'Equipment', color: 'bg-amber-500/10 text-amber-600', icon: Bus };
      case 'staff':
        return { label: 'Staff', color: 'bg-green-500/10 text-green-600', icon: Users };
    }
  };

  if (isLoading) {
    return <Card><CardContent className="p-6"><p>Loading schedule...</p></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Bus className="h-5 w-5 text-primary" />
          Transport Schedule
        </CardTitle>
        <Button size="sm" onClick={() => setIsAdding(!isAdding)}>
          <Plus className="h-4 w-4 mr-1" />
          Schedule
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding && (
          <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
            <Input
              placeholder="Transport name (e.g., Morning Shuttle)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as TransportType })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shuttle">Shuttle</SelectItem>
                  <SelectItem value="vip">VIP Transfer</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="datetime-local"
                value={formData.departure_time}
                onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Pickup location"
                value={formData.pickup_location}
                onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
              />
              <Input
                placeholder="Dropoff location"
                value={formData.dropoff_location}
                onChange={(e) => setFormData({ ...formData, dropoff_location: e.target.value })}
              />
            </div>
            <Input
              type="number"
              min="1"
              placeholder="Capacity"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => addTransport.mutate(formData)} disabled={!formData.name}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {transports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bus className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No transport scheduled yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transports.map((transport) => {
              const config = getTypeConfig(transport.type);
              return (
                <div
                  key={transport.id}
                  className="p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{transport.name}</p>
                      <Badge variant="outline" className={config.color}>
                        {config.label}
                      </Badge>
                    </div>
                    <Badge variant={transport.status === 'completed' ? 'default' : 'secondary'}>
                      {transport.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {transport.departure_time
                        ? format(new Date(transport.departure_time), 'MMM d, h:mm a')
                        : 'TBD'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Capacity: {transport.capacity}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{transport.pickup_location || 'TBD'}</span>
                    <span>→</span>
                    <span>{transport.dropoff_location || 'TBD'}</span>
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
