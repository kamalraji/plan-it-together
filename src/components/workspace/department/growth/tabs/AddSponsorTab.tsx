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
import { Plus, Handshake, Building2, Mail, Phone, DollarSign, Trash2, CheckCircle2, Clock, FileText } from 'lucide-react';
import { useSponsors, useCreateSponsor, useUpdateSponsor, useDeleteSponsor, Sponsor } from '@/hooks/useGrowthDepartmentData';
import { Progress } from '@/components/ui/progress';

interface AddSponsorTabProps {
  workspace: Workspace;
}

const tierConfig: Record<string, { color: string; minValue: number }> = {
  platinum: { color: 'bg-gradient-to-r from-gray-300 to-gray-400 text-foreground', minValue: 50000 },
  gold: { color: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white', minValue: 25000 },
  silver: { color: 'bg-gradient-to-r from-gray-200 to-gray-300 text-foreground', minValue: 10000 },
  bronze: { color: 'bg-gradient-to-r from-orange-300 to-orange-400 text-white', minValue: 5000 },
  custom: { color: 'bg-primary text-primary-foreground', minValue: 0 },
};

const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
  prospect: { color: 'bg-muted text-muted-foreground', icon: Clock },
  negotiating: { color: 'bg-blue-500/20 text-blue-600', icon: FileText },
  confirmed: { color: 'bg-green-500/20 text-green-600', icon: CheckCircle2 },
  declined: { color: 'bg-red-500/20 text-red-600', icon: Clock },
  churned: { color: 'bg-muted-foreground/30/20 text-muted-foreground', icon: Clock },
};

export function AddSponsorTab({ workspace }: AddSponsorTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    tier: 'bronze',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    contract_value: 0,
    notes: '',
  });

  const { data: sponsors, isLoading } = useSponsors(workspace.id);
  const createSponsor = useCreateSponsor(workspace.id);
  const updateSponsor = useUpdateSponsor(workspace.id);
  const deleteSponsor = useDeleteSponsor(workspace.id);

  const filteredSponsors = sponsors?.filter(s => 
    statusFilter === 'all' || s.status === statusFilter
  ) || [];

  // Calculate tier summaries
  const tierSummaries = Object.keys(tierConfig).map(tier => {
    const tierSponsors = sponsors?.filter(s => s.tier === tier && s.status === 'confirmed') || [];
    return {
      tier,
      count: tierSponsors.length,
      revenue: tierSponsors.reduce((sum, s) => sum + s.contract_value, 0),
    };
  });

  const totalRevenue = sponsors?.filter(s => s.status === 'confirmed').reduce((sum, s) => sum + s.contract_value, 0) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSponsor.mutateAsync(formData);
    setFormData({ name: '', company_name: '', tier: 'bronze', contact_name: '', contact_email: '', contact_phone: '', contract_value: 0, notes: '' });
    setIsDialogOpen(false);
  };

  const updateStatus = (sponsor: Sponsor, newStatus: string) => {
    updateSponsor.mutate({ id: sponsor.id, status: newStatus });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Sponsorship Management</h2>
          <p className="text-muted-foreground">Track and manage event sponsors</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Sponsor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Sponsor</DialogTitle>
              <DialogDescription>Register a new sponsor or prospect</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Sponsor Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Sponsor display name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="Legal company name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tier">Sponsorship Tier</Label>
                  <Select value={formData.tier} onValueChange={(v) => setFormData({ ...formData, tier: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(tierConfig).map((tier) => (
                        <SelectItem key={tier} value={tier} className="capitalize">{tier}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contract_value">Contract Value ($)</Label>
                  <Input
                    id="contract_value"
                    type="number"
                    value={formData.contract_value}
                    onChange={(e) => setFormData({ ...formData, contract_value: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_name">Contact Person</Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  placeholder="Primary contact name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="contact@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Phone</Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about this sponsor..."
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createSponsor.isPending}>
                  {createSponsor.isPending ? 'Adding...' : 'Add Sponsor'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tier Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        {tierSummaries.map(({ tier, count, revenue }) => (
          <Card key={tier}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <Badge className={tierConfig[tier].color}>{tier}</Badge>
                <span className="text-2xl font-bold">{count}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                ${revenue.toLocaleString()} secured
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Total Revenue Banner */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Sponsorship Revenue</p>
              <p className="text-3xl font-bold text-primary">${totalRevenue.toLocaleString()}</p>
            </div>
            <DollarSign className="h-12 w-12 text-primary/30" />
          </div>
        </CardContent>
      </Card>

      {/* Status Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'prospect', 'negotiating', 'confirmed', 'declined'].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(status)}
            className="capitalize"
          >
            {status}
          </Button>
        ))}
      </div>

      {/* Sponsors List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredSponsors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Handshake className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">No sponsors found. Add your first sponsor!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSponsors.map((sponsor) => {
            const StatusIcon = statusConfig[sponsor.status]?.icon || Clock;
            const paymentProgress = sponsor.contract_value > 0 ? (sponsor.amount_paid / sponsor.contract_value) * 100 : 0;
            
            return (
              <Card key={sponsor.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <Badge className={tierConfig[sponsor.tier]?.color}>{sponsor.tier}</Badge>
                        <h3 className="font-semibold text-lg">{sponsor.name}</h3>
                        {sponsor.company_name && (
                          <span className="text-muted-foreground">({sponsor.company_name})</span>
                        )}
                        <Badge className={statusConfig[sponsor.status]?.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {sponsor.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm">
                        {sponsor.contact_name && (
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{sponsor.contact_name}</span>
                          </div>
                        )}
                        {sponsor.contact_email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{sponsor.contact_email}</span>
                          </div>
                        )}
                        {sponsor.contact_phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{sponsor.contact_phone}</span>
                          </div>
                        )}
                      </div>

                      {sponsor.contract_value > 0 && (
                        <div className="space-y-1 max-w-md">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Payment Progress</span>
                            <span className="font-medium">
                              ${sponsor.amount_paid.toLocaleString()} / ${sponsor.contract_value.toLocaleString()}
                            </span>
                          </div>
                          <Progress value={paymentProgress} className="h-2" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          ${sponsor.contract_value.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">Contract Value</p>
                      </div>
                      
                      <div className="flex gap-1">
                        {sponsor.status === 'prospect' && (
                          <Button size="sm" variant="outline" onClick={() => updateStatus(sponsor, 'negotiating')}>
                            Start Negotiation
                          </Button>
                        )}
                        {sponsor.status === 'negotiating' && (
                          <>
                            <Button size="sm" onClick={() => updateStatus(sponsor, 'confirmed')}>
                              Confirm
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => updateStatus(sponsor, 'declined')}>
                              Decline
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteSponsor.mutate(sponsor.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
