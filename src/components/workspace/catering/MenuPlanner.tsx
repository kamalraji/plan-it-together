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
  Trash2 
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
import { toast } from 'sonner';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  allergens: string[];
  servings: number;
  status: 'draft' | 'confirmed' | 'prepared';
}

interface MenuPlannerProps {
  workspaceId: string;
}

export function MenuPlanner({ workspaceId: _workspaceId }: MenuPlannerProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    {
      id: '1',
      name: 'Continental Breakfast',
      description: 'Fresh pastries, fruits, yogurt, and hot beverages',
      mealType: 'breakfast',
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: false,
      allergens: ['Gluten', 'Dairy'],
      servings: 450,
      status: 'confirmed',
    },
    {
      id: '2',
      name: 'Mediterranean Lunch',
      description: 'Grilled chicken/halloumi, fresh salads, hummus, pita',
      mealType: 'lunch',
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      allergens: ['Gluten', 'Dairy', 'Sesame'],
      servings: 450,
      status: 'confirmed',
    },
    {
      id: '3',
      name: 'Evening Gala Dinner',
      description: 'Three-course dinner with choice of main',
      mealType: 'dinner',
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      allergens: ['Various'],
      servings: 380,
      status: 'draft',
    },
    {
      id: '4',
      name: 'Afternoon Tea & Snacks',
      description: 'Coffee, tea, cookies, and light refreshments',
      mealType: 'snack',
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: false,
      allergens: ['Gluten', 'Dairy'],
      servings: 450,
      status: 'confirmed',
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    mealType: 'lunch' as MenuItem['mealType'],
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    allergens: '',
    servings: 450,
  });

  const mealTypeConfig = {
    breakfast: { icon: Coffee, label: 'Breakfast', color: 'text-amber-500' },
    lunch: { icon: Sun, label: 'Lunch', color: 'text-orange-500' },
    dinner: { icon: Moon, label: 'Dinner', color: 'text-indigo-500' },
    snack: { icon: Utensils, label: 'Snack', color: 'text-green-500' },
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a menu item name');
      return;
    }

    const newItem: MenuItem = {
      id: editingItem?.id || Date.now().toString(),
      name: formData.name,
      description: formData.description,
      mealType: formData.mealType,
      isVegetarian: formData.isVegetarian,
      isVegan: formData.isVegan,
      isGlutenFree: formData.isGlutenFree,
      allergens: formData.allergens.split(',').map(a => a.trim()).filter(Boolean),
      servings: formData.servings,
      status: 'draft',
    };

    if (editingItem) {
      setMenuItems(items => items.map(i => i.id === editingItem.id ? newItem : i));
      toast.success('Menu item updated');
    } else {
      setMenuItems(items => [...items, newItem]);
      toast.success('Menu item added');
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      mealType: 'lunch',
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      allergens: '',
      servings: 450,
    });
    setEditingItem(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      mealType: item.mealType,
      isVegetarian: item.isVegetarian,
      isVegan: item.isVegan,
      isGlutenFree: item.isGlutenFree,
      allergens: item.allergens.join(', '),
      servings: item.servings,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setMenuItems(items => items.filter(i => i.id !== id));
    toast.success('Menu item removed');
  };

  const confirmItem = (id: string) => {
    setMenuItems(items => items.map(i => 
      i.id === id ? { ...i, status: 'confirmed' as const } : i
    ));
    toast.success('Menu item confirmed');
  };

  const getMealItems = (type: MenuItem['mealType']) => menuItems.filter(i => i.mealType === type);

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
                    value={formData.mealType}
                    onChange={(e) => setFormData({ ...formData, mealType: e.target.value as MenuItem['mealType'] })}
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
                    checked={formData.isVegetarian}
                    onCheckedChange={(checked) => setFormData({ ...formData, isVegetarian: !!checked })}
                  />
                  <Label htmlFor="vegetarian">Vegetarian</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="vegan"
                    checked={formData.isVegan}
                    onCheckedChange={(checked) => setFormData({ ...formData, isVegan: !!checked })}
                  />
                  <Label htmlFor="vegan">Vegan</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="glutenFree"
                    checked={formData.isGlutenFree}
                    onCheckedChange={(checked) => setFormData({ ...formData, isGlutenFree: !!checked })}
                  />
                  <Label htmlFor="glutenFree">Gluten-Free</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={handleSubmit}>{editingItem ? 'Update' : 'Add'}</Button>
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
              {(tab === 'all' ? menuItems : getMealItems(tab as MenuItem['mealType'])).map((item) => {
                const config = mealTypeConfig[item.mealType];
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
                          {item.isVegetarian && (
                            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                              <Leaf className="h-3 w-3 mr-1" />
                              Vegetarian
                            </Badge>
                          )}
                          {item.isVegan && (
                            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                              Vegan
                            </Badge>
                          )}
                          {item.isGlutenFree && (
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
              {(tab === 'all' ? menuItems : getMealItems(tab as MenuItem['mealType'])).length === 0 && (
                <p className="text-center text-muted-foreground py-8">No menu items yet</p>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
