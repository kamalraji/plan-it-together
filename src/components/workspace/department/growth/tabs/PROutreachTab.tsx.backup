import React, { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Newspaper, Mail, Phone, Calendar, Trash2, MessageSquare, Star, AlertCircle } from 'lucide-react';
import { usePRContacts, useCreatePRContact, useUpdatePRContact, useDeletePRContact, PRContact } from '@/hooks/useGrowthDepartmentData';
import { formatDistanceToNow } from 'date-fns';

interface PROutreachTabProps {
  workspace: Workspace;
}

const contactTypeConfig: Record<string, { color: string; label: string }> = {
  journalist: { color: 'bg-blue-500/20 text-blue-600', label: 'Journalist' },
  blogger: { color: 'bg-purple-500/20 text-purple-600', label: 'Blogger' },
  editor: { color: 'bg-green-500/20 text-green-600', label: 'Editor' },
  producer: { color: 'bg-amber-500/20 text-amber-600', label: 'Producer' },
  podcaster: { color: 'bg-pink-500/20 text-pink-600', label: 'Podcaster' },
};

const priorityConfig: Record<string, { color: string; icon: React.ElementType }> = {
  high: { color: 'bg-red-500/20 text-red-600', icon: Star },
  medium: { color: 'bg-amber-500/20 text-amber-600', icon: Star },
  low: { color: 'bg-gray-500/20 text-gray-600', icon: Star },
};


