import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Workspace } from '@/types';
import { 
  useBenefits, 
  useCreateBenefit, 
  useUpdateBenefit,
  useDeleteBenefit,
  SponsorBenefit,
} from '@/hooks/useSponsorshipCommitteeData';
import { 
  Plus, 
  Check,
  X,
  MoreVertical,
  Edit,
  Trash2,
  Gift,
  Crown,
  Medal,
  Award,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SimpleDropdown, SimpleDropdownTrigger, SimpleDropdownContent, SimpleDropdownItem } from '@/components/ui/simple-dropdown';

interface BenefitsManagerTabProps {
  workspace: Workspace;
}

const tiers = [
  { id: 'platinum', label: 'Platinum', icon: Crown, color: 'text-muted-foreground', bgColor: 'bg-muted' },
  { id: 'gold', label: 'Gold', icon: Medal, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  { id: 'silver', label: 'Silver', icon: Award, color: 'text-muted-foreground', bgColor: 'bg-muted' },
  { id: 'bronze', label: 'Bronze', icon: Star, color: 'text-orange-600', bgColor: 'bg-orange-100' },
];

const categories = [
  { id: 'visibility', label: 'Visibility' },
  { id: 'access', label: 'Access' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'networking', label: 'Networking' },
  { id: 'custom', label: 'Custom' },
];

export function BenefitsManagerTab({ workspace }: BenefitsManagerTabProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<SponsorBenefit | null>(null);

  const { data: benefits = [], isLoading } = useBenefits(workspace.id);
  const createBenefit = useCreateBenefit();
  const updateBenefit = useUpdateBenefit();
  const deleteBenefit = useDeleteBenefit();

  const [formData, setFormData] = useState({
    tier: 'platinum',
    name: '',
    description: '',
    category: 'visibility',
    value_estimate: '',
    quantity: '1',
    is_active: true,
  });

  const getBenefitsByTier = (tierId: string) => 
    benefits.filter(b => b.tier === tierId).sort((a, b) => a.display_order - b.display_order);

  const handleCreateBenefit = () => {
    const maxOrder = Math.max(0, ...getBenefitsByTier(formData.tier).map(b => b.display_order));
    createBenefit.mutate({
      workspace_id: workspace.id,
      tier: formData.tier,
      name: formData.name,
      description: formData.description || null,
      category: formData.category,
      value_estimate: parseFloat(formData.value_estimate) || null,
      quantity: parseInt(formData.quantity) || 1,
      is_active: formData.is_active,
      display_order: maxOrder + 1,
    }, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        resetForm();
      }
    });
  };

  const handleUpdateBenefit = () => {
    if (!editingBenefit) return;
    updateBenefit.mutate({
      id: editingBenefit.id,
      workspaceId: workspace.id,
      name: formData.name,
      description: formData.description || null,
      category: formData.category,
      value_estimate: parseFloat(formData.value_estimate) || null,
      quantity: parseInt(formData.quantity) || 1,
      is_active: formData.is_active,
    }, {
      onSuccess: () => {
        setEditingBenefit(null);
        resetForm();
      }
    });
  };

  const handleDeleteBenefit = (benefit: SponsorBenefit) => {
    if (confirm(`Are you sure you want to delete "${benefit.name}"?`)) {
      deleteBenefit.mutate({ id: benefit.id, workspaceId: workspace.id });
    }
  };

  const handleToggleActive = (benefit: SponsorBenefit) => {
    updateBenefit.mutate({
      id: benefit.id,
      workspaceId: workspace.id,
      is_active: !benefit.is_active,
    });
  };

  const openEditDialog = (benefit: SponsorBenefit) => {
    setFormData({
      tier: benefit.tier,
      name: benefit.name,
      description: benefit.description || '',
      category: benefit.category,
      value_estimate: benefit.value_estimate?.toString() || '',
      quantity: benefit.quantity?.toString() || '1',
      is_active: benefit.is_active,
    });
    setEditingBenefit(benefit);
  };

  const resetForm = () => {
    setFormData({
      tier: 'platinum',
      name: '',
      description: '',
      category: 'visibility',
      value_estimate: '',
      quantity: '1',
      is_active: true,
    });
  };

  const BenefitForm = () => (
    <div className="grid gap-4">
      {!editingBenefit && (
        <div className="space-y-2">
          <Label htmlFor="tier">Tier *</Label>
          <Select value={formData.tier} onValueChange={(v) => setFormData(prev => ({ ...prev, tier: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tiers.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Benefit Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Logo on event banner"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="value_estimate">Estimated Value ($)</Label>
        <Input
          id="value_estimate"
          type="number"
          value={formData.value_estimate}
          onChange={(e) => setFormData(prev => ({ ...prev, value_estimate: e.target.value }))}
          placeholder="1000"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Details about this benefit..."
          rows={2}
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
        />
        <Label htmlFor="is_active">Active</Label>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Benefits Matrix</h2>
          <p className="text-sm text-muted-foreground">
            {benefits.length} benefits across {tiers.length} tiers
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Benefit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Benefit</DialogTitle>
            </DialogHeader>
            <BenefitForm />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleCreateBenefit} disabled={!formData.name || createBenefit.isPending}>
                {createBenefit.isPending ? 'Adding...' : 'Add Benefit'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Benefits Matrix */}
      <ScrollArea className="w-full">
        <div className="min-w-[800px]">
          {/* Header Row */}
          <div className="grid grid-cols-5 gap-4 mb-4">
            <div className="font-medium text-sm text-muted-foreground py-2">Benefit</div>
            {tiers.map((tier) => {
              const TierIcon = tier.icon;
              return (
                <div key={tier.id} className="text-center">
                  <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full', tier.bgColor)}>
                    <TierIcon className={cn('h-4 w-4', tier.color)} />
                    <span className={cn('text-sm font-medium', tier.color)}>{tier.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Collect all unique benefits */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : benefits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Gift className="h-12 w-12 mb-4 opacity-50" />
              <p>No benefits configured yet</p>
              <p className="text-sm">Add benefits to build your sponsorship packages</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Group by category */}
              {categories.map((category) => {
                const categoryBenefits = benefits.filter(b => b.category === category.id);
                if (categoryBenefits.length === 0) return null;

                // Get unique benefit names in this category
                const uniqueNames = [...new Set(categoryBenefits.map(b => b.name))];

                return (
                  <div key={category.id} className="mb-6">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                      {category.label}
                    </h3>
                    {uniqueNames.map((benefitName) => (
                      <div 
                        key={benefitName} 
                        className="grid grid-cols-5 gap-4 py-3 border-b border-border/50 hover:bg-muted/30"
                      >
                        <div className="flex items-center gap-2">
                          <Gift className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{benefitName}</span>
                        </div>
                        {tiers.map((tier) => {
                          const benefit = categoryBenefits.find(b => b.name === benefitName && b.tier === tier.id);
                          if (!benefit) {
                            return (
                              <div key={tier.id} className="flex justify-center items-center">
                                <X className="h-4 w-4 text-muted-foreground/30" />
                              </div>
                            );
                          }
                          return (
                            <div key={tier.id} className="flex justify-center items-center gap-2">
                              {benefit.is_active ? (
                                <>
                                  <Check className="h-4 w-4 text-emerald-500" />
                                  {benefit.quantity > 1 && (
                                    <Badge variant="secondary" className="text-xs">
                                      x{benefit.quantity}
                                    </Badge>
                                  )}
                                </>
                              ) : (
                                <X className="h-4 w-4 text-muted-foreground/50" />
                              )}
                              <SimpleDropdown>
                                <SimpleDropdownTrigger className="h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground opacity-0 group-hover:opacity-100">
                                  <MoreVertical className="h-3 w-3" />
                                </SimpleDropdownTrigger>
                                <SimpleDropdownContent align="end">
                                  <SimpleDropdownItem onClick={() => openEditDialog(benefit)}>
                                    <Edit className="h-4 w-4 mr-2" /> Edit
                                  </SimpleDropdownItem>
                                  <SimpleDropdownItem onClick={() => handleToggleActive(benefit)}>
                                    {benefit.is_active ? <X className="h-4 w-4 mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                                    {benefit.is_active ? 'Disable' : 'Enable'}
                                  </SimpleDropdownItem>
                                  <SimpleDropdownItem onClick={() => handleDeleteBenefit(benefit)} className="text-destructive">
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                  </SimpleDropdownItem>
                                </SimpleDropdownContent>
                              </SimpleDropdown>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Tier Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tiers.map((tier) => {
          const tierBenefits = getBenefitsByTier(tier.id);
          const activeBenefits = tierBenefits.filter(b => b.is_active);
          const totalValue = activeBenefits.reduce((sum, b) => sum + (b.value_estimate || 0), 0);
          const TierIcon = tier.icon;

          return (
            <Card key={tier.id} className={cn('border', tier.bgColor.replace('bg-', 'border-').replace('100', '200'))}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TierIcon className={cn('h-5 w-5', tier.color)} />
                  <span className={cn('font-semibold', tier.color)}>{tier.label}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-foreground">{activeBenefits.length}</p>
                  <p className="text-xs text-muted-foreground">Active Benefits</p>
                  {totalValue > 0 && (
                    <p className="text-sm text-emerald-600 font-medium">
                      ~${totalValue.toLocaleString()} value
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingBenefit} onOpenChange={(open) => !open && setEditingBenefit(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Benefit</DialogTitle>
          </DialogHeader>
          <BenefitForm />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleUpdateBenefit} disabled={!formData.name || updateBenefit.isPending}>
              {updateBenefit.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
