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
  RefreshCw,
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
import { useCateringInventory, useCateringInventoryMutations, CateringInventoryItem } from '@/hooks/useCateringData';

interface InventoryTrackerProps {
  workspaceId: string;
}

export function InventoryTracker({ workspaceId }: InventoryTrackerProps) {
  const { data: items = [], isLoading } = useCateringInventory(workspaceId);
  const { createItem, updateItem } = useCateringInventoryMutations(workspaceId);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'food' as CateringInventoryItem['category'],
    current_stock: 0,
    required_stock: 0,
    unit: 'pcs',
    supplier: '',
  });

  const categoryConfig = {
    food: { label: 'Food', color: 'text-success', bgColor: 'bg-success/10' },
    beverage: { label: 'Beverage', color: 'text-info', bgColor: 'bg-info/10' },
    equipment: { label: 'Equipment', color: 'text-primary', bgColor: 'bg-primary/10' },
    supplies: { label: 'Supplies', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  };

  const statusConfig = {
    adequate: { label: 'Adequate', color: 'bg-success/10 text-success border-success/20', icon: Check },
    low: { label: 'Low Stock', color: 'bg-warning/10 text-warning border-warning/20', icon: AlertTriangle },
    critical: { label: 'Critical', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: AlertTriangle },
    ordered: { label: 'Ordered', color: 'bg-info/10 text-info border-info/20', icon: RefreshCw },
  };

  const calculateStatus = (current: number, required: number): CateringInventoryItem['status'] => {
    if (required === 0) return 'adequate';
    const ratio = current / required;
    if (ratio < 0.2) return 'critical';
    if (ratio < 0.5) return 'low';
    return 'adequate';
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    const status = calculateStatus(formData.current_stock, formData.required_stock);

    await createItem.mutateAsync({
      name: formData.name,
      category: formData.category,
      current_stock: formData.current_stock,
      required_stock: formData.required_stock,
      unit: formData.unit,
      status,
      supplier: formData.supplier || null,
    });

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'food',
      current_stock: 0,
      required_stock: 0,
      unit: 'pcs',
      supplier: '',
    });
    setIsDialogOpen(false);
  };

  const markAsOrdered = (id: string) => {
    updateItem.mutate({ id, status: 'ordered' });
  };

  const criticalItems = items.filter(i => i.status === 'critical').length;
  const lowItems = items.filter(i => i.status === 'low').length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Inventory Tracker
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
        <div>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Inventory Tracker
          </CardTitle>
          <div className="flex gap-2 mt-1">
            {criticalItems > 0 && (
              <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/20">
                {criticalItems} critical
              </Badge>
            )}
            {lowItems > 0 && (
              <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/20">
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
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as CateringInventoryItem['category'] })}
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
                    value={formData.current_stock}
                    onChange={(e) => setFormData({ ...formData, current_stock: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Required Stock</Label>
                  <Input
                    type="number"
                    value={formData.required_stock}
                    onChange={(e) => setFormData({ ...formData, required_stock: parseInt(e.target.value) || 0 })}
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
                <Button onClick={handleSubmit} disabled={createItem.isPending}>
                  {createItem.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Add Item
                </Button>
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
          const stockPercentage = item.required_stock > 0 
            ? Math.min((item.current_stock / item.required_stock) * 100, 100) 
            : 100;

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
                  {item.current_stock} / {item.required_stock} {item.unit}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{item.supplier || 'No supplier assigned'}</span>
                {(item.status === 'low' || item.status === 'critical') && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-6 text-xs" 
                    onClick={() => markAsOrdered(item.id)}
                    disabled={updateItem.isPending}
                  >
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
