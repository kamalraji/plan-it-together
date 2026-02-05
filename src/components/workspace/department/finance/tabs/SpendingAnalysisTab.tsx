import { SpendingByCategory } from '@/components/workspace/finance/SpendingByCategory';
import { useWorkspaceExpenses, EXPENSE_CATEGORIES } from '@/hooks/useWorkspaceExpenses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import { useMemo } from 'react';

interface SpendingAnalysisTabProps {
  workspaceId: string;
}

export function SpendingAnalysisTab({ workspaceId }: SpendingAnalysisTabProps) {
  const { expenses, stats } = useWorkspaceExpenses(workspaceId);

  const categoryAnalysis = useMemo(() => {
    const categoryTotals = expenses
      .filter(e => e.status === 'approved')
      .reduce((acc, expense) => {
        const category = expense.category || 'Other';
        if (!acc[category]) {
          acc[category] = { total: 0, count: 0 };
        }
        acc[category].total += Number(expense.amount);
        acc[category].count += 1;
        return acc;
      }, {} as Record<string, { total: number; count: number }>);

    return Object.entries(categoryTotals)
      .map(([name, data]) => ({
        name,
        total: data.total,
        count: data.count,
        average: data.count > 0 ? data.total / data.count : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

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

  const topCategory = categoryAnalysis[0];
  const totalApproved = stats.approved;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-warning/10">
          <PieChart className="w-6 h-6 text-warning" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Spending Analysis</h1>
          <p className="text-sm text-muted-foreground">
            Analyze spending patterns and category breakdown
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-muted-foreground">Total Approved</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalApproved)}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="h-4 w-4 text-info" />
              <span className="text-sm text-muted-foreground">Top Category</span>
            </div>
            <p className="text-2xl font-bold">{topCategory?.name || 'N/A'}</p>
            {topCategory && (
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(topCategory.total)} ({topCategory.count} expenses)
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-muted-foreground">Categories Used</span>
            </div>
            <p className="text-2xl font-bold">{categoryAnalysis.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              of {EXPENSE_CATEGORIES.length} available
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <SpendingByCategory workspaceId={workspaceId} />

        {/* Category Breakdown Table */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryAnalysis.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No approved expenses to analyze
              </p>
            ) : (
              <div className="space-y-3">
                {categoryAnalysis.map((cat, index) => {
                  const percent = totalApproved > 0 
                    ? Math.round((cat.total / totalApproved) * 100) 
                    : 0;
                  
                  return (
                    <div key={cat.name} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                      <span className="text-sm font-medium text-muted-foreground w-6">
                        #{index + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{cat.name}</span>
                          <span className="text-sm font-semibold">{formatCurrency(cat.total)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{cat.count} expense{cat.count !== 1 ? 's' : ''}</span>
                          <span>·</span>
                          <span>Avg: {formatCurrency(cat.average)}</span>
                          <span>·</span>
                          <span>{percent}% of total</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
