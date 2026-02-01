import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ClipboardCheck,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Leaf,
  Wheat,
  AlertCircle,
  Check,
  PieChart,
  FileText,
} from 'lucide-react';
import {
  useDietaryRequirements,
  useDietaryRequirementMutations,
  useCateringMenuItems,
  type CateringDietaryRequirement,
} from '@/hooks/useCateringData';

interface DietaryReportTabProps {
  workspaceId: string;
  eventId?: string;
}

const REQUIREMENT_TYPES = [
  { value: 'vegetarian', label: 'Vegetarian', icon: Leaf, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  { value: 'vegan', label: 'Vegan', icon: Leaf, color: 'text-emerald-600', bgColor: 'bg-emerald-500/10' },
  { value: 'gluten_free', label: 'Gluten-Free', icon: Wheat, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  { value: 'lactose_free', label: 'Lactose-Free', icon: AlertCircle, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  { value: 'nut_allergy', label: 'Nut Allergy', icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-500/10' },
  { value: 'seafood_allergy', label: 'Seafood Allergy', icon: AlertCircle, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  { value: 'halal', label: 'Halal', icon: Check, color: 'text-teal-500', bgColor: 'bg-teal-500/10' },
  { value: 'kosher', label: 'Kosher', icon: Check, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  { value: 'other', label: 'Other', icon: FileText, color: 'text-gray-500', bgColor: 'bg-gray-500/10' },
];

export function DietaryReportTab({ workspaceId, eventId }: DietaryReportTabProps) {
  const { data: requirements = [], isLoading } = useDietaryRequirements(workspaceId, eventId);
  const { data: menuItems = [] } = useCateringMenuItems(workspaceId);
  const { createRequirement, updateRequirement, deleteRequirement } = useDietaryRequirementMutations(workspaceId);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CateringDietaryRequirement | null>(null);

  const [formData, setFormData] = useState({
    requirement_type: 'vegetarian',
    count: 0,
    special_requests: '',
  });

  const resetForm = () => {
    setFormData({
      requirement_type: 'vegetarian',
      count: 0,
      special_requests: '',
    });
    setEditingItem(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (item: CateringDietaryRequirement) => {
    setEditingItem(item);
    setFormData({
      requirement_type: item.requirement_type,
      count: item.count,
      special_requests: typeof item.special_requests === 'string' ? item.special_requests : '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (editingItem) {
      await updateRequirement.mutateAsync({
        id: editingItem.id,
        requirement_type: formData.requirement_type,
        count: formData.count,
        special_requests: formData.special_requests ? { notes: formData.special_requests } : null,
      });
    } else {
      await createRequirement.mutateAsync({
        requirement_type: formData.requirement_type,
        count: formData.count,
        special_requests: formData.special_requests ? { notes: formData.special_requests } : null,
        event_id: eventId || '',
      });
    }
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this requirement?')) {
      await deleteRequirement.mutateAsync(id);
    }
  };

  // Calculate totals
  const totalCount = requirements.reduce((sum, r) => sum + r.count, 0);

  // Menu coverage analysis
  const menuCoverage = {
    vegetarian: menuItems.filter(m => m.is_vegetarian).length,
    vegan: menuItems.filter(m => m.is_vegan).length,
    gluten_free: menuItems.filter(m => m.is_gluten_free).length,
  };

  // Check for gaps (requirements without menu coverage)
  const coverageGaps = requirements.filter(req => {
    if (req.requirement_type === 'vegetarian' && menuCoverage.vegetarian === 0) return true;
    if (req.requirement_type === 'vegan' && menuCoverage.vegan === 0) return true;
    if (req.requirement_type === 'gluten_free' && menuCoverage.gluten_free === 0) return true;
    return false;
  });

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
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-emerald-500" />
            Dietary Report
          </h2>
          <p className="text-muted-foreground">Track and analyze dietary requirements</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Requirement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Requirement' : 'Add Dietary Requirement'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Requirement Type</Label>
                <Select
                  value={formData.requirement_type}
                  onValueChange={(v) => setFormData({ ...formData, requirement_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REQUIREMENT_TYPES.map(rt => (
                      <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Count (number of attendees)</Label>
                <Input
                  type="number"
                  value={formData.count}
                  onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) || 0 })}
                  min={0}
                />
              </div>

              <div className="space-y-2">
                <Label>Special Requests (optional)</Label>
                <Input
                  value={formData.special_requests}
                  onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                  placeholder="Any additional notes..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={createRequirement.isPending || updateRequirement.isPending}>
                  {(createRequirement.isPending || updateRequirement.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingItem ? 'Update' : 'Add'} Requirement
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{totalCount}</div>
                <div className="text-xs text-muted-foreground">Total with Dietary Needs</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{menuCoverage.vegetarian}</div>
                <div className="text-xs text-muted-foreground">Vegetarian Menu Items</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-emerald-500" />
              <div>
                <div className="text-2xl font-bold">{menuCoverage.vegan}</div>
                <div className="text-xs text-muted-foreground">Vegan Menu Items</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Wheat className="h-5 w-5 text-amber-500" />
              <div>
                <div className="text-2xl font-bold">{menuCoverage.gluten_free}</div>
                <div className="text-xs text-muted-foreground">Gluten-Free Items</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coverage Gaps Alert */}
      {coverageGaps.length > 0 && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              Menu Coverage Gaps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              The following dietary requirements have no matching menu items:
            </p>
            <div className="flex flex-wrap gap-2">
              {coverageGaps.map(gap => {
                const config = REQUIREMENT_TYPES.find(r => r.value === gap.requirement_type);
                return (
                  <Badge key={gap.id} variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                    {config?.label || gap.requirement_type}: {gap.count} attendees
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Requirements Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dietary Requirements Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {requirements.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No dietary requirements tracked yet. Add requirements to see the breakdown.
            </p>
          ) : (
            requirements.map(req => {
              const config = REQUIREMENT_TYPES.find(r => r.value === req.requirement_type);
              const Icon = config?.icon || FileText;
              const percentage = totalCount > 0 ? (req.count / totalCount) * 100 : 0;

              return (
                <div key={req.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={`${config?.bgColor} ${config?.color}`}>
                        <Icon className="h-3 w-3 mr-1" />
                        {config?.label || req.requirement_type}
                      </Badge>
                      <span className="font-medium">{req.count} attendees</span>
                      <span className="text-xs text-muted-foreground">({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => handleEdit(req)}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs text-destructive hover:text-destructive"
                        onClick={() => handleDelete(req.id)}
                        disabled={deleteRequirement.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  {req.special_requests && typeof req.special_requests === 'object' && 'notes' in req.special_requests && (
                    <p className="text-xs text-muted-foreground pl-2 border-l-2 border-muted">
                      {(req.special_requests as { notes: string }).notes}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Menu Coverage Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Menu Coverage Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Leaf className="h-5 w-5 text-green-500" />
                <span className="font-medium">Vegetarian</span>
              </div>
              <div className="text-2xl font-bold">{menuCoverage.vegetarian}</div>
              <p className="text-xs text-muted-foreground">menu items available</p>
              {menuCoverage.vegetarian === 0 && requirements.some(r => r.requirement_type === 'vegetarian') && (
                <Badge variant="outline" className="mt-2 bg-red-500/10 text-red-600 border-red-500/20">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  No coverage
                </Badge>
              )}
            </div>
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Leaf className="h-5 w-5 text-emerald-500" />
                <span className="font-medium">Vegan</span>
              </div>
              <div className="text-2xl font-bold">{menuCoverage.vegan}</div>
              <p className="text-xs text-muted-foreground">menu items available</p>
              {menuCoverage.vegan === 0 && requirements.some(r => r.requirement_type === 'vegan') && (
                <Badge variant="outline" className="mt-2 bg-red-500/10 text-red-600 border-red-500/20">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  No coverage
                </Badge>
              )}
            </div>
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Wheat className="h-5 w-5 text-amber-500" />
                <span className="font-medium">Gluten-Free</span>
              </div>
              <div className="text-2xl font-bold">{menuCoverage.gluten_free}</div>
              <p className="text-xs text-muted-foreground">menu items available</p>
              {menuCoverage.gluten_free === 0 && requirements.some(r => r.requirement_type === 'gluten_free') && (
                <Badge variant="outline" className="mt-2 bg-red-500/10 text-red-600 border-red-500/20">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  No coverage
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
