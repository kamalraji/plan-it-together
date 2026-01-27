import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
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
  Search,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Loader2,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CateringInventoryTabProps {
  workspaceId: string;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  requiredStock: number;
  unit: string;
  status: 'sufficient' | 'low' | 'critical' | 'out';
  supplier?: string | null;
}

export function CateringInventoryTab({ workspaceId }: CateringInventoryTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'food',
    currentStock: 0,
    requiredStock: 0,
    unit: 'units',
    supplier: '',
  });
  const queryClient = useQueryClient();

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['catering-inventory', workspaceId],
    queryFn: async (): Promise<InventoryItem[]> => {
      const { data, error } = await supabase
        .from('catering_inventory')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('name');

      if (error) throw error;

      return (data || []).map(item => {
        const ratio = item.required_stock > 0 ? item.current_stock / item.required_stock : 1;
        let status: InventoryItem['status'] = 'sufficient';
        if (item.current_stock === 0) status = 'out';
        else if (ratio <= 0.25) status = 'critical';
        else if (ratio <= 0.5) status = 'low';

        return {
          id: item.id,
          name: item.name,
          category: item.category,
          currentStock: item.current_stock,
          requiredStock: item.required_stock,
          unit: item.unit,
          status,
          supplier: item.supplier,
        };
      });
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (item: typeof newItem) => {
      const { error } = await supabase
        .from('catering_inventory')
        .insert({
          workspace_id: workspaceId,
          name: item.name,
          category: item.category,
          current_stock: item.currentStock,
          required_stock: item.requiredStock,
          unit: item.unit,
          supplier: item.supplier || null,
          status: 'in_stock',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catering-inventory', workspaceId] });
      setIsAddOpen(false);
      setNewItem({ name: '', category: 'food', currentStock: 0, requiredStock: 0, unit: 'units', supplier: '' });
      toast.success('Item added to inventory');
    },
    onError: () => {
      toast.error('Failed to add item');
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ id, currentStock }: { id: string; currentStock: number }) => {
      const { error } = await supabase
        .from('catering_inventory')
        .update({ current_stock: currentStock, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catering-inventory', workspaceId] });
      toast.success('Stock updated');
    },
  });

  const categories = ['all', ...new Set(inventory.map(i => i.category))];

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const criticalCount = inventory.filter(i => i.status === 'critical' || i.status === 'out').length;
  const lowCount = inventory.filter(i => i.status === 'low').length;

  const getStatusBadge = (status: string) => {
    const config = {
      'sufficient': { class: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', label: 'Sufficient' },
      'low': { class: 'bg-amber-500/10 text-amber-600 border-amber-500/20', label: 'Low Stock' },
      'critical': { class: 'bg-red-500/10 text-red-600 border-red-500/20', label: 'Critical' },
      'out': { class: 'bg-slate-500/10 text-muted-foreground border-slate-500/20', label: 'Out of Stock' },
    };
    const { class: className, label } = config[status as keyof typeof config] || config.sufficient;
    return <Badge variant="outline" className={className}>{label}</Badge>;
  };

  const getStockColor = (status: string) => {
    if (status === 'sufficient') return 'bg-emerald-500';
    if (status === 'low') return 'bg-amber-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Inventory Management</h2>
          <p className="text-muted-foreground">Track and manage catering supplies</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Inventory Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Item Name</Label>
                <Input
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g., Napkins"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={newItem.category} onValueChange={(v) => setNewItem({ ...newItem, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="beverage">Beverage</SelectItem>
                      <SelectItem value="supplies">Supplies</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Unit</Label>
                  <Select value={newItem.unit} onValueChange={(v) => setNewItem({ ...newItem, unit: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="units">Units</SelectItem>
                      <SelectItem value="kg">Kilograms</SelectItem>
                      <SelectItem value="liters">Liters</SelectItem>
                      <SelectItem value="boxes">Boxes</SelectItem>
                      <SelectItem value="packs">Packs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Current Stock</Label>
                  <Input
                    type="number"
                    value={newItem.currentStock}
                    onChange={(e) => setNewItem({ ...newItem, currentStock: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Required Stock</Label>
                  <Input
                    type="number"
                    value={newItem.requiredStock}
                    onChange={(e) => setNewItem({ ...newItem, requiredStock: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <Label>Supplier (optional)</Label>
                <Input
                  value={newItem.supplier}
                  onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                  placeholder="e.g., ABC Supplies"
                />
              </div>
              <Button 
                onClick={() => addItemMutation.mutate(newItem)} 
                disabled={!newItem.name || addItemMutation.isPending}
                className="w-full"
              >
                {addItemMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alerts */}
      {(criticalCount > 0 || lowCount > 0) && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">Inventory Alerts</p>
                <p className="text-sm text-amber-700">
                  {criticalCount > 0 && `${criticalCount} items critical. `}
                  {lowCount > 0 && `${lowCount} items running low.`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Package className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inventory.length}</p>
                <p className="text-xs text-muted-foreground">Total Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inventory.filter(i => i.status === 'sufficient').length}</p>
                <p className="text-xs text-muted-foreground">Sufficient Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <TrendingDown className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{lowCount}</p>
                <p className="text-xs text-muted-foreground">Low Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{criticalCount}</p>
                <p className="text-xs text-muted-foreground">Critical/Out</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory List */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-500" />
              Inventory Items
            </CardTitle>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredInventory.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <h3 className="font-medium">No inventory items</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery ? 'No matches found' : 'Add items to track your inventory'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredInventory.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-lg border transition-colors',
                    item.status === 'critical' && 'bg-red-50/50 border-red-200',
                    item.status === 'out' && 'bg-muted/50/50 border-border',
                    item.status === 'low' && 'bg-amber-50/50 border-amber-200'
                  )}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{item.name}</p>
                        <Badge variant="secondary" className="text-[10px]">
                          {item.category}
                        </Badge>
                      </div>
                      {item.supplier && (
                        <p className="text-xs text-muted-foreground">Supplier: {item.supplier}</p>
                      )}
                    </div>
                    <div className="w-48">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Stock Level</span>
                        <span className="font-medium">
                          {item.currentStock} / {item.requiredStock} {item.unit}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(100, (item.currentStock / item.requiredStock) * 100)} 
                        className={cn('h-2', `[&>div]:${getStockColor(item.status)}`)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    {getStatusBadge(item.status)}
                    <Input
                      type="number"
                      value={item.currentStock}
                      onChange={(e) => updateStockMutation.mutate({ 
                        id: item.id, 
                        currentStock: Number(e.target.value) 
                      })}
                      className="w-20 h-8 text-center"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
