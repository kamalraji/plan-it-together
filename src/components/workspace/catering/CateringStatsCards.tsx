import { Card, CardContent } from '@/components/ui/card';
import { Utensils, Users, AlertTriangle, Clock, ChefHat, Truck } from 'lucide-react';
import { useCateringStats } from '@/hooks/useCateringData';

interface CateringStatsCardsProps {
  workspaceId: string;
}

export function CateringStatsCards({ workspaceId }: CateringStatsCardsProps) {
  const stats = useCateringStats(workspaceId);

  const statCards = [
    {
      label: 'Head Count',
      value: stats.totalHeadCount,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Meals Planned',
      value: stats.mealsPlanned,
      icon: Utensils,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      label: 'Menu Items',
      value: stats.menuItems,
      icon: Clock,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Vendors',
      value: `${stats.vendorsConfirmed}/${stats.totalVendors}`,
      icon: ChefHat,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Low Stock Items',
      value: stats.criticalInventory,
      icon: AlertTriangle,
      color: stats.criticalInventory > 0 ? 'text-red-500' : 'text-amber-500',
      bgColor: stats.criticalInventory > 0 ? 'bg-red-500/10' : 'bg-amber-500/10',
    },
    {
      label: 'Pending Deliveries',
      value: stats.pendingDeliveries,
      icon: Truck,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.label} className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
