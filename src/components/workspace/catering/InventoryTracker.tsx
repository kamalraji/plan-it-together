import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Package, 
  AlertTriangle, 
  Check, 
  RefreshCw
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface InventoryItem {
  id: string;
  name: string;
  category: 'food' | 'beverage' | 'equipment' | 'supplies';
  currentStock: number;
  requiredStock: number;
  unit: string;
  status: 'adequate' | 'low' | 'critical' | 'ordered';
  supplier?: string;
  lastUpdated: Date;
}

interface InventoryTrackerProps {
  workspaceId: string;
}

export function InventoryTracker({ workspaceId: _workspaceId }: InventoryTrackerProps) {
  const [items, setItems] = useState<InventoryItem[]>([
    {
      id: '1',
      name: 'Coffee Beans',
      category: 'beverage',
      currentStock: 25,
      requiredStock: 30,
      unit: 'kg',
      status: 'adequate',
      supplier: 'Premium Beverages Inc.',
      lastUpdated: new Date(),
    },
    {
      id: '2',
      name: 'Bottled Water',
      category: 'beverage',
      currentStock: 200,
      requiredStock: 500,
      unit: 'bottles',
      status: 'low',
      supplier: 'Local Distributor',
      lastUpdated: new Date(),
    },
    {
      id: '3',
      name: 'Napkins',
      category: 'supplies',
      currentStock: 100,
      requiredStock: 1000,
      unit: 'packs',
      status: 'critical',
      lastUpdated: new Date(),
    },
    {
      id: '4',
      name: 'Serving Plates',
      category: 'equipment',
      currentStock: 500,
      requiredStock: 500,
      unit: 'pcs',
      status: 'adequate',
      lastUpdated: new Date(),
    },
    {
      id: '5',
      name: 'Fresh Vegetables',
      category: 'food',
      currentStock: 0,
      requiredStock: 50,
      unit: 'kg',
      status: 'ordered',
      supplier: 'Farm Fresh',
      lastUpdated: new Date(),
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'food' as InventoryItem['category'],
    currentStock: 0,
    requiredStock: 0,
    unit: 'pcs',
    supplier: '',
  });

  const categoryConfig = {
    food: { label: 'Food', color: 'text-green-500', bgColor: 'bg-green-500/10' },
    beverage: { label: 'Beverage', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    equipment: { label: 'Equipment', color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    supplies: { label: 'Supplies', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  };

  const statusConfig = {
    adequate: { label: 'Adequate', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: Check },
    low: { label: 'Low Stock', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: AlertTriangle },
    critical: { label: 'Critical', color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: AlertTriangle },
    ordered: { label: 'Ordered', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: RefreshCw },
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter item name');
      return;
    }

    const stockRatio = formData.currentStock / formData.requiredStock;
    let status: InventoryItem['status'] = 'adequate';
    if (stockRatio < 0.2) status = 'critical';
    else if (stockRatio < 0.5) status = 'low';

    const newItem: InventoryItem = {
      id: Date.now().toString(),
      name: formData.name,
      category: formData.category,
      currentStock: formData.currentStock,
      requiredStock: formData.requiredStock,
      unit: formData.unit,
      status,
      supplier: formData.supplier || undefined,
      lastUpdated: new Date(),
    };

    setItems(i => [...i, newItem]);
    toast.success('Item added to inventory');
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'food',
      currentStock: 0,
      requiredStock: 0,
      unit: 'pcs',
      supplier: '',
    });
    setIsDialogOpen(false);
  };

  const markAsOrdered = (id: string) => {
    setItems(i => i.map(item => 
      item.id === id ? { ...item, status: 'ordered' as const, lastUpdated: new Date() } : item
    ));
    toast.success('Marked as ordered');
  };

  const criticalItems = items.filter(i => i.status === 'critical').length;
  const lowItems = items.filter(i => i.status === 'low').length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-500" />
            Inventory Tracker
          </CardTitle>
          <div className="flex gap-2 mt-1">
            {criticalItems > 0 && (
              <Badge variant="outline" className="text-xs bg-red-500/10 text-red-600 border-red-500/20">
                {criticalItems} critical
              </Badge>
            )}
            {lowItems > 0 && (
              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
                {lowItems} low
              </Badge>
            )}
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Inventory Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Item Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Item name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select 
                    className="w-full p-2 border rounded-md bg-background"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as InventoryItem['category'] })}
                  >
                    <option value="food">Food</option>
                    <option value="beverage">Beverage</option>
                    <option value="equipment">Equipment</option>
                    <option value="supplies">Supplies</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Current Stock</Label>
                  <Input
                    type="number"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Required Stock</Label>
                  <Input
                    type="number"
                    value={formData.requiredStock}
                    onChange={(e) => setFormData({ ...formData, requiredStock: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="pcs, kg, etc."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Supplier (optional)</Label>
                <Input
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="Supplier name"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={handleSubmit}>Add Item</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => {
          const catConfig = categoryConfig[item.category];
          const statConfig = statusConfig[item.status];
          const StatusIcon = statConfig.icon;
          const stockPercentage = Math.min((item.currentStock / item.requiredStock) * 100, 100);

          return (
            <div
              key={item.id}
              className="p-3 rounded-lg border border-border/50 bg-muted/30 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={`text-xs ${catConfig.bgColor} ${catConfig.color}`}>
                    {catConfig.label}
                  </Badge>
                  <h4 className="font-medium">{item.name}</h4>
                </div>
                <Badge variant="outline" className={`text-xs ${statConfig.color}`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statConfig.label}
                </Badge>
              </div>
              
              <div className="flex items-center gap-3">
                <Progress value={stockPercentage} className="flex-1 h-2" />
                <span className="text-sm font-medium min-w-[80px] text-right">
                  {item.currentStock} / {item.requiredStock} {item.unit}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{item.supplier || 'No supplier assigned'}</span>
                {(item.status === 'low' || item.status === 'critical') && (
                  <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => markAsOrdered(item.id)}>
                    Mark Ordered
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        
        {items.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No inventory items tracked</p>
        )}
      </CardContent>
    </Card>
  );
}
