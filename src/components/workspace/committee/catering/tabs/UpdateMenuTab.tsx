import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  Utensils,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Leaf,
  Wheat,
  Check,
  Clock,
  ChefHat,
  Filter,
} from 'lucide-react';
import {
  useCateringMenuItems,
  useCateringMenuMutations,
  useCateringVendors,
  type CateringMenuItem,
} from '@/hooks/useCateringData';

interface UpdateMenuTabProps {
  workspaceId: string;
}

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', color: 'bg-amber-500' },
  { value: 'lunch', label: 'Lunch', color: 'bg-orange-500' },
  { value: 'dinner', label: 'Dinner', color: 'bg-rose-500' },
  { value: 'snack', label: 'Snack', color: 'bg-purple-500' },
];

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Check },
  prepared: { label: 'Prepared', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: ChefHat },
};

const ALLERGEN_OPTIONS = [
  'Peanuts', 'Tree Nuts', 'Dairy', 'Eggs', 'Wheat', 'Soy', 'Fish', 'Shellfish', 'Sesame'
];

export function UpdateMenuTab({ workspaceId }: UpdateMenuTabProps) {
  const { data: menuItems = [], isLoading } = useCateringMenuItems(workspaceId);
  const { data: vendors = [] } = useCateringVendors(workspaceId);
  const { createMenuItem, updateMenuItem, deleteMenuItem } = useCateringMenuMutations(workspaceId);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CateringMenuItem | null>(null);
  const [filterMealType, setFilterMealType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    meal_type: 'lunch' as CateringMenuItem['meal_type'],
    is_vegetarian: false,
    is_vegan: false,
    is_gluten_free: false,
    allergens: [] as string[],
    servings: 100,
    status: 'draft' as CateringMenuItem['status'],
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      meal_type: 'lunch',
      is_vegetarian: false,
      is_vegan: false,
      is_gluten_free: false,
      allergens: [],
      servings: 100,
      status: 'draft',
    });
    setEditingItem(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (item: CateringMenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      meal_type: item.meal_type,
      is_vegetarian: item.is_vegetarian,
      is_vegan: item.is_vegan,
      is_gluten_free: item.is_gluten_free,
      allergens: item.allergens || [],
      servings: item.servings,
      status: item.status,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    if (editingItem) {
      await updateMenuItem.mutateAsync({
        id: editingItem.id,
        ...formData,
      });
    } else {
      await createMenuItem.mutateAsync(formData);
    }
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this menu item?')) {
      await deleteMenuItem.mutateAsync(id);
    }
  };

  const toggleAllergen = (allergen: string) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen],
    }));
  };

  // Filter items
  const filteredItems = menuItems.filter(item => {
    if (filterMealType !== 'all' && item.meal_type !== filterMealType) return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    return true;
  });

  // Stats
  const stats = {
    total: menuItems.length,
    byMealType: MEAL_TYPES.map(mt => ({
      ...mt,
      count: menuItems.filter(i => i.meal_type === mt.value).length,
    })),
    confirmed: menuItems.filter(i => i.status === 'confirmed' || i.status === 'prepared').length,
    vegetarian: menuItems.filter(i => i.is_vegetarian).length,
    vegan: menuItems.filter(i => i.is_vegan).length,
    glutenFree: menuItems.filter(i => i.is_gluten_free).length,
  };

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
            <Utensils className="h-6 w-6 text-orange-500" />
            Update Menu
          </h2>
          <p className="text-muted-foreground">Manage menu items for all meals</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Menu Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Item Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Grilled Chicken Salad"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the dish..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Meal Type</Label>
                  <Select
                    value={formData.meal_type}
                    onValueChange={(v) => setFormData({ ...formData, meal_type: v as CateringMenuItem['meal_type'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEAL_TYPES.map(mt => (
                        <SelectItem key={mt.value} value={mt.value}>{mt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Servings</Label>
                  <Input
                    type="number"
                    value={formData.servings}
                    onChange={(e) => setFormData({ ...formData, servings: parseInt(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v as CateringMenuItem['status'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="prepared">Prepared</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Dietary Options</Label>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_vegetarian}
                      onCheckedChange={(v) => setFormData({ ...formData, is_vegetarian: v })}
                    />
                    <span className="text-sm flex items-center gap-1">
                      <Leaf className="h-4 w-4 text-green-500" />
                      Vegetarian
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_vegan}
                      onCheckedChange={(v) => setFormData({ ...formData, is_vegan: v })}
                    />
                    <span className="text-sm flex items-center gap-1">
                      <Leaf className="h-4 w-4 text-emerald-500" />
                      Vegan
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_gluten_free}
                      onCheckedChange={(v) => setFormData({ ...formData, is_gluten_free: v })}
                    />
                    <span className="text-sm flex items-center gap-1">
                      <Wheat className="h-4 w-4 text-amber-500" />
                      Gluten-Free
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Allergens</Label>
                <div className="flex flex-wrap gap-2">
                  {ALLERGEN_OPTIONS.map(allergen => (
                    <Badge
                      key={allergen}
                      variant={formData.allergens.includes(allergen) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleAllergen(allergen)}
                    >
                      {allergen}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={createMenuItem.isPending || updateMenuItem.isPending}>
                  {(createMenuItem.isPending || updateMenuItem.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingItem ? 'Update' : 'Add'} Item
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Items</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
            <div className="text-xs text-muted-foreground">Confirmed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.vegetarian}</div>
            <div className="text-xs text-muted-foreground">Vegetarian</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-emerald-600">{stats.vegan}</div>
            <div className="text-xs text-muted-foreground">Vegan</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-amber-600">{stats.glutenFree}</div>
            <div className="text-xs text-muted-foreground">Gluten-Free</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-purple-600">{vendors.filter(v => v.status === 'confirmed').length}</div>
            <div className="text-xs text-muted-foreground">Active Vendors</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        <Select value={filterMealType} onValueChange={setFilterMealType}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Meal Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Meals</SelectItem>
            {MEAL_TYPES.map(mt => (
              <SelectItem key={mt.value} value={mt.value}>{mt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="prepared">Prepared</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Menu Items Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map(item => {
          const mealConfig = MEAL_TYPES.find(m => m.value === item.meal_type);
          const statusConfig = STATUS_CONFIG[item.status];
          const StatusIcon = statusConfig.icon;

          return (
            <Card key={item.id} className="overflow-hidden">
              <div className={`h-1 ${mealConfig?.color || 'bg-muted'}`} />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{item.name}</CardTitle>
                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                    )}
                  </div>
                  <Badge variant="outline" className={statusConfig.color}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <Badge variant="secondary">{mealConfig?.label || item.meal_type}</Badge>
                  <span className="text-muted-foreground">{item.servings} servings</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {item.is_vegetarian && (
                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600">
                      <Leaf className="h-3 w-3 mr-1" />
                      Vegetarian
                    </Badge>
                  )}
                  {item.is_vegan && (
                    <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600">
                      <Leaf className="h-3 w-3 mr-1" />
                      Vegan
                    </Badge>
                  )}
                  {item.is_gluten_free && (
                    <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600">
                      <Wheat className="h-3 w-3 mr-1" />
                      GF
                    </Badge>
                  )}
                </div>

                {item.allergens && item.allergens.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Allergens:</span> {item.allergens.join(', ')}
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEdit(item)}>
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleDelete(item.id)}
                    disabled={deleteMenuItem.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Utensils className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-medium text-lg mb-1">No menu items found</h3>
            <p className="text-muted-foreground text-sm">
              {menuItems.length === 0
                ? 'Start by adding your first menu item'
                : 'Try adjusting your filters'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
