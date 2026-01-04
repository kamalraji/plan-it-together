import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface BudgetCategory {
  id?: string;
  name: string;
  allocated: number;
  used: number;
}

interface BudgetTrackerProps {
  allocated: number;
  used: number;
  currency?: string;
  showBreakdown?: boolean;
  categories?: BudgetCategory[];
}

export function BudgetTracker({ 
  allocated, 
  used, 
  currency = '₹',
  showBreakdown = true,
  categories: propCategories,
}: BudgetTrackerProps) {
  const remaining = allocated - used;
  const usagePercent = allocated > 0 ? Math.min((used / allocated) * 100, 100) : 0;
  const isOverBudget = used > allocated;
  const isNearLimit = usagePercent >= 80 && !isOverBudget;

  // Use provided categories or generate mock ones
  const categories: BudgetCategory[] = propCategories && propCategories.length > 0 
    ? propCategories 
    : [
        { name: 'Vendors', allocated: allocated * 0.4, used: used * 0.35 },
        { name: 'Equipment', allocated: allocated * 0.25, used: used * 0.3 },
        { name: 'Marketing', allocated: allocated * 0.2, used: used * 0.25 },
        { name: 'Miscellaneous', allocated: allocated * 0.15, used: used * 0.1 },
      ];

  const formatCurrency = (amount: number) => {
    return `${currency}${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm">
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Budget Overview</h3>
          </div>
          {isOverBudget && (
            <span className="flex items-center gap-1 text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded-full">
              <AlertCircle className="h-3 w-3" />
              Over Budget
            </span>
          )}
          {isNearLimit && (
            <span className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">
              <AlertCircle className="h-3 w-3" />
              Near Limit
            </span>
          )}
        </div>

        {/* Main budget stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Allocated</p>
            <p className="text-lg sm:text-xl font-bold text-foreground">{formatCurrency(allocated)}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Used</p>
            <p className={`text-lg sm:text-xl font-bold ${isOverBudget ? 'text-destructive' : 'text-foreground'}`}>
              {formatCurrency(used)}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Remaining</p>
            <p className={`text-lg sm:text-xl font-bold ${remaining < 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {formatCurrency(Math.abs(remaining))}
              {remaining < 0 && <span className="text-xs ml-1">deficit</span>}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Budget Utilization</span>
            <span className={`font-medium ${isOverBudget ? 'text-destructive' : isNearLimit ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
              {usagePercent.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={Math.min(usagePercent, 100)} 
            className={`h-2 ${isOverBudget ? '[&>div]:bg-destructive' : isNearLimit ? '[&>div]:bg-amber-500' : ''}`}
          />
        </div>

        {/* Category breakdown */}
        {showBreakdown && (
          <div className="space-y-3 pt-4 border-t border-border">
            <p className="text-sm font-medium text-muted-foreground">Breakdown by Category</p>
            {categories.map((category) => {
              const categoryPercent = category.allocated > 0 ? (category.used / category.allocated) * 100 : 0;
              return (
                <div key={category.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">{category.name}</span>
                    <span className="text-muted-foreground">
                      {formatCurrency(category.used)} / {formatCurrency(category.allocated)}
                    </span>
                  </div>
                  <Progress value={Math.min(categoryPercent, 100)} className="h-1.5" />
                </div>
              );
            })}
          </div>
        )}

        {/* Quick actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-border">
          <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">
            <TrendingUp className="h-4 w-4" />
            Request Increase
          </button>
          <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-muted-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors">
            <TrendingDown className="h-4 w-4" />
            View Expenses
          </button>
        </div>
      </div>
    </div>
  );
}
