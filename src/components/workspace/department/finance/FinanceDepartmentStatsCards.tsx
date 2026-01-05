import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Receipt, TrendingUp, AlertTriangle } from 'lucide-react';

interface FinanceDepartmentStatsCardsProps {
  workspaceId: string;
}

export function FinanceDepartmentStatsCards({ workspaceId }: FinanceDepartmentStatsCardsProps) {
  // Fetch child committees
  const { data: committees = [] } = useQuery({
    queryKey: ['finance-dept-committees', workspaceId],
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

  // Fetch budget data
  const { data: budget } = useQuery({
    queryKey: ['finance-dept-budget', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_budgets')
        .select('allocated, used')
        .eq('workspace_id', workspaceId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch pending budget requests
  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['finance-dept-pending-requests', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_budget_requests')
        .select('id, requested_amount')
        .eq('target_workspace_id', workspaceId)
        .eq('status', 'PENDING');
      if (error) throw error;
      return data;
    },
  });

  const totalBudget = budget?.allocated || 0;
  const usedBudget = budget?.used || 0;
  const remainingBudget = totalBudget - usedBudget;
  const utilizationRate = totalBudget > 0 ? Math.round((usedBudget / totalBudget) * 100) : 0;
  const pendingAmount = pendingRequests.reduce((sum, req) => sum + (req.requested_amount || 0), 0);

  const stats = [
    {
      label: 'Total Budget',
      value: `$${(totalBudget / 1000).toFixed(1)}k`,
      subtext: `${committees.length} committees`,
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Spent',
      value: `$${(usedBudget / 1000).toFixed(1)}k`,
      subtext: `${utilizationRate}% utilized`,
      icon: Receipt,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Remaining',
      value: `$${(remainingBudget / 1000).toFixed(1)}k`,
      subtext: 'Available funds',
      icon: TrendingUp,
      color: remainingBudget > 0 ? 'text-emerald-500' : 'text-red-500',
      bgColor: remainingBudget > 0 ? 'bg-emerald-500/10' : 'bg-red-500/10',
    },
    {
      label: 'Pending',
      value: `$${(pendingAmount / 1000).toFixed(1)}k`,
      subtext: `${pendingRequests.length} requests`,
      icon: AlertTriangle,
      color: pendingRequests.length > 0 ? 'text-yellow-500' : 'text-muted-foreground',
      bgColor: pendingRequests.length > 0 ? 'bg-yellow-500/10' : 'bg-muted/50',
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
