import { Card, CardContent } from '@/components/ui/card';
import { Package, Truck, MapPin, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LogisticsStatsCardsProps {
  workspaceId: string;
}

export function LogisticsStatsCards({ workspaceId }: LogisticsStatsCardsProps) {
  const { data: resources = [] } = useQuery({
    queryKey: ['logistics-resources', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_resources')
        .select('*')
        .eq('workspace_id', workspaceId);
      if (error) throw error;
      return data;
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['logistics-tasks-stats', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_tasks')
        .select('id, status, priority')
        .eq('workspace_id', workspaceId);
      if (error) throw error;
      return data;
    },
  });

  const equipmentCount = resources.filter(r => r.type === 'equipment').length;
  const equipmentAvailable = resources.filter(r => r.type === 'equipment' && r.status === 'available').length;
  const venueCount = resources.filter(r => r.type === 'venue').length;
  const pendingTasks = tasks.filter(t => t.status === 'TODO' || t.status === 'IN_PROGRESS').length;
  const completedTasks = tasks.filter(t => t.status === 'DONE').length;
  const urgentTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'DONE').length;

  const stats = [
    {
      label: 'Total Equipment',
      value: equipmentCount,
      subValue: `${equipmentAvailable} available`,
      icon: Package,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-info/10',
    },
    {
      label: 'Active Shipments',
      value: pendingTasks,
      subValue: 'in progress',
      icon: Truck,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-warning/10',
    },
    {
      label: 'Venue Locations',
      value: venueCount,
      subValue: 'configured',
      icon: MapPin,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Pending Tasks',
      value: pendingTasks,
      subValue: `${completedTasks} completed`,
      icon: Clock,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-500/10',
    },
    {
      label: 'Completed',
      value: completedTasks,
      subValue: 'deliveries',
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Urgent Issues',
      value: urgentTasks,
      subValue: 'need attention',
      icon: AlertTriangle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-destructive/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xs text-muted-foreground/70">{stat.subValue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
