import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { useWorkspaceExpenses } from '@/hooks/useWorkspaceExpenses';
import { Skeleton } from '@/components/ui/skeleton';

interface SpendingByCategoryProps {
  workspaceId: string;
}

const CATEGORY_COLORS = [
  'hsl(var(--primary))',
  'hsl(221, 83%, 53%)',
  'hsl(142, 76%, 36%)',
  'hsl(38, 92%, 50%)',
  'hsl(280, 65%, 60%)',
  'hsl(350, 89%, 60%)',
  'hsl(180, 70%, 45%)',
  'hsl(45, 93%, 47%)',
  'hsl(var(--muted-foreground))',
];

export function SpendingByCategory({ workspaceId }: SpendingByCategoryProps) {
  const { expenses, isLoading } = useWorkspaceExpenses(workspaceId);

  const { spendingData, totalSpending } = useMemo(() => {
    // Aggregate approved expenses by category
    const categoryTotals = expenses
      .filter(e => e.status === 'approved')
      .reduce((acc, expense) => {
        const category = expense.category || 'Other';
        acc[category] = (acc[category] || 0) + Number(expense.amount);
        return acc;
      }, {} as Record<string, number>);

    // Transform to chart data format
    const data = Object.entries(categoryTotals)
      .map(([name, value], index) => ({
        name,
        value,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value); // Sort by value descending

    const total = data.reduce((sum, item) => sum + item.value, 0);

    return { spendingData: data, totalSpending: total };
  }, [expenses]);

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${(amount / 1000).toFixed(0)}K`;
  };

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-6">
            <Skeleton className="w-32 h-32 rounded-full" />
            <div className="flex-1 space-y-2">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (spendingData.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <PieChartIcon className="w-5 h-5 text-primary" />
            </div>
            Spending by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <PieChartIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No approved expenses yet</p>
            <p className="text-xs mt-1">Approve expenses to see category breakdown</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <PieChartIcon className="w-5 h-5 text-primary" />
          </div>
          Spending by Category
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-6">
          {/* Pie Chart */}
          <div className="w-32 h-32 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={spendingData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={55}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {spendingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category List */}
          <div className="flex-1 space-y-2">
            {spendingData.slice(0, 6).map((category, index) => {
              const percentage = totalSpending > 0 
                ? Math.round((category.value / totalSpending) * 100) 
                : 0;
              return (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-xs flex-1 truncate">{category.name}</span>
                  <span className="text-xs text-muted-foreground">{percentage}%</span>
                  <span className="text-xs font-medium w-14 text-right">
                    {formatCurrency(category.value)}
                  </span>
                </div>
              );
            })}
            {spendingData.length > 6 && (
              <p className="text-xs text-muted-foreground">
                +{spendingData.length - 6} more categories
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Spending</span>
            <span className="font-semibold">{formatCurrency(totalSpending)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
