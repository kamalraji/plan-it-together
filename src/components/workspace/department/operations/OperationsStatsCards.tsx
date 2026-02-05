import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, Truck, UtensilsCrossed, Building2, Users, AlertTriangle } from 'lucide-react';

interface OperationsStatsCardsProps {
  workspaceId: string;
}

export function OperationsStatsCards({ workspaceId }: OperationsStatsCardsProps) {
  // Fetch child committees
  const { data: committees = [] } = useQuery({
    queryKey: ['ops-dept-committees', workspaceId],
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
    queryKey: ['ops-dept-tasks', workspaceId],
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
    queryKey: ['ops-dept-members', workspaceId],
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

  // Categorize committees
  const eventCommittees = committees.filter(c => c.name.toLowerCase().includes('event'));
  const logisticsCommittees = committees.filter(c => 
    c.name.toLowerCase().includes('logistics') || 
    c.name.toLowerCase().includes('transport')
  );
  const cateringCommittees = committees.filter(c => 
    c.name.toLowerCase().includes('catering') || 
    c.name.toLowerCase().includes('food')
  );
  const facilityCommittees = committees.filter(c => 
    c.name.toLowerCase().includes('facility') || 
    c.name.toLowerCase().includes('venue')
  );

  const criticalTasks = tasks.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH').length;
  const completedTasks = tasks.filter(t => t.status === 'DONE').length;
  const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const stats = [
    {
      label: 'Event Committees',
      value: eventCommittees.length,
      subtext: 'Day-of execution teams',
      icon: CalendarDays,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      label: 'Logistics Teams',
      value: logisticsCommittees.length,
      subtext: 'Transport & equipment',
      icon: Truck,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Catering Units',
      value: cateringCommittees.length,
      subtext: 'Food & beverage',
      icon: UtensilsCrossed,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: 'Facility Teams',
      value: facilityCommittees.length,
      subtext: 'Venue management',
      icon: Building2,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Ops Team',
      value: teamMembers.length,
      subtext: 'Active members',
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Critical Issues',
      value: criticalTasks,
      subtext: `${completionRate}% tasks complete`,
      icon: AlertTriangle,
      color: criticalTasks > 0 ? 'text-destructive' : 'text-success',
      bgColor: criticalTasks > 0 ? 'bg-destructive/10' : 'bg-success/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-border">
          <CardContent className="p-4">
            <div className="flex flex-col gap-2">
              <div className={`p-2 rounded-lg ${stat.bgColor} w-fit`}>
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
