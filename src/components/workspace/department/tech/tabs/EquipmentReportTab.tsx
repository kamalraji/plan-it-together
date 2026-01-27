import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Monitor, Laptop, Printer, Phone, Headphones, Server, Plus, Package, Wrench } from 'lucide-react';

interface EquipmentReportTabProps {
  workspaceId: string;
}

const equipment = [
  { id: 1, name: 'Dell OptiPlex 7090', type: 'desktop', status: 'in-use', assignee: 'John Smith', location: 'Office A', warranty: 'Valid' },
  { id: 2, name: 'MacBook Pro 14"', type: 'laptop', status: 'in-use', assignee: 'Jane Doe', location: 'Remote', warranty: 'Valid' },
  { id: 3, name: 'HP LaserJet Pro', type: 'printer', status: 'maintenance', assignee: 'Shared', location: 'Floor 2', warranty: 'Expired' },
  { id: 4, name: 'Cisco IP Phone', type: 'phone', status: 'available', assignee: 'Unassigned', location: 'Storage', warranty: 'Valid' },
  { id: 5, name: 'Jabra Evolve2 75', type: 'headset', status: 'in-use', assignee: 'Mike Johnson', location: 'Office B', warranty: 'Valid' },
  { id: 6, name: 'Dell PowerEdge R740', type: 'server', status: 'in-use', assignee: 'IT Dept', location: 'Server Room', warranty: 'Valid' },
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'desktop': return <Monitor className="h-4 w-4" />;
    case 'laptop': return <Laptop className="h-4 w-4" />;
    case 'printer': return <Printer className="h-4 w-4" />;
    case 'phone': return <Phone className="h-4 w-4" />;
    case 'headset': return <Headphones className="h-4 w-4" />;
    case 'server': return <Server className="h-4 w-4" />;
    default: return <Package className="h-4 w-4" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'in-use': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">In Use</Badge>;
    case 'available': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Available</Badge>;
    case 'maintenance': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Maintenance</Badge>;
    default: return null;
  }
};

export function EquipmentReportTab({ workspaceId: _workspaceId }: EquipmentReportTabProps) {
  const inUse = equipment.filter(e => e.status === 'in-use').length;
  const available = equipment.filter(e => e.status === 'available').length;
  const maintenance = equipment.filter(e => e.status === 'maintenance').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Equipment Report</h2>
          <p className="text-muted-foreground">Track and manage IT equipment inventory</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Equipment
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{equipment.length}</p>
                <p className="text-sm text-muted-foreground">Total Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Monitor className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold text-emerald-500">{inUse}</p>
                <p className="text-sm text-muted-foreground">In Use</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-500">{available}</p>
                <p className="text-sm text-muted-foreground">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Wrench className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold text-amber-500">{maintenance}</p>
                <p className="text-sm text-muted-foreground">Maintenance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Equipment List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Equipment Inventory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {equipment.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-muted">
                    {getTypeIcon(item.type)}
                  </div>
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.assignee} • {item.location}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={item.warranty === 'Valid' ? 'outline' : 'destructive'}>
                    {item.warranty}
                  </Badge>
                  {getStatusBadge(item.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
