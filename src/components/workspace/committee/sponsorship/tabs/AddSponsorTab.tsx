import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Workspace } from '@/types';
import { 
  useSponsors, 
  useCreateSponsor, 
  useUpdateSponsor, 
  useDeleteSponsor,
  Sponsor,
} from '@/hooks/useSponsorshipCommitteeData';
import { 
  Plus, 
  Search, 
  Building2, 
  Mail, 
  Phone, 
  DollarSign, 
  MoreVertical,
  Edit,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SimpleDropdown, SimpleDropdownTrigger, SimpleDropdownContent, SimpleDropdownItem } from '@/components/ui/simple-dropdown';

interface AddSponsorTabProps {
  workspace: Workspace;
}

const tierColors: Record<string, string> = {
  platinum: 'bg-muted text-foreground border-input',
  gold: 'bg-amber-100 text-amber-800 border-amber-300',
  silver: 'bg-muted text-foreground border-input',
  bronze: 'bg-orange-100 text-orange-800 border-orange-300',
};

const paymentStatusColors: Record<string, string> = {
  paid: 'bg-emerald-500/10 text-emerald-600',
  pending: 'bg-amber-500/10 text-amber-600',
  partial: 'bg-blue-500/10 text-blue-600',
  overdue: 'bg-red-500/10 text-red-600',
};

