import { useDepartmentKPIs, DepartmentKPI, DepartmentInsight } from '@/hooks/useDepartmentKPIs';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, Target, Lightbulb, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DepartmentKPICardProps {
  workspaceId: string;
  departmentId: string | undefined;
}

export function DepartmentKPICard({ workspaceId, departmentId }: DepartmentKPICardProps) {
  const { kpis, insights, departmentInfo } = useDepartmentKPIs(workspaceId, departmentId);

  if (!departmentInfo || kpis.length === 0) {
    return null;
  }

  const getTrendIcon = (trend: DepartmentKPI['trend']) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-success" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-destructive" />;
      default:
        return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getInsightIcon = (type: DepartmentInsight['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-warning flex-shrink-0" />;
      default:
        return <Lightbulb className="h-4 w-4 text-info flex-shrink-0" />;
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Target className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">
            {departmentInfo.name} KPIs
          </h3>
          <p className="text-xs text-muted-foreground">Key performance indicators</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {kpis.map((kpi) => {
          const progress = kpi.unit === '%' 
            ? kpi.value 
            : Math.min(100, (kpi.value / kpi.target) * 100);
          
          return (
            <div key={kpi.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground truncate" title={kpi.description}>
                  {kpi.label}
                </span>
                {getTrendIcon(kpi.trend)}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-foreground">
                  {kpi.value}
                </span>
                {kpi.unit && (
                  <span className="text-xs text-muted-foreground">{kpi.unit}</span>
                )}
                <span className="text-xs text-muted-foreground">
                  / {kpi.target}{kpi.unit}
                </span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          );
        })}
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="border-t border-border pt-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase">Insights</p>
          {insights.map((insight, index) => (
            <div key={index} className="flex items-start gap-2">
              {getInsightIcon(insight.type)}
              <p className="text-sm text-foreground">{insight.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
