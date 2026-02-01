import { Card, CardContent } from '@/components/ui/card';
import { Building, DoorOpen, Shield, Wrench, CheckCircle, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FacilityStatsCardsProps {
  workspaceId: string;
}

export function FacilityStatsCards({ workspaceId }: FacilityStatsCardsProps) {
  const { data: resources = [] } = useQuery({
    queryKey: ['facility-resources', workspaceId],
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
    queryKey: ['facility-tasks-stats', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_tasks')
        .select('id, status, priority, role_scope')
        .eq('workspace_id', workspaceId);
      if (error) throw error;
      return data;
    },
  });

  const venueCount = resources.filter(r => r.type === 'venue').length;
  const roomsReady = resources.filter(r => r.type === 'venue' && r.status === 'ready').length;
  const maintenanceTasks = tasks.filter(t => t.role_scope === 'maintenance').length;
  const pendingMaintenance = tasks.filter(t => t.role_scope === 'maintenance' && t.status !== 'DONE').length;
  const safetyChecks = tasks.filter(t => t.role_scope === 'safety').length;
  const safetyCompleted = tasks.filter(t => t.role_scope === 'safety' && t.status === 'DONE').length;
  const urgentIssues = tasks.filter(t => t.priority === 'high' && t.status !== 'DONE').length;

  const stats = [
    {
      label: 'Total Rooms',
      value: venueCount,
      subValue: `${roomsReady} ready`,
      icon: Building,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Setup Complete',
      value: roomsReady,
      subValue: `of ${venueCount}`,
      icon: DoorOpen,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Safety Checks',
      value: safetyCompleted,
      subValue: `of ${safetyChecks}`,
      icon: Shield,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Maintenance',
      value: maintenanceTasks,
      subValue: `${pendingMaintenance} pending`,
      icon: Wrench,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: 'Completed',
      value: tasks.filter(t => t.status === 'DONE').length,
      subValue: 'tasks done',
      icon: CheckCircle,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'Urgent Issues',
      value: urgentIssues,
      subValue: 'need attention',
      icon: AlertTriangle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-500/10',
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
