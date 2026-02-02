import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Monitor, Wifi, Headphones, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TechnicalStatsCardsProps {
  workspaceId?: string;
  eventId?: string;
}

export function TechnicalStatsCards({ workspaceId, eventId }: TechnicalStatsCardsProps) {
  // Fetch equipment stats from workspace_equipment
  const { data: equipmentStats, isLoading: equipmentLoading } = useQuery({
    queryKey: ['technical-equipment-stats', workspaceId, eventId],
    queryFn: async () => {
      if (!workspaceId && !eventId) return { total: 0, operational: 0 };
      
      let query = supabase
        .from('workspace_equipment')
        .select('id, status');
      
      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }
      if (eventId) {
        query = query.eq('event_id', eventId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      const total = data?.length || 0;
      const operational = data?.filter(e => e.status === 'available' || e.status === 'in_use' || e.status === 'operational').length || 0;
      
      return { total, operational };
    },
    enabled: !!(workspaceId || eventId),
  });

  // Fetch support ticket stats from workspace_support_tickets
  const { data: ticketStats, isLoading: ticketsLoading } = useQuery({
    queryKey: ['technical-ticket-stats', workspaceId, eventId],
    queryFn: async () => {
      if (!workspaceId && !eventId) return { total: 0, highPriority: 0 };
      
      let query = supabase
        .from('workspace_support_tickets')
        .select('id, priority, status');
      
      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }
      if (eventId) {
        query = query.eq('event_id', eventId);
      }
      
      query = query.in('status', ['open', 'in_progress', 'pending']);
      
      const { data, error } = await query;
      if (error) throw error;
      
      const total = data?.length || 0;
      const highPriority = data?.filter(t => t.priority === 'high' || t.priority === 'critical').length || 0;
      
      return { total, highPriority };
    },
    enabled: !!(workspaceId || eventId),
  });

  // Fetch active issues (from tasks with status not done)
  const { data: issueStats, isLoading: issuesLoading } = useQuery({
    queryKey: ['technical-issue-stats', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return { activeIssues: 0 };
      
      const { data, error } = await supabase
        .from('workspace_tasks')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('priority', 'URGENT')
        .neq('status', 'DONE');
      
      if (error) throw error;
      
      return { activeIssues: data?.length || 0 };
    },
    enabled: !!workspaceId,
  });

  const isLoading = equipmentLoading || ticketsLoading || issuesLoading;

  const stats = [
    {
      label: 'AV Equipment',
      value: equipmentStats?.total ?? 0,
      subtext: `${equipmentStats?.operational ?? 0} operational`,
      icon: Monitor,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Network Status',
      value: '99.9%',
      subtext: 'Uptime today',
      icon: Wifi,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Support Tickets',
      value: ticketStats?.total ?? 0,
      subtext: `${ticketStats?.highPriority ?? 0} high priority`,
      icon: Headphones,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: 'Active Issues',
      value: issueStats?.activeIssues ?? 0,
      subtext: 'Requires attention',
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-9 w-9 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
              </div>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
