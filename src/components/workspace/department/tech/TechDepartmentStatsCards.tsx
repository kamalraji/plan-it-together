import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Server, Users, AlertTriangle, CheckCircle2, Wrench } from 'lucide-react';

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

  const committeeIds = committees.map(c => c.id);

  // Fetch all tasks from this workspace and child committees
  const { data: tasks = [] } = useQuery({
    queryKey: ['tech-dept-tasks', workspaceId, committeeIds],
    queryFn: async () => {
      const allWorkspaceIds = [workspaceId, ...committeeIds];
      
      const { data, error } = await supabase
        .from('workspace_tasks')
        .select('id, status, priority')
        .in('workspace_id', allWorkspaceIds);
      if (error) throw error;
      return data;
    },
    enabled: true,
  });

  // Fetch all team members from this workspace and child committees
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['tech-dept-members', workspaceId, committeeIds],
    queryFn: async () => {
      const allWorkspaceIds = [workspaceId, ...committeeIds];
      
      const { data, error } = await supabase
        .from('workspace_team_members')
        .select('id')
        .in('workspace_id', allWorkspaceIds)
        .eq('status', 'ACTIVE');
      if (error) throw error;
      return data;
    },
    enabled: true,
  });

  // Equipment stats - simplified since table may not exist yet
  const totalEquipment = 0;
  const operationalEquipment = 0;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'DONE' || t.status === 'COMPLETED').length;
  const activeTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const criticalTasks = tasks.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH').length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const equipmentHealthRate = totalEquipment > 0 ? Math.round((operationalEquipment / totalEquipment) * 100) : 100;

  const stats = [
    {
      label: 'System Status',
      value: `${equipmentHealthRate}%`,
      subtext: `${totalEquipment} equipment items tracked`,
      icon: equipmentHealthRate >= 90 ? CheckCircle2 : equipmentHealthRate >= 70 ? Wrench : AlertTriangle,
      color: equipmentHealthRate >= 90 ? 'text-green-500' : equipmentHealthRate >= 70 ? 'text-amber-500' : 'text-red-500',
      bgColor: equipmentHealthRate >= 90 ? 'bg-green-500/10' : equipmentHealthRate >= 70 ? 'bg-amber-500/10' : 'bg-red-500/10',
    },
    {
      label: 'Task Progress',
      value: `${taskCompletionRate}%`,
      subtext: `${completedTasks}/${totalTasks} completed`,
      icon: Server,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Tech Team',
      value: teamMembers.length,
      subtext: `${committees.length} committees`,
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
        <Card key={stat.label} className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-xs text-muted-foreground/70 truncate">{stat.subtext}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
