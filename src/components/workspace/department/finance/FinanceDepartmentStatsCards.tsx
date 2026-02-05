import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Receipt, TrendingUp, AlertTriangle, FileText } from 'lucide-react';
import { useWorkspaceExpenses } from '@/hooks/useWorkspaceExpenses';
import { useWorkspaceInvoices } from '@/hooks/useWorkspaceInvoices';

interface FinanceDepartmentStatsCardsProps {
  workspaceId: string;
}

export function FinanceDepartmentStatsCards({ workspaceId }: FinanceDepartmentStatsCardsProps) {
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

  // Get expense stats
  const { stats: expenseStats } = useWorkspaceExpenses(workspaceId);

  // Get invoice stats
  const { stats: invoiceStats } = useWorkspaceInvoices(workspaceId);

  const totalBudget = budget?.allocated || 0;
  const usedBudget = budget?.used || 0;
  const remainingBudget = totalBudget - usedBudget;
  const utilizationRate = totalBudget > 0 ? Math.round((usedBudget / totalBudget) * 100) : 0;

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}k`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  const stats = [
    {
      label: 'Total Budget',
      value: formatCurrency(totalBudget),
      subtext: `${utilizationRate}% utilized`,
      icon: DollarSign,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Expenses',
      value: formatCurrency(expenseStats.total),
      subtext: `${expenseStats.pending > 0 ? formatCurrency(expenseStats.pending) + ' pending' : 'All processed'}`,
      icon: Receipt,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      label: 'Invoices Outstanding',
      value: formatCurrency(invoiceStats.totalOutstanding),
      subtext: invoiceStats.overdueCount > 0 
        ? `${invoiceStats.overdueCount} overdue`
        : `${invoiceStats.sentCount} awaiting payment`,
      icon: FileText,
      color: invoiceStats.overdueCount > 0 ? 'text-warning' : 'text-primary',
      bgColor: invoiceStats.overdueCount > 0 ? 'bg-warning/10' : 'bg-primary/10',
    },
    {
      label: 'Remaining',
      value: formatCurrency(remainingBudget),
      subtext: pendingRequests.length > 0 
        ? `${pendingRequests.length} pending requests`
        : 'Available funds',
      icon: remainingBudget > 0 ? TrendingUp : AlertTriangle,
      color: remainingBudget > 0 ? 'text-emerald-500' : 'text-destructive',
      bgColor: remainingBudget > 0 ? 'bg-emerald-500/10' : 'bg-destructive/10',
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
                <p className="text-xl font-bold text-foreground truncate">{stat.value}</p>
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
