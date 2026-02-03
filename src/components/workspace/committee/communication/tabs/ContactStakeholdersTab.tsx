import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, Plus, Mail, Phone, Edit, Trash2, 
  Star, Building2, Newspaper, Handshake, Landmark, Search,
  MessageSquare, Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  useStakeholders, 
  useCreateStakeholder, 
  useUpdateStakeholder, 
  useDeleteStakeholder,
  useLogStakeholderContact,
  type Stakeholder 
} from '@/hooks/useCommunicationCommitteeData';

interface ContactStakeholdersTabProps {
  workspaceId: string;
}

const categoryConfig = {
  vip: { icon: Star, color: 'text-amber-500', bgColor: 'bg-amber-500/10', label: 'VIP' },
  media: { icon: Newspaper, color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'Media' },
  sponsor: { icon: Handshake, color: 'text-purple-500', bgColor: 'bg-purple-500/10', label: 'Sponsor' },
  partner: { icon: Building2, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', label: 'Partner' },
  government: { icon: Landmark, color: 'text-red-500', bgColor: 'bg-red-500/10', label: 'Government' },
  other: { icon: Users, color: 'text-muted-foreground', bgColor: 'bg-muted', label: 'Other' },
};

const priorityConfig = {
  high: { color: 'text-red-500', bgColor: 'bg-red-500/10', label: 'High' },
  medium: { color: 'text-amber-500', bgColor: 'bg-amber-500/10', label: 'Medium' },
  low: { color: 'text-muted-foreground', bgColor: 'bg-muted', label: 'Low' },
};

const categoryOptions = [
  { value: 'vip', label: 'VIP' },
  { value: 'media', label: 'Media' },
  { value: 'sponsor', label: 'Sponsor' },
  { value: 'partner', label: 'Partner' },
  { value: 'government', label: 'Government' },
  { value: 'other', label: 'Other' },
];

const priorityOptions = [
  { value: 'high', label: 'High Priority' },
  { value: 'medium', label: 'Medium Priority' },
  { value: 'low', label: 'Low Priority' },
];

export function ContactStakeholdersTab({ workspaceId }: ContactStakeholdersTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStakeholder, setEditingStakeholder] = useState<Stakeholder | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    organization: '',
    email: '',
    phone: '',
    category: 'other',
    priority: 'medium',
    notes: '',
  });

  const { data: stakeholders = [], isLoading } = useStakeholders(workspaceId);
  const createMutation = useCreateStakeholder(workspaceId);
  const updateMutation = useUpdateStakeholder(workspaceId);
  const deleteMutation = useDeleteStakeholder(workspaceId);
  const logContactMutation = useLogStakeholderContact(workspaceId);

  const handleOpenDialog = (stakeholder?: Stakeholder) => {
    if (stakeholder) {
      setEditingStakeholder(stakeholder);
      setFormData({
        name: stakeholder.name,
        role: stakeholder.role || '',
        organization: stakeholder.organization || '',
        email: stakeholder.email || '',
        phone: stakeholder.phone || '',
        category: stakeholder.category,
        priority: stakeholder.priority,
        notes: stakeholder.notes || '',
      });
    } else {
      setEditingStakeholder(null);
      setFormData({
        name: '',
        role: '',
        organization: '',
        email: '',
        phone: '',
        category: 'other',
        priority: 'medium',
        notes: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingStakeholder) {
      await updateMutation.mutateAsync({ id: editingStakeholder.id, ...formData });
    } else {
      await createMutation.mutateAsync(formData);
    }

    setIsDialogOpen(false);
  };

  const handleLogContact = async (id: string) => {
    await logContactMutation.mutateAsync(id);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this stakeholder?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Filter stakeholders
  const filteredStakeholders = stakeholders.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.organization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Group by category for stats
  const statsByCategory = Object.keys(categoryConfig).reduce((acc, cat) => {
    acc[cat] = stakeholders.filter((s) => s.category === cat).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Stakeholder Directory
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage and contact key stakeholders for your event
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Stakeholder
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingStakeholder ? 'Edit Stakeholder' : 'Add Stakeholder'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role / Title</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g., CEO, Editor, Manager"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <Input
                  id="organization"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  placeholder="Company or organization name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes about this stakeholder..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingStakeholder ? 'Update' : 'Add'} Stakeholder
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {Object.entries(categoryConfig).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <Card key={key}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${config.bgColor}`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{statsByCategory[key] || 0}</p>
                    <p className="text-xs text-muted-foreground">{config.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search stakeholders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categoryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stakeholders List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Stakeholders ({filteredStakeholders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredStakeholders.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || categoryFilter !== 'all'
                  ? 'No stakeholders match your search'
                  : 'No stakeholders added yet'}
              </p>
              {!searchQuery && categoryFilter === 'all' && (
                <Button variant="outline" className="mt-4" onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add your first stakeholder
                </Button>
              )}
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {filteredStakeholders.map((stakeholder) => {
                  const category = stakeholder.category as keyof typeof categoryConfig;
                  const catConfig = categoryConfig[category] || categoryConfig.other;
                  const priority = stakeholder.priority as keyof typeof priorityConfig;
                  const prioConfig = priorityConfig[priority] || priorityConfig.medium;
                  const CategoryIcon = catConfig.icon;

                  return (
                    <div
                      key={stakeholder.id}
                      className="flex items-start justify-between p-4 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <Avatar className={`h-10 w-10 ${catConfig.bgColor}`}>
                          <AvatarFallback className={catConfig.color}>
                            {getInitials(stakeholder.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{stakeholder.name}</p>
                            <Badge variant="outline" className={`text-xs ${catConfig.color}`}>
                              <CategoryIcon className="h-3 w-3 mr-1" />
                              {catConfig.label}
                            </Badge>
                            <Badge className={`text-xs ${prioConfig.bgColor} ${prioConfig.color} border-0`}>
                              {prioConfig.label}
                            </Badge>
                          </div>
                          {(stakeholder.role || stakeholder.organization) && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {stakeholder.role}
                              {stakeholder.role && stakeholder.organization && ' at '}
                              {stakeholder.organization}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                            {stakeholder.email && (
                              <a
                                href={`mailto:${stakeholder.email}`}
                                className="flex items-center gap-1 hover:text-primary"
                              >
                                <Mail className="h-3 w-3" />
                                {stakeholder.email}
                              </a>
                            )}
                            {stakeholder.phone && (
                              <a
                                href={`tel:${stakeholder.phone}`}
                                className="flex items-center gap-1 hover:text-primary"
                              >
                                <Phone className="h-3 w-3" />
                                {stakeholder.phone}
                              </a>
                            )}
                            {stakeholder.last_contacted_at && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Last contact: {format(new Date(stakeholder.last_contacted_at), 'MMM d, yyyy')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-4">
                        {stakeholder.email && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              window.location.href = `mailto:${stakeholder.email}`;
                              handleLogContact(stakeholder.id);
                            }}
                          >
                            <Mail className="h-3 w-3 mr-1" />
                            Email
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleLogContact(stakeholder.id)}
                          title="Log contact"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleOpenDialog(stakeholder)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(stakeholder.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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