export function PROutreachTab({ workspace }: PROutreachTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    outlet_name: '',
    contact_type: 'journalist',
    email: '',
    phone: '',
    social_handles: { twitter: '', linkedin: '' },
    beat: '',
    notes: '',
    priority: 'medium',
  });

  const { data: contacts, isLoading } = usePRContacts(workspace.id);
  const createContact = useCreatePRContact(workspace.id);
  const updateContact = useUpdatePRContact(workspace.id);
  const deleteContact = useDeletePRContact(workspace.id);

  const filteredContacts = contacts?.filter(c => {
    const matchesPriority = priorityFilter === 'all' || c.priority === priorityFilter;
    const matchesType = typeFilter === 'all' || c.contact_type === typeFilter;
    return matchesPriority && matchesType && c.status !== 'do_not_contact';
  }) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createContact.mutateAsync({
      ...formData,
      social_handles: formData.social_handles,
    });
    setFormData({
      name: '', outlet_name: '', contact_type: 'journalist', email: '', phone: '',
      social_handles: { twitter: '', linkedin: '' }, beat: '', notes: '', priority: 'medium',
    });
    setIsDialogOpen(false);
  };

  const markAsContacted = (contact: PRContact) => {
    updateContact.mutate({ id: contact.id, last_contacted_at: new Date().toISOString() });
  };

  const markAsUnresponsive = (contact: PRContact) => {
    updateContact.mutate({ id: contact.id, status: 'unresponsive' });
  };

  // Group contacts by priority
  const highPriorityContacts = filteredContacts.filter(c => c.priority === 'high');
  const otherContacts = filteredContacts.filter(c => c.priority !== 'high');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">PR & Media Outreach</h2>
          <p className="text-muted-foreground">Manage press contacts and media relationships</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add PR Contact</DialogTitle>
              <DialogDescription>Add a new press or media contact</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Contact Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="outlet_name">Publication/Outlet</Label>
                  <Input
                    id="outlet_name"
                    value={formData.outlet_name}
                    onChange={(e) => setFormData({ ...formData, outlet_name: e.target.value })}
                    placeholder="e.g., TechCrunch"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Type</Label>
                  <Select value={formData.contact_type} onValueChange={(v) => setFormData({ ...formData, contact_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(contactTypeConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="low">Low Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@outlet.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Social Handles</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="@twitter"
                    value={formData.social_handles.twitter}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      social_handles: { ...formData.social_handles, twitter: e.target.value }
                    })}
                  />
                  <Input
                    placeholder="LinkedIn URL"
                    value={formData.social_handles.linkedin}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      social_handles: { ...formData.social_handles, linkedin: e.target.value }
                    })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="beat">Beat/Coverage Area</Label>
                <Input
                  id="beat"
                  value={formData.beat}
                  onChange={(e) => setFormData({ ...formData, beat: e.target.value })}
                  placeholder="e.g., Technology, Events, Business"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Previous interactions, preferences, etc."
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createContact.isPending}>
                  {createContact.isPending ? 'Adding...' : 'Add Contact'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-primary">{contacts?.length || 0}</p>
            <p className="text-sm text-muted-foreground">Total Contacts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-red-500">{highPriorityContacts.length}</p>
            <p className="text-sm text-muted-foreground">High Priority</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-amber-500">
              {contacts?.filter(c => c.status === 'unresponsive').length || 0}
            </p>
            <p className="text-sm text-muted-foreground">Unresponsive</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-green-500">
              {contacts?.filter(c => c.last_contacted_at).length || 0}
            </p>
            <p className="text-sm text-muted-foreground">Contacted</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex gap-2">
          {['all', 'high', 'medium', 'low'].map((priority) => (
            <Button
              key={priority}
              variant={priorityFilter === priority ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPriorityFilter(priority)}
              className="capitalize"
            >
              {priority === 'all' ? 'All Priority' : `${priority} Priority`}
            </Button>
          ))}
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(contactTypeConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Contacts List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredContacts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Newspaper className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">No PR contacts found. Add your first media contact!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* High Priority Section */}
          {highPriorityContacts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-red-600 flex items-center gap-2">
                <Star className="h-4 w-4" />
                High Priority Contacts
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {highPriorityContacts.map((contact) => (
                  <ContactCard 
                    key={contact.id} 
                    contact={contact} 
                    onMarkContacted={markAsContacted}
                    onMarkUnresponsive={markAsUnresponsive}
                    onDelete={(id) => deleteContact.mutate(id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other Contacts */}
          {otherContacts.length > 0 && (
            <div className="space-y-3">
              {highPriorityContacts.length > 0 && (
                <h3 className="text-sm font-semibold text-muted-foreground">Other Contacts</h3>
              )}
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {otherContacts.map((contact) => (
                  <ContactCard 
                    key={contact.id} 
                    contact={contact}
                    onMarkContacted={markAsContacted}
                    onMarkUnresponsive={markAsUnresponsive}
                    onDelete={(id) => deleteContact.mutate(id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Contact Card Component
function ContactCard({ 
  contact, 
  onMarkContacted, 
  onMarkUnresponsive,
  onDelete 
}: { 
  contact: PRContact; 
  onMarkContacted: (c: PRContact) => void;
  onMarkUnresponsive: (c: PRContact) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className={contact.status === 'unresponsive' ? 'opacity-60' : ''}>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold">{contact.name}</h3>
            {contact.outlet_name && (
              <p className="text-sm text-muted-foreground">{contact.outlet_name}</p>
            )}
          </div>
          <div className="flex gap-1">
            <Badge className={contactTypeConfig[contact.contact_type]?.color}>
              {contactTypeConfig[contact.contact_type]?.label}
            </Badge>
            <Badge className={priorityConfig[contact.priority]?.color} variant="outline">
              {contact.priority}
            </Badge>
          </div>
        </div>

        {contact.beat && (
          <Badge variant="outline" className="text-xs">
            {contact.beat}
          </Badge>
        )}

        <div className="space-y-1.5 text-sm">
          {contact.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="truncate">{contact.email}</span>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{contact.phone}</span>
            </div>
          )}
        </div>

        {contact.last_contacted_at && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>Last contacted {formatDistanceToNow(new Date(contact.last_contacted_at), { addSuffix: true })}</span>
          </div>
        )}

        {contact.status === 'unresponsive' && (
          <Badge className="bg-amber-500/20 text-amber-600">
            <AlertCircle className="h-3 w-3 mr-1" />
            Unresponsive
          </Badge>
        )}

        <div className="flex gap-2 pt-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onMarkContacted(contact)}>
            <MessageSquare className="h-3.5 w-3.5 mr-1" />
            Log Contact
          </Button>
          {contact.status === 'active' && (
            <Button size="sm" variant="ghost" onClick={() => onMarkUnresponsive(contact)}>
              <AlertCircle className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(contact.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
