import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Crown, Plus, Pencil, Trash2, Loader2, Phone, Mail, MapPin, Clock, User, Utensils, Accessibility } from 'lucide-react';
import { format } from 'date-fns';
import {
  useVIPGuests,
  useCreateVIPGuest,
  useUpdateVIPGuest,
  useDeleteVIPGuest,
  VIPGuest,
  VIPGuestInsert,
} from '@/hooks/useEventCommitteeData';

interface VIPTrackerTabProps {
  workspaceId: string;
}

const VIP_LEVELS = [
  { value: 'standard', label: 'Standard', color: 'bg-muted text-foreground dark:bg-foreground/80 dark:text-gray-200' },
  { value: 'gold', label: 'Gold', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  { value: 'platinum', label: 'Platinum', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
];

const STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-muted text-foreground dark:bg-foreground/80 dark:text-gray-200' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { value: 'traveling', label: 'Traveling', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  { value: 'arrived', label: 'Arrived', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
  { value: 'departed', label: 'Departed', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
];

export const VIPTrackerTab: React.FC<VIPTrackerTabProps> = ({ workspaceId }) => {
  const { data: guests = [], isLoading } = useVIPGuests(workspaceId);
  const createMutation = useCreateVIPGuest();
  const updateMutation = useUpdateVIPGuest();
  const deleteMutation = useDeleteVIPGuest();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<VIPGuest | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  const [formData, setFormData] = useState({
    name: '',
    title: '',
    company: '',
    email: '',
    phone: '',
    vip_level: 'standard',
    status: 'pending',
    dietary_requirements: '',
    accessibility_needs: '',
    arrival_time: '',
    departure_time: '',
    escort_assigned: '',
    seating_assignment: '',
    notes: '',
  });

  const handleOpenDialog = (guest?: VIPGuest) => {
    if (guest) {
      setEditingGuest(guest);
      setFormData({
        name: guest.name,
        title: guest.title || '',
        company: guest.company || '',
        email: guest.email || '',
        phone: guest.phone || '',
        vip_level: guest.vip_level,
        status: guest.status,
        dietary_requirements: guest.dietary_requirements || '',
        accessibility_needs: guest.accessibility_needs || '',
        arrival_time: guest.arrival_time ? format(new Date(guest.arrival_time), "yyyy-MM-dd'T'HH:mm") : '',
        departure_time: guest.departure_time ? format(new Date(guest.departure_time), "yyyy-MM-dd'T'HH:mm") : '',
        escort_assigned: guest.escort_assigned || '',
        seating_assignment: guest.seating_assignment || '',
        notes: guest.notes || '',
      });
    } else {
      setEditingGuest(null);
      setFormData({
        name: '',
        title: '',
        company: '',
        email: '',
        phone: '',
        vip_level: 'standard',
        status: 'pending',
        dietary_requirements: '',
        accessibility_needs: '',
        arrival_time: '',
        departure_time: '',
        escort_assigned: '',
        seating_assignment: '',
        notes: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const payload: VIPGuestInsert = {
      workspace_id: workspaceId,
      event_id: null,
      name: formData.name,
      title: formData.title || null,
      company: formData.company || null,
      email: formData.email || null,
      phone: formData.phone || null,
      vip_level: formData.vip_level,
      status: formData.status,
      dietary_requirements: formData.dietary_requirements || null,
      accessibility_needs: formData.accessibility_needs || null,
      arrival_time: formData.arrival_time ? new Date(formData.arrival_time).toISOString() : null,
      departure_time: formData.departure_time ? new Date(formData.departure_time).toISOString() : null,
      escort_assigned: formData.escort_assigned || null,
      seating_assignment: formData.seating_assignment || null,
      notes: formData.notes || null,
    };

    if (editingGuest) {
      await updateMutation.mutateAsync({ id: editingGuest.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this VIP guest?')) {
      await deleteMutation.mutateAsync({ id, workspaceId });
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    await updateMutation.mutateAsync({ id, status });
  };

  const getLevelConfig = (level: string) =>
    VIP_LEVELS.find(l => l.value === level) || VIP_LEVELS[0];

  const getStatusConfig = (status: string) =>
    STATUSES.find(s => s.value === status) || STATUSES[0];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Filter guests
  const filteredGuests = guests.filter(guest => {
    const matchesSearch = guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guest.company?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || guest.status === statusFilter;
    const matchesLevel = levelFilter === 'all' || guest.vip_level === levelFilter;
    return matchesSearch && matchesStatus && matchesLevel;
  });

  // Stats
  const totalGuests = guests.length;
  const arrivedCount = guests.filter(g => g.status === 'arrived').length;
  const platinumCount = guests.filter(g => g.vip_level === 'platinum').length;
  const goldCount = guests.filter(g => g.vip_level === 'gold').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">VIP Guest Tracker</h2>
          <p className="text-muted-foreground">Manage and track your VIP guests</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add VIP Guest
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingGuest ? 'Edit VIP Guest' : 'Add VIP Guest'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Smith"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="CEO"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Acme Corp"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vip_level">VIP Level</Label>
                  <Select value={formData.vip_level} onValueChange={(v) => setFormData({ ...formData, vip_level: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VIP_LEVELS.map(level => (
                        <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(status => (
                        <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="arrival_time">Arrival Time</Label>
                  <Input
                    id="arrival_time"
                    type="datetime-local"
                    value={formData.arrival_time}
                    onChange={(e) => setFormData({ ...formData, arrival_time: e.target.value })}
                  />
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="escort_assigned">Escort Assigned</Label>
                  <Input
                    id="escort_assigned"
                    value={formData.escort_assigned}
                    onChange={(e) => setFormData({ ...formData, escort_assigned: e.target.value })}
                    placeholder="Sarah Johnson"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seating_assignment">Seating Assignment</Label>
                  <Input
                    id="seating_assignment"
                    value={formData.seating_assignment}
                    onChange={(e) => setFormData({ ...formData, seating_assignment: e.target.value })}
                    placeholder="Table 1, Seat A"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dietary_requirements">Dietary Requirements</Label>
                  <Input
                    id="dietary_requirements"
                    value={formData.dietary_requirements}
                    onChange={(e) => setFormData({ ...formData, dietary_requirements: e.target.value })}
                    placeholder="Vegetarian, No nuts"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accessibility_needs">Accessibility Needs</Label>
                  <Input
                    id="accessibility_needs"
                    value={formData.accessibility_needs}
                    onChange={(e) => setFormData({ ...formData, accessibility_needs: e.target.value })}
                    placeholder="Wheelchair access"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingGuest ? 'Update' : 'Add'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalGuests}</p>
                <p className="text-sm text-muted-foreground">Total VIPs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900">
                <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{arrivedCount}</p>
                <p className="text-sm text-muted-foreground">Arrived</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                <Crown className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{platinumCount}</p>
                <p className="text-sm text-muted-foreground">Platinum</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900">
                <Crown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{goldCount}</p>
                <p className="text-sm text-muted-foreground">Gold</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Search by name or company..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUSES.map(status => (
              <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="VIP Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {VIP_LEVELS.map(level => (
              <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Guests List */}
      <Card>
        <CardHeader>
          <CardTitle>VIP Guests ({filteredGuests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredGuests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Crown className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No VIP guests found</p>
              <p className="text-sm">Add your first VIP guest to get started</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredGuests.map((guest) => {
                const levelConfig = getLevelConfig(guest.vip_level);
                const statusConfig = getStatusConfig(guest.status);

                return (
                  <div
                    key={guest.id}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className={`${levelConfig.color}`}>
                          {getInitials(guest.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">{guest.name}</h4>
                          <Badge className={levelConfig.color} variant="secondary">
                            {levelConfig.label}
                          </Badge>
                        </div>

                        {(guest.title || guest.company) && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {guest.title}{guest.title && guest.company && ' at '}{guest.company}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {guest.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {guest.email}
                            </span>
                          )}
                          {guest.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {guest.phone}
                            </span>
                          )}
                          {guest.arrival_time && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Arrives: {format(new Date(guest.arrival_time), 'MMM d, HH:mm')}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 mt-2">
                          {guest.dietary_requirements && (
                            <Badge variant="outline" className="text-xs">
                              <Utensils className="h-3 w-3 mr-1" />
                              {guest.dietary_requirements}
                            </Badge>
                          )}
                          {guest.accessibility_needs && (
                            <Badge variant="outline" className="text-xs">
                              <Accessibility className="h-3 w-3 mr-1" />
                              {guest.accessibility_needs}
                            </Badge>
                          )}
                          {guest.seating_assignment && (
                            <Badge variant="outline" className="text-xs">
                              <MapPin className="h-3 w-3 mr-1" />
                              {guest.seating_assignment}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Select value={guest.status} onValueChange={(v) => handleStatusChange(guest.id, v)}>
                          <SelectTrigger className="w-[120px] h-8">
                            <Badge className={statusConfig.color} variant="secondary">
                              {statusConfig.label}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map(status => (
                              <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(guest)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDelete(guest.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
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
};

export default VIPTrackerTab;
