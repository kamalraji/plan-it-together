import { useState } from 'react';
import { Package, Users, MapPin, Laptop, Plus, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWorkspaceResources, ResourceType, ResourceStatus } from '@/hooks/useWorkspaceResources';

interface ResourceManagerProps {
  departmentId?: string;
  workspaceId?: string;
}

const typeConfig: Record<ResourceType, { icon: React.ComponentType<any>; color: string; bgColor: string }> = {
  equipment: { icon: Package, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-500/10' },
  personnel: { icon: Users, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-500/10' },
  venue: { icon: MapPin, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-500/10' },
  digital: { icon: Laptop, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-500/10' },
};

const statusConfig: Record<ResourceStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  available: { label: 'Available', variant: 'default' },
  reserved: { label: 'Reserved', variant: 'secondary' },
  in_use: { label: 'In Use', variant: 'outline' },
  depleted: { label: 'Depleted', variant: 'destructive' },
};

export function ResourceManager({ workspaceId }: ResourceManagerProps) {
  const { resources, createResource, isLoading, isCreating } = useWorkspaceResources(workspaceId);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'equipment' as ResourceType,
    quantity: '1',
  });

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !formData.name) return;

    createResource({
      workspace_id: workspaceId,
      name: formData.name,
      type: formData.type,
      quantity: parseInt(formData.quantity),
      available: parseInt(formData.quantity),
      status: 'available',
      assigned_to_workspace_id: null,
      assigned_to_name: null,
      metadata: {},
    });

    setFormData({ name: '', type: 'equipment', quantity: '1' });
    setIsAdding(false);
  };

  const totalResources = resources.length;
  const lowAvailability = resources.filter(r => r.available === 0 && r.status !== 'depleted').length;

  const groupedResources = resources.reduce((acc, resource) => {
    if (!acc[resource.type]) acc[resource.type] = [];
    acc[resource.type].push(resource);
    return acc;
  }, {} as Record<ResourceType, typeof resources>);

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm">
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-secondary/50">
              <Package className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground">Resource Pool</h3>
              <p className="text-xs text-muted-foreground">{totalResources} resources tracked</p>
            </div>
          </div>
          {!isAdding && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAdding(true)}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          )}
        </div>

        {/* Add Resource Form */}
        {isAdding && (
          <form onSubmit={handleAddResource} className="mb-4 p-4 bg-muted/50 rounded-lg space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Resource name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
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
            <div className="space-y-1">
              <Label>Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as ResourceType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="personnel">Personnel</SelectItem>
                  <SelectItem value="venue">Venue</SelectItem>
                  <SelectItem value="digital">Digital</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={isCreating || !formData.name}>
                Add Resource
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Alert for low availability */}
        {lowAvailability > 0 && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-warning/10 border border-warning/20">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              {lowAvailability} resource{lowAvailability > 1 ? 's' : ''} fully allocated
            </p>
          </div>
        )}

        {/* Resource list grouped by type */}
        <div className="space-y-4">
          {(Object.entries(groupedResources) as [ResourceType, typeof resources][]).map(([type, typeResources]) => {
            const config = typeConfig[type];
            const Icon = config.icon;
            
            return (
              <div key={type} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded ${config.bgColor}`}>
                    <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                  </div>
                  <span className="text-sm font-medium text-foreground capitalize">{type}</span>
                  <span className="text-xs text-muted-foreground">({typeResources.length})</span>
                </div>
                
                <div className="space-y-2 pl-7">
                  {typeResources.map((resource) => {
                    const statusCfg = statusConfig[resource.status];
                    const utilizationPercent = resource.quantity > 0 
                      ? ((resource.quantity - resource.available) / resource.quantity) * 100 
                      : 0;
                    
                    return (
                      <div 
                        key={resource.id} 
                        className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground truncate">{resource.name}</span>
                            <Badge variant={statusCfg.variant} className="text-[10px] px-1.5 py-0">
                              {statusCfg.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {resource.available}/{resource.quantity} available
                            </span>
                            {resource.assigned_to_name && (
                              <span className="text-xs text-primary">
                                → {resource.assigned_to_name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-16 h-1.5 rounded-full bg-muted ml-3">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              utilizationPercent >= 100 ? 'bg-destructive' : 
                              utilizationPercent >= 75 ? 'bg-warning' : 'bg-primary'
                            }`}
                            style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {resources.length === 0 && !isAdding && (
          <p className="text-sm text-muted-foreground text-center py-8">No resources added yet.</p>
        )}

        {/* Quick stats */}
        {resources.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{resources.filter(r => r.status === 'available').length}</p>
              <p className="text-xs text-muted-foreground">Available</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{resources.filter(r => r.status === 'in_use').length}</p>
              <p className="text-xs text-muted-foreground">In Use</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{resources.filter(r => r.status === 'reserved').length}</p>
              <p className="text-xs text-muted-foreground">Reserved</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
