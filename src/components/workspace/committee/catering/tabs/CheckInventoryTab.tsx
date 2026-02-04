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
  Package,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  AlertTriangle,
  Check,
  RefreshCw,
  Filter,
  TrendingDown,
  ShoppingCart,
} from 'lucide-react';
import {
  useCateringInventory,
  useCateringInventoryMutations,
  type CateringInventoryItem,
} from '@/hooks/useCateringData';

interface CheckInventoryTabProps {
  workspaceId: string;
}

const CATEGORIES = [
  { value: 'food', label: 'Food', color: 'text-green-500', bgColor: 'bg-green-500/10' },
  { value: 'beverage', label: 'Beverage', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  { value: 'equipment', label: 'Equipment', color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  { value: 'supplies', label: 'Supplies', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
];

const STATUS_CONFIG = {
  adequate: { label: 'Adequate', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: Check },
  low: { label: 'Low Stock', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: TrendingDown },
  critical: { label: 'Critical', color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: AlertTriangle },
  ordered: { label: 'Ordered', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: RefreshCw },
};

export function CheckInventoryTab({ workspaceId }: CheckInventoryTabProps) {
  const { data: items = [], isLoading } = useCateringInventory(workspaceId);
  const { createItem, updateItem, deleteItem } = useCateringInventoryMutations(workspaceId);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CateringInventoryItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [formData, setFormData] = useState({
    name: '',
    category: 'food' as CateringInventoryItem['category'],
    current_stock: 0,
    required_stock: 0,
    unit: 'pcs',
    supplier: '',
  });

  const calculateStatus = (current: number, required: number): CateringInventoryItem['status'] => {
    if (required === 0) return 'adequate';
    const ratio = current / required;
    if (ratio < 0.2) return 'critical';
    if (ratio < 0.5) return 'low';
    return 'adequate';
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
    setEditingItem(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (item: CateringInventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      current_stock: item.current_stock,
      required_stock: item.required_stock,
      unit: item.unit,
      supplier: item.supplier || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    const status = calculateStatus(formData.current_stock, formData.required_stock);

    if (editingItem) {
      await updateItem.mutateAsync({
        id: editingItem.id,
        ...formData,
        status,
        supplier: formData.supplier || null,
      });
    } else {
      await createItem.mutateAsync({
        ...formData,
        status,
        supplier: formData.supplier || null,
      });
    }
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      await deleteItem.mutateAsync(id);
    }
  };

  const markAsOrdered = (id: string) => {
    updateItem.mutate({ id, status: 'ordered' });
  };

  // Filter items
  const filteredItems = items.filter(item => {
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    return true;
  });

  // Stats
  const stats = {
    total: items.length,
    adequate: items.filter(i => i.status === 'adequate').length,
    low: items.filter(i => i.status === 'low').length,
    critical: items.filter(i => i.status === 'critical').length,
    ordered: items.filter(i => i.status === 'ordered').length,
  };

  // Alerts (critical and low items)
  const alertItems = items.filter(i => i.status === 'critical' || i.status === 'low');

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
            <Package className="h-6 w-6 text-amber-500" />
            Check Inventory
          </h2>
          <p className="text-muted-foreground">Manage and track inventory levels</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Item' : 'Add Inventory Item'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Item Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Item name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData({ ...formData, category: v as CateringInventoryItem['category'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Current Stock</Label>
                  <Input
                    type="number"
                    value={formData.current_stock}
                    onChange={(e) => setFormData({ ...formData, current_stock: parseInt(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Required Stock</Label>
                  <Input
                    type="number"
                    value={formData.required_stock}
                    onChange={(e) => setFormData({ ...formData, required_stock: parseInt(e.target.value) || 0 })}
                    min={0}
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

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={createItem.isPending || updateItem.isPending}>
                  {(createItem.isPending || updateItem.isPending) && (
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Items</div>
          </CardContent>
        </Card>
        <Card className="border-green-500/20">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.adequate}</div>
            <div className="text-xs text-muted-foreground">Adequate</div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-amber-600">{stats.low}</div>
            <div className="text-xs text-muted-foreground">Low Stock</div>
          </CardContent>
        </Card>
        <Card className="border-red-500/20">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <div className="text-xs text-muted-foreground">Critical</div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.ordered}</div>
            <div className="text-xs text-muted-foreground">Ordered</div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {alertItems.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              Low Stock Alerts ({alertItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {alertItems.map(item => {
                const statusConfig = STATUS_CONFIG[item.status];
                return (
                  <Badge key={item.id} variant="outline" className={statusConfig.color}>
                    {item.name}: {item.current_stock}/{item.required_stock} {item.unit}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="adequate">Adequate</SelectItem>
            <SelectItem value="low">Low Stock</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="ordered">Ordered</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Inventory List */}
      <div className="space-y-3">
        {filteredItems.map(item => {
          const catConfig = CATEGORIES.find(c => c.value === item.category);
          const statusConfig = STATUS_CONFIG[item.status];
          const StatusIcon = statusConfig.icon;
          const stockPercentage = item.required_stock > 0
            ? Math.min((item.current_stock / item.required_stock) * 100, 100)
            : 100;

          return (
            <Card key={item.id}>
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={`${catConfig?.bgColor} ${catConfig?.color}`}>
                          {catConfig?.label || item.category}
                        </Badge>
                        <h4 className="font-medium">{item.name}</h4>
                      </div>
                      <Badge variant="outline" className={statusConfig.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3">
                      <Progress value={stockPercentage} className="flex-1 h-2" />
                      <span className="text-sm font-medium min-w-[100px] text-right">
                        {item.current_stock} / {item.required_stock} {item.unit}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{item.supplier || 'No supplier assigned'}</span>
                      <div className="flex gap-2">
                        {(item.status === 'low' || item.status === 'critical') && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs"
                            onClick={() => markAsOrdered(item.id)}
                            disabled={updateItem.isPending}
                          >
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            Mark Ordered
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => handleEdit(item)}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs text-destructive hover:text-destructive"
                          onClick={() => handleDelete(item.id)}
                          disabled={deleteItem.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-medium text-lg mb-1">No inventory items found</h3>
            <p className="text-muted-foreground text-sm">
              {items.length === 0
                ? 'Start by adding your first inventory item'
                : 'Try adjusting your filters'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