export function AddSponsorTab({ workspace }: AddSponsorTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);

  const { data: sponsors = [], isLoading } = useSponsors(workspace.id);
  const createSponsor = useCreateSponsor();
  const updateSponsor = useUpdateSponsor();
  const deleteSponsor = useDeleteSponsor();

  const [formData, setFormData] = useState({
    name: '',
    tier: 'silver',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    contract_value: '',
    payment_status: 'pending',
    status: 'active',
    notes: '',
  });

  const filteredSponsors = sponsors.filter((sponsor) => {
    const matchesSearch = sponsor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sponsor.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sponsor.contact_email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = tierFilter === 'all' || sponsor.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const handleCreateSponsor = () => {
    createSponsor.mutate({
      workspace_id: workspace.id,
      name: formData.name,
      tier: formData.tier,
      contact_name: formData.contact_name || null,
      contact_email: formData.contact_email || null,
      contact_phone: formData.contact_phone || null,
      contract_value: parseFloat(formData.contract_value) || 0,
      payment_status: formData.payment_status,
      status: formData.status,
      notes: formData.notes || null,
    }, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        resetForm();
      }
    });
  };

  const handleUpdateSponsor = () => {
    if (!editingSponsor) return;
    updateSponsor.mutate({
      id: editingSponsor.id,
      workspaceId: workspace.id,
      name: formData.name,
      tier: formData.tier,
      contact_name: formData.contact_name || null,
      contact_email: formData.contact_email || null,
      contact_phone: formData.contact_phone || null,
      contract_value: parseFloat(formData.contract_value) || 0,
      payment_status: formData.payment_status,
      status: formData.status,
      notes: formData.notes || null,
    }, {
      onSuccess: () => {
        setEditingSponsor(null);
        resetForm();
      }
    });
  };

  const handleDeleteSponsor = (sponsor: Sponsor) => {
    if (confirm(`Are you sure you want to remove ${sponsor.name}?`)) {
      deleteSponsor.mutate({ id: sponsor.id, workspaceId: workspace.id });
    }
  };

  const openEditDialog = (sponsor: Sponsor) => {
    setFormData({
      name: sponsor.name,
      tier: sponsor.tier,
      contact_name: sponsor.contact_name || '',
      contact_email: sponsor.contact_email || '',
      contact_phone: sponsor.contact_phone || '',
      contract_value: sponsor.contract_value?.toString() || '',
      payment_status: sponsor.payment_status || 'pending',
      status: sponsor.status || 'active',
      notes: sponsor.notes || '',
    });
    setEditingSponsor(sponsor);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      tier: 'silver',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      contract_value: '',
      payment_status: 'pending',
      status: 'active',
      notes: '',
    });
  };

  // Stats
  const totalValue = sponsors.reduce((sum, s) => sum + (s.contract_value || 0), 0);
  const tierCounts = sponsors.reduce((acc, s) => {
    acc[s.tier] = (acc[s.tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const SponsorForm = () => (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Company Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Acme Corp"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tier">Tier *</Label>
          <Select value={formData.tier} onValueChange={(v) => setFormData(prev => ({ ...prev, tier: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="platinum">Platinum</SelectItem>
              <SelectItem value="gold">Gold</SelectItem>
              <SelectItem value="silver">Silver</SelectItem>
              <SelectItem value="bronze">Bronze</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contact_name">Contact Name</Label>
          <Input
            id="contact_name"
            value={formData.contact_name}
            onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
            placeholder="John Doe"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact_email">Contact Email</Label>
          <Input
            id="contact_email"
            type="email"
            value={formData.contact_email}
            onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
            placeholder="john@acme.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contact_phone">Contact Phone</Label>
          <Input
            id="contact_phone"
            value={formData.contact_phone}
            onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
            placeholder="+1 (555) 123-4567"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contract_value">Contract Value ($)</Label>
          <Input
            id="contract_value"
            type="number"
            value={formData.contract_value}
            onChange={(e) => setFormData(prev => ({ ...prev, contract_value: e.target.value }))}
            placeholder="10000"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="payment_status">Payment Status</Label>
          <Select value={formData.payment_status} onValueChange={(v) => setFormData(prev => ({ ...prev, payment_status: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Additional notes about this sponsor..."
          rows={3}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10">
                <Building2 className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{sponsors.length}</p>
                <p className="text-xs text-muted-foreground">Total Sponsors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10">
                <DollarSign className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">${totalValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {['platinum', 'gold'].map(tier => (
          <Card key={tier} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={cn('capitalize', tierColors[tier])}>
                  {tier}
                </Badge>
                <div>
                  <p className="text-2xl font-bold text-foreground">{tierCounts[tier] || 0}</p>
                  <p className="text-xs text-muted-foreground">Sponsors</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle className="text-lg">Sponsor Directory</CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Sponsor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Sponsor</DialogTitle>
              </DialogHeader>
              <SponsorForm />
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleCreateSponsor} disabled={!formData.name || createSponsor.isPending}>
                  {createSponsor.isPending ? 'Adding...' : 'Add Sponsor'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sponsors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Tiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="platinum">Platinum</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="bronze">Bronze</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sponsors List */}
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filteredSponsors.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Building2 className="h-8 w-8 mb-2 opacity-50" />
                <p>No sponsors found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSponsors.map((sponsor) => (
                  <div
                    key={sponsor.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-foreground truncate">{sponsor.name}</h4>
                          <Badge variant="outline" className={cn('capitalize text-xs', tierColors[sponsor.tier])}>
                            {sponsor.tier}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          {sponsor.contact_name && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {sponsor.contact_email || sponsor.contact_name}
                            </span>
                          )}
                          {sponsor.contact_phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {sponsor.contact_phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          ${(sponsor.contract_value || 0).toLocaleString()}
                        </p>
                        <Badge variant="secondary" className={cn('text-xs', paymentStatusColors[sponsor.payment_status])}>
                          {sponsor.payment_status}
                        </Badge>
                      </div>
                      <SimpleDropdown>
                        <SimpleDropdownTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground">
                          <MoreVertical className="h-4 w-4" />
                        </SimpleDropdownTrigger>
                        <SimpleDropdownContent align="end">
                          <SimpleDropdownItem onClick={() => openEditDialog(sponsor)}>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </SimpleDropdownItem>
                          <SimpleDropdownItem onClick={() => handleDeleteSponsor(sponsor)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </SimpleDropdownItem>
                        </SimpleDropdownContent>
                      </SimpleDropdown>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingSponsor} onOpenChange={(open) => !open && setEditingSponsor(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Sponsor</DialogTitle>
          </DialogHeader>
          <SponsorForm />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleUpdateSponsor} disabled={!formData.name || updateSponsor.isPending}>
              {updateSponsor.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
