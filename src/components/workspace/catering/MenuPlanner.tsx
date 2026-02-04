import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Utensils, 
  Coffee, 
  Sun, 
  Moon,
  Leaf,
  AlertTriangle,
  Check,
  Edit2,
  Trash2,
  Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useCateringMenuItems, useCateringMenuMutations, CateringMenuItem } from '@/hooks/useCateringData';

interface MenuPlannerProps {
  workspaceId: string;
}

export function MenuPlanner({ workspaceId }: MenuPlannerProps) {
  const { data: menuItems = [], isLoading } = useCateringMenuItems(workspaceId);
  const { createMenuItem, updateMenuItem, deleteMenuItem } = useCateringMenuMutations(workspaceId);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CateringMenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    meal_type: 'lunch' as CateringMenuItem['meal_type'],
    is_vegetarian: false,
    is_vegan: false,
    is_gluten_free: false,
    allergens: '',
    servings: 450,
  });

  const mealTypeConfig = {
    breakfast: { icon: Coffee, label: 'Breakfast', color: 'text-amber-500' },
    lunch: { icon: Sun, label: 'Lunch', color: 'text-orange-500' },
    dinner: { icon: Moon, label: 'Dinner', color: 'text-indigo-500' },
    snack: { icon: Utensils, label: 'Snack', color: 'text-green-500' },
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    const itemData = {
      name: formData.name,
      description: formData.description || null,
      meal_type: formData.meal_type,
      is_vegetarian: formData.is_vegetarian,
      is_vegan: formData.is_vegan,
      is_gluten_free: formData.is_gluten_free,
      allergens: formData.allergens.split(',').map(a => a.trim()).filter(Boolean),
      servings: formData.servings,
      status: 'draft' as const,
    };

    if (editingItem) {
      await updateMenuItem.mutateAsync({ id: editingItem.id, ...itemData });
    } else {
      await createMenuItem.mutateAsync(itemData);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      meal_type: 'lunch',
      is_vegetarian: false,
      is_vegan: false,
      is_gluten_free: false,
      allergens: '',
      servings: 450,
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
      allergens: item.allergens.join(', '),
      servings: item.servings,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMenuItem.mutate(id);
  };

  const confirmItem = (id: string) => {
    updateMenuItem.mutate({ id, status: 'confirmed' });
  };

  const getMealItems = (type: CateringMenuItem['meal_type']) => menuItems.filter(i => i.meal_type === type);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-orange-500" />
            Menu Planner
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Utensils className="h-5 w-5 text-orange-500" />
          Menu Planner
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Item Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Continental Breakfast"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the menu item..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Meal Type</Label>
                  <select 
                    className="w-full p-2 border rounded-md bg-background"
                    value={formData.meal_type}
                    onChange={(e) => setFormData({ ...formData, meal_type: e.target.value as CateringMenuItem['meal_type'] })}
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Servings</Label>
                  <Input
                    type="number"
                    value={formData.servings}
                    onChange={(e) => setFormData({ ...formData, servings: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Allergens (comma-separated)</Label>
                <Input
                  value={formData.allergens}
                  onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                  placeholder="e.g., Gluten, Dairy, Nuts"
                />
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="vegetarian"
                    checked={formData.is_vegetarian}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_vegetarian: !!checked })}
                  />
                  <Label htmlFor="vegetarian">Vegetarian</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="vegan"
                    checked={formData.is_vegan}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_vegan: !!checked })}
                  />
                  <Label htmlFor="vegan">Vegan</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="glutenFree"
                    checked={formData.is_gluten_free}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_gluten_free: !!checked })}
                  />
                  <Label htmlFor="glutenFree">Gluten-Free</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={createMenuItem.isPending || updateMenuItem.isPending}
                >
                  {(createMenuItem.isPending || updateMenuItem.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingItem ? 'Update' : 'Add'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All ({menuItems.length})</TabsTrigger>
            <TabsTrigger value="breakfast">Breakfast ({getMealItems('breakfast').length})</TabsTrigger>
            <TabsTrigger value="lunch">Lunch ({getMealItems('lunch').length})</TabsTrigger>
            <TabsTrigger value="dinner">Dinner ({getMealItems('dinner').length})</TabsTrigger>
            <TabsTrigger value="snack">Snacks ({getMealItems('snack').length})</TabsTrigger>
          </TabsList>

          {['all', 'breakfast', 'lunch', 'dinner', 'snack'].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-3">
              {(tab === 'all' ? menuItems : getMealItems(tab as CateringMenuItem['meal_type'])).map((item) => {
                const config = mealTypeConfig[item.meal_type];
                const Icon = config.icon;
                return (
                  <div
                    key={item.id}
                    className="flex items-start justify-between p-3 rounded-lg border border-border/50 bg-muted/30"
                  >
                    <div className="flex gap-3">
                      <div className={`p-2 rounded-lg bg-background ${config.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{item.name}</h4>
                          <Badge variant={item.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs">
                            {item.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.is_vegetarian && (
                            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                              <Leaf className="h-3 w-3 mr-1" />
                              Vegetarian
                            </Badge>
                          )}
                          {item.is_vegan && (
                            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                              Vegan
                            </Badge>
                          )}
                          {item.is_gluten_free && (
                            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
                              GF
                            </Badge>
                          )}
                          {item.allergens.length > 0 && (
                            <Badge variant="outline" className="text-xs bg-red-500/10 text-red-600 border-red-500/20">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {item.allergens.join(', ')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{item.servings} servings</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {item.status === 'draft' && (
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => confirmItem(item.id)}>
                          <Check className="h-4 w-4 text-green-500" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(item)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {(tab === 'all' ? menuItems : getMealItems(tab as CateringMenuItem['meal_type'])).length === 0 && (
                <p className="text-center text-muted-foreground py-8">No menu items yet</p>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
