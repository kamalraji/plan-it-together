import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Server, Wifi, Users, AlertTriangle } from 'lucide-react';

interface TechDepartmentStatsCardsProps {
  workspaceId: string;
}

export function TechDepartmentStatsCards({ workspaceId }: TechDepartmentStatsCardsProps) {
  // Fetch child committees count
  const { data: committees = [] } = useQuery({
    queryKey: ['tech-dept-committees', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name')
        .eq('parent_workspace_id', workspaceId)
        .eq('workspace_type', 'COMMITTEE');
      if (error) throw error;
      return data;
    },
  });

  // Fetch all tasks from child committees
  const { data: tasks = [] } = useQuery({
    queryKey: ['tech-dept-tasks', workspaceId],
    queryFn: async () => {
      const committeeIds = committees.map(c => c.id);
      if (committeeIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('workspace_tasks')
        .select('id, status, priority')
        .in('workspace_id', committeeIds);
      if (error) throw error;
      return data;
    },
    enabled: committees.length > 0,
  });

  // Fetch all team members from child committees
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['tech-dept-members', workspaceId],
    queryFn: async () => {
      const committeeIds = committees.map(c => c.id);
      if (committeeIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('workspace_team_members')
        .select('id')
        .in('workspace_id', committeeIds)
        .eq('status', 'ACTIVE');
      if (error) throw error;
      return data;
    },
    enabled: committees.length > 0,
  });

  const activeTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const criticalTasks = tasks.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH').length;

  const stats = [
    {
      label: 'Active Systems',
      value: committees.length,
      subtext: 'Committees under management',
      icon: Server,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Network Status',
      value: '99.8%',
      subtext: 'Uptime this month',
      icon: Wifi,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Tech Team',
      value: teamMembers.length,
      subtext: 'Active members',
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Critical Issues',
      value: criticalTasks,
      subtext: `${activeTasks} tasks in progress`,
      icon: AlertTriangle,
      color: criticalTasks > 0 ? 'text-red-500' : 'text-green-500',
      bgColor: criticalTasks > 0 ? 'bg-red-500/10' : 'bg-green-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-xs text-muted-foreground/70">{stat.subtext}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
