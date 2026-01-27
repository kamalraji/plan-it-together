import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Plus, Users, CheckCircle, Clock, Building } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VenueLogisticsProps {
  workspaceId: string;
}

type VenueStatus = 'pending' | 'confirmed' | 'setup_complete' | 'ready';

export function VenueLogistics({ workspaceId }: VenueLogisticsProps) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    address: '',
    notes: '',
    status: 'pending' as VenueStatus,
  });

  const { data: venues = [], isLoading } = useQuery({
    queryKey: ['logistics-venues', workspaceId],
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

  const addVenue = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('workspace_resources').insert({
        workspace_id: workspaceId,
        name: data.name,
        type: 'venue',
        quantity: parseInt(data.capacity) || 0,
        available: parseInt(data.capacity) || 0,
        status: data.status,
        metadata: { address: data.address, notes: data.notes },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-venues', workspaceId] });
      setFormData({ name: '', capacity: '', address: '', notes: '', status: 'pending' });
      setIsAdding(false);
      toast.success('Venue added');
    },
    onError: () => toast.error('Failed to add venue'),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: VenueStatus }) => {
      const { error } = await supabase
        .from('workspace_resources')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-venues', workspaceId] });
      toast.success('Status updated');
    },
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', variant: 'secondary' as const, icon: Clock };
      case 'confirmed':
        return { label: 'Confirmed', variant: 'default' as const, icon: CheckCircle };
      case 'setup_complete':
        return { label: 'Setup Done', variant: 'outline' as const, icon: Building };
      case 'ready':
        return { label: 'Ready', variant: 'default' as const, icon: CheckCircle };
      default:
        return { label: status, variant: 'secondary' as const, icon: MapPin };
    }
  };

  if (isLoading) {
    return <Card><CardContent className="p-6"><p>Loading venues...</p></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Venue Logistics
        </CardTitle>
        <Button size="sm" onClick={() => setIsAdding(!isAdding)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Venue
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding && (
          <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
            <Input
              placeholder="Venue name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Capacity"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              />
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as VenueStatus })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="setup_complete">Setup Complete</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
            <Textarea
              placeholder="Notes (equipment needed, access details, etc.)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => addVenue.mutate(formData)} disabled={!formData.name}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {venues.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No venues added yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {venues.map((venue) => {
              const config = getStatusConfig(venue.status);
              const metadata = venue.metadata as { address?: string; notes?: string } | null;
              return (
                <div
                  key={venue.id}
                  className="p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-primary" />
                      <p className="font-medium">{venue.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={config.variant}>
                        <config.icon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                      <Select
                        value={venue.status}
                        onValueChange={(value) => updateStatus.mutate({ id: venue.id, status: value as VenueStatus })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="setup_complete">Setup Done</SelectItem>
                          <SelectItem value="ready">Ready</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Capacity: {venue.quantity}
                    </span>
                    {metadata?.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {metadata.address}
                      </span>
                    )}
                  </div>
                  {metadata?.notes && (
                    <p className="text-sm text-muted-foreground mt-2 italic">{metadata.notes}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
