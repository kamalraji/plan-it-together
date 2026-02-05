import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  useLogisticsVenues, 
  useCreateVenue, 
  useUpdateVenue, 
  useDeleteVenue 
} from '@/hooks/useLogisticsCommitteeData';
import { 
  MapPin, 
  Plus, 
  Clock, 
  CheckCircle,
  Trash2,
  Users,
  Building
} from 'lucide-react';

interface AddVenueTabProps {
  workspaceId: string;
}

type VenueStatus = 'pending' | 'confirmed' | 'setup_complete' | 'ready';

const statusConfig: Record<VenueStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof MapPin }> = {
  pending: { label: 'Pending', variant: 'secondary', icon: Clock },
  confirmed: { label: 'Confirmed', variant: 'default', icon: CheckCircle },
  setup_complete: { label: 'Setup Complete', variant: 'outline', icon: Building },
  ready: { label: 'Ready', variant: 'outline', icon: CheckCircle },
};

export function AddVenueTab({ workspaceId }: AddVenueTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    capacity: 100,
    address: '',
    status: 'pending' as VenueStatus,
    notes: '',
  });

  const { data: venues, isLoading } = useLogisticsVenues(workspaceId);
  const createVenue = useCreateVenue(workspaceId);
  const updateVenue = useUpdateVenue(workspaceId);
  const deleteVenue = useDeleteVenue(workspaceId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createVenue.mutate(formData, {
      onSuccess: () => {
        setFormData({ name: '', capacity: 100, address: '', status: 'pending', notes: '' });
        setIsAdding(false);
      },
    });
  };

  const stats = {
    pending: venues?.filter(v => v.status === 'pending').length || 0,
    confirmed: venues?.filter(v => v.status === 'confirmed').length || 0,
    setupComplete: venues?.filter(v => v.status === 'setup_complete').length || 0,
    ready: venues?.filter(v => v.status === 'ready').length || 0,
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading venues...</div>;
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
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-info" />
              <div>
                <p className="text-2xl font-bold">{stats.confirmed}</p>
                <p className="text-sm text-muted-foreground">Confirmed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Building className="h-8 w-8 text-warning" />
              <div>
                <p className="text-2xl font-bold">{stats.setupComplete}</p>
                <p className="text-sm text-muted-foreground">Setup Complete</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold">{stats.ready}</p>
                <p className="text-sm text-muted-foreground">Ready</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Venue Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Venue Management
          </CardTitle>
          <Button onClick={() => setIsAdding(!isAdding)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Venue
          </Button>
        </CardHeader>
        <CardContent>
          {isAdding && (
            <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 border rounded-lg bg-muted/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Venue Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Main Hall, Breakout Room A"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 100 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address / Location</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g., 123 Convention Blvd, Floor 2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: VenueStatus) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="setup_complete">Setup Complete</SelectItem>
                      <SelectItem value="ready">Ready</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Notes / Requirements</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Special requirements, setup notes, etc."
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createVenue.isPending}>
                  {createVenue.isPending ? 'Adding...' : 'Add Venue'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Venues List */}
          {!venues?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No venues added yet</p>
              <p className="text-sm">Add your first venue to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {venues.map((venue) => {
                const status = (venue.status as VenueStatus) || 'pending';
                const config = statusConfig[status];
                const StatusIcon = config.icon;
                const metadata = venue.metadata as { address?: string; notes?: string } | null;

                return (
                  <Card key={venue.id} className="relative">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <StatusIcon className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{venue.name}</p>
                            {metadata?.address && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {metadata.address}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => deleteVenue.mutate(venue.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={config.variant}>{config.label}</Badge>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {venue.quantity} capacity
                          </span>
                        </div>
                      </div>
                      {metadata?.notes && (
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                          {metadata.notes}
                        </p>
                      )}
                      <div className="mt-3">
                        <Select
                          value={status}
                          onValueChange={(value) => updateVenue.mutate({ id: venue.id, status: value })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Update status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="setup_complete">Setup Complete</SelectItem>
                            <SelectItem value="ready">Ready</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
