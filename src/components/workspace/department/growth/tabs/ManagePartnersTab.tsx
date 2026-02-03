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
import { Plus, Users, Mail, TrendingUp, DollarSign, Trash2, Eye, Percent } from 'lucide-react';
import { usePartners, useCreatePartner, useUpdatePartner, useDeletePartner, Partner } from '@/hooks/useGrowthDepartmentData';

interface ManagePartnersTabProps {
  workspace: Workspace;
}

const partnerTypeConfig: Record<string, { color: string; label: string }> = {
  influencer: { color: 'bg-pink-500/20 text-pink-600', label: 'Influencer' },
  media: { color: 'bg-blue-500/20 text-blue-600', label: 'Media Partner' },
  affiliate: { color: 'bg-green-500/20 text-green-600', label: 'Affiliate' },
  strategic: { color: 'bg-purple-500/20 text-purple-600', label: 'Strategic' },
  community: { color: 'bg-amber-500/20 text-amber-600', label: 'Community' },
};

const statusConfig: Record<string, { color: string }> = {
  active: { color: 'bg-green-500/20 text-green-600' },
  pending: { color: 'bg-amber-500/20 text-amber-600' },
  completed: { color: 'bg-blue-500/20 text-blue-600' },
  cancelled: { color: 'bg-muted-foreground/30/20 text-muted-foreground' },
};

export function ManagePartnersTab({ workspace }: ManagePartnersTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    partner_type: 'strategic',
    contact_name: '',
    contact_email: '',
    social_handles: { instagram: '', twitter: '', linkedin: '' },
    reach: 0,
    engagement_rate: 0,
    partnership_value: 0,
    commission_percentage: 0,
    notes: '',
  });

  const { data: partners, isLoading } = usePartners(workspace.id);
  const createPartner = useCreatePartner(workspace.id);
  const updatePartner = useUpdatePartner(workspace.id);
  const deletePartner = useDeletePartner(workspace.id);

  const filteredPartners = partners?.filter(p => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesType = typeFilter === 'all' || p.partner_type === typeFilter;
    return matchesStatus && matchesType;
  }) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPartner.mutateAsync({
      ...formData,
      social_handles: formData.social_handles,
    });
    setFormData({
      name: '', company_name: '', partner_type: 'strategic', contact_name: '', contact_email: '',
      social_handles: { instagram: '', twitter: '', linkedin: '' }, reach: 0, engagement_rate: 0,
      partnership_value: 0, commission_percentage: 0, notes: '',
    });
    setIsDialogOpen(false);
  };

  const updateStatus = (partner: Partner, newStatus: string) => {
    updatePartner.mutate({ id: partner.id, status: newStatus });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Calculate stats
  const totalReach = partners?.filter(p => p.status === 'active').reduce((sum, p) => sum + p.reach, 0) || 0;
  const totalValue = partners?.filter(p => p.status === 'active').reduce((sum, p) => sum + p.partnership_value, 0) || 0;
  const avgEngagement = partners?.length 
    ? (partners.reduce((sum, p) => sum + p.engagement_rate, 0) / partners.length).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Partner Management</h2>
          <p className="text-muted-foreground">Manage influencers, affiliates, and strategic partners</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Partner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Partner</DialogTitle>
              <DialogDescription>Register a new partner or influencer</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Partner Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Display name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company/Brand</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="Company name"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Partner Type</Label>
                  <Select value={formData.partner_type} onValueChange={(v) => setFormData({ ...formData, partner_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(partnerTypeConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="contact@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Social Handles</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="@instagram"
                    value={formData.social_handles.instagram}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      social_handles: { ...formData.social_handles, instagram: e.target.value }
                    })}
                  />
                  <Input
                    placeholder="@twitter"
                    value={formData.social_handles.twitter}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      social_handles: { ...formData.social_handles, twitter: e.target.value }
                    })}
                  />
                  <Input
                    placeholder="@linkedin"
                    value={formData.social_handles.linkedin}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      social_handles: { ...formData.social_handles, linkedin: e.target.value }
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reach">Total Reach</Label>
                  <Input
                    id="reach"
                    type="number"
                    value={formData.reach}
                    onChange={(e) => setFormData({ ...formData, reach: parseInt(e.target.value) || 0 })}
                    placeholder="Follower count"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="engagement_rate">Engagement Rate (%)</Label>
                  <Input
                    id="engagement_rate"
                    type="number"
                    step="0.01"
                    value={formData.engagement_rate}
                    onChange={(e) => setFormData({ ...formData, engagement_rate: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g., 3.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="partnership_value">Partnership Value ($)</Label>
                  <Input
                    id="partnership_value"
                    type="number"
                    value={formData.partnership_value}
                    onChange={(e) => setFormData({ ...formData, partnership_value: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commission_percentage">Commission (%)</Label>
                  <Input
                    id="commission_percentage"
                    type="number"
                    step="0.1"
                    value={formData.commission_percentage}
                    onChange={(e) => setFormData({ ...formData, commission_percentage: parseFloat(e.target.value) || 0 })}
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
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createPartner.isPending}>
                  {createPartner.isPending ? 'Adding...' : 'Add Partner'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Partners</p>
                <p className="text-2xl font-bold">{partners?.length || 0}</p>
              </div>
              <Users className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Combined Reach</p>
                <p className="text-2xl font-bold">{formatNumber(totalReach)}</p>
              </div>
              <Eye className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Engagement</p>
                <p className="text-2xl font-bold">{avgEngagement}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex gap-2">
          {['all', 'active', 'pending', 'completed'].map((status) => (
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
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(partnerTypeConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Partners List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredPartners.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">No partners found. Add your first partner!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPartners.map((partner) => (
            <Card key={partner.id}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{partner.name}</h3>
                    {partner.company_name && (
                      <p className="text-sm text-muted-foreground">{partner.company_name}</p>
                    )}
                  </div>
                  <Badge className={partnerTypeConfig[partner.partner_type]?.color}>
                    {partnerTypeConfig[partner.partner_type]?.label}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className={statusConfig[partner.status]?.color} variant="outline">
                    {partner.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{formatNumber(partner.reach)} reach</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{partner.engagement_rate}% eng.</span>
                  </div>
                </div>

                {partner.contact_email && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{partner.contact_email}</span>
                  </div>
                )}

                {Object.entries(partner.social_handles as Record<string, string>).some(([, v]) => v) && (
                  <div className="flex items-center gap-2">
                    {Object.entries(partner.social_handles as Record<string, string>).map(([platform, handle]) => 
                      handle ? (
                        <Badge key={platform} variant="outline" className="text-xs">
                          @{handle.replace('@', '')}
                        </Badge>
                      ) : null
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {partner.status === 'pending' && (
                    <Button size="sm" className="flex-1" onClick={() => updateStatus(partner, 'active')}>
                      Activate
                    </Button>
                  )}
                  {partner.status === 'active' && (
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => updateStatus(partner, 'completed')}>
                      Mark Complete
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deletePartner.mutate(partner.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
