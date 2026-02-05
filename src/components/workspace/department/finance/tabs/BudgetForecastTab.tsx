import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Target } from 'lucide-react';
import { useWorkspaceBudget } from '@/hooks/useWorkspaceBudget';
import { useWorkspaceExpenses } from '@/hooks/useWorkspaceExpenses';
import { Progress } from '@/components/ui/progress';

interface BudgetForecastTabProps {
  workspaceId: string;
}

export function BudgetForecastTab({ workspaceId }: BudgetForecastTabProps) {
  const { budget } = useWorkspaceBudget(workspaceId);
  const { stats } = useWorkspaceExpenses(workspaceId);

  const allocated = budget?.allocated || 0;
  const used = budget?.used || 0;
  const remaining = allocated - used;
  const utilizationPercent = allocated > 0 ? Math.round((used / allocated) * 100) : 0;

  // Simple forecast based on current spending rate
  const pendingTotal = stats.pending;
  
  // Project spending if all pending expenses are approved
  const projectedSpending = used + pendingTotal;
  const projectedRemaining = allocated - projectedSpending;
  const projectedUtilization = allocated > 0 ? Math.round((projectedSpending / allocated) * 100) : 0;

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

  const getHealthStatus = (percent: number) => {
    if (percent < 60) return { label: 'Healthy', color: 'text-success', bgColor: 'bg-success/10' };
    if (percent < 80) return { label: 'Moderate', color: 'text-warning', bgColor: 'bg-warning/10' };
    if (percent < 100) return { label: 'High Usage', color: 'text-warning', bgColor: 'bg-warning/10' };
    return { label: 'Over Budget', color: 'text-destructive', bgColor: 'bg-destructive/10' };
  };

  const currentHealth = getHealthStatus(utilizationPercent);
  const projectedHealth = getHealthStatus(projectedUtilization);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-success/10">
          <TrendingUp className="w-6 h-6 text-success" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Budget Forecast</h1>
          <p className="text-sm text-muted-foreground">
            Project future spending and budget health
          </p>
        </div>
      </div>

      {/* Current vs Projected */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Status */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Current Status</CardTitle>
              <Badge className={`${currentHealth.bgColor} ${currentHealth.color} border-0`}>
                {currentHealth.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Budget Utilization</span>
                <span className="font-semibold">{utilizationPercent}%</span>
              </div>
              <Progress value={utilizationPercent} className="h-3" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">Used</p>
                <p className="text-lg font-bold">{formatCurrency(used)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">Remaining</p>
                <p className="text-lg font-bold">{formatCurrency(remaining)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projected Status */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Projected Status</CardTitle>
              <Badge className={`${projectedHealth.bgColor} ${projectedHealth.color} border-0`}>
                {projectedHealth.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">If all pending approved</span>
                <span className="font-semibold">{projectedUtilization}%</span>
              </div>
              <Progress value={Math.min(projectedUtilization, 100)} className="h-3" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">Projected Spend</p>
                <p className="text-lg font-bold">{formatCurrency(projectedSpending)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">Projected Remaining</p>
                <p className={`text-lg font-bold ${projectedRemaining < 0 ? 'text-destructive' : ''}`}>
                  {formatCurrency(projectedRemaining)}
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              * Based on {stats.pendingCount} pending expense{stats.pendingCount !== 1 ? 's' : ''} 
              totaling {formatCurrency(pendingTotal)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-muted-foreground" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {utilizationPercent < 50 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-success/5 border border-success/20">
                <ArrowUpRight className="h-5 w-5 text-success mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Budget on track</p>
                  <p className="text-xs text-muted-foreground">
                    You've used {utilizationPercent}% of your budget. You have room for additional spending if needed.
                  </p>
                </div>
              </div>
            )}
            {utilizationPercent >= 50 && utilizationPercent < 80 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/5 border border-warning/20">
                <Calendar className="h-5 w-5 text-warning mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Monitor spending closely</p>
                  <p className="text-xs text-muted-foreground">
                    You've used {utilizationPercent}% of your budget. Consider prioritizing essential expenses.
                  </p>
                </div>
              </div>
            )}
            {utilizationPercent >= 80 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <ArrowDownRight className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Budget constraint alert</p>
                  <p className="text-xs text-muted-foreground">
                    You've used {utilizationPercent}% of your budget. Review pending expenses and consider requesting additional budget.
                  </p>
                </div>
              </div>
            )}
            {stats.pendingCount > 5 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-info/5 border border-info/20">
                <Calendar className="h-5 w-5 text-info mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Pending approvals queue</p>
                  <p className="text-xs text-muted-foreground">
                    You have {stats.pendingCount} expenses pending approval. Consider reviewing and processing them soon.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
