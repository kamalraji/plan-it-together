import { Card, CardContent } from '@/components/ui/card';
import { 
  Wallet, 
  TrendingDown,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Receipt
} from 'lucide-react';
import { useWorkspaceBudget } from '@/hooks/useWorkspaceBudget';
import { useWorkspaceExpenses } from '@/hooks/useWorkspaceExpenses';
import { Skeleton } from '@/components/ui/skeleton';

interface FinancialSummaryCardsProps {
  workspaceId: string;
}

export function FinancialSummaryCards({ workspaceId }: FinancialSummaryCardsProps) {
  const { budget, isLoading: budgetLoading } = useWorkspaceBudget(workspaceId);
  const { stats, isLoading: expensesLoading } = useWorkspaceExpenses(workspaceId);

  const isLoading = budgetLoading || expensesLoading;

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalBudget = budget?.allocated || 0;
  const spent = budget?.used || 0;
  const available = totalBudget - spent;
  const utilizationPercent = totalBudget > 0 ? Math.round((spent / totalBudget) * 100) : 0;
  const remainingPercent = totalBudget > 0 ? Math.round((available / totalBudget) * 100) : 0;

  const cards = [
    {
      title: 'Total Budget',
      value: formatCurrency(totalBudget),
      subtitle: `${utilizationPercent}% utilized`,
      icon: Wallet,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: 'Spent',
      value: formatCurrency(spent),
      subtitle: `${formatCurrency(stats.approved)} approved expenses`,
      icon: TrendingDown,
      iconBg: 'bg-orange-500/10',
      iconColor: 'text-orange-600',
      trend: utilizationPercent > 80 ? -Math.round((utilizationPercent - 80)) : undefined,
      trendLabel: utilizationPercent > 80 ? 'over target' : undefined,
    },
    {
      title: 'Available',
      value: formatCurrency(available),
      subtitle: `${remainingPercent}% remaining`,
      icon: PiggyBank,
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-600',
      trend: remainingPercent > 20 ? remainingPercent : undefined,
    },
    {
      title: 'Pending',
      value: formatCurrency(stats.pending),
      subtitle: `${stats.pendingCount} expense${stats.pendingCount !== 1 ? 's' : ''} awaiting approval`,
      icon: Receipt,
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
      alert: stats.pendingCount > 5,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-border/50 bg-card/50">
            <CardContent className="p-4">
              <Skeleton className="h-10 w-10 rounded-lg mb-3" />
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card 
          key={index} 
          className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all"
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className={`p-2 rounded-lg ${card.iconBg}`}>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              {card.alert && (
                <AlertTriangle className="w-4 h-4 text-warning" />
              )}
              {card.trend !== undefined && (
                <div className={`flex items-center gap-0.5 text-xs font-medium ${
                  card.trend >= 0 ? 'text-emerald-600' : 'text-destructive'
                }`}>
                  {card.trend >= 0 ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {Math.abs(card.trend)}%
                </div>
              )}
            </div>
            
            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.title}</p>
            </div>
            
            <p className="text-xs text-muted-foreground mt-2">
              {card.subtitle}
              {card.trendLabel && (
                <span className="text-muted-foreground/70"> · {card.trendLabel}</span>
              )}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
