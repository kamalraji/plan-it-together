import { useEscalationWorkflow, formatOverdueTime, getSLAStatus } from '@/hooks/useEscalationWorkflow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, Clock, ArrowUpRight, RefreshCw,
  CheckCircle2, AlertCircle, XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OverdueItemsWidgetProps {
  workspaceId: string;
  compact?: boolean;
  maxItems?: number;
}

export function OverdueItemsWidget({ 
  workspaceId, 
  compact = false,
  maxItems = 5 
}: OverdueItemsWidgetProps) {
  const { 
    overdueItems, 
    itemsNeedingEscalation,
    isLoading, 
    escalateItem,
    isEscalating,
    refetch,
    stats 
  } = useEscalationWorkflow(workspaceId);

  const displayItems = overdueItems.slice(0, maxItems);

  const getSLABadge = (hours: number) => {
    const status = getSLAStatus(hours);
    switch (status) {
      case 'on_track':
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            On Track
          </Badge>
        );
      case 'at_risk':
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            <AlertCircle className="h-3 w-3 mr-1" />
            At Risk
          </Badge>
        );
      case 'breached':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <XCircle className="h-3 w-3 mr-1" />
            Breached
          </Badge>
        );
    }
  };

  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case 'task': return '📋';
      case 'approval': return '✅';
      case 'issue': return '⚠️';
      case 'ticket': return '🎫';
      default: return '📌';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
      case 'urgent':
        return 'text-destructive';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-warning';
      default:
        return 'text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <Card className={cn(compact && 'border-0 shadow-none')}>
        <CardContent className="py-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Compact header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="font-medium text-sm">Overdue Items</span>
            {stats.totalOverdue > 0 && (
              <Badge variant="destructive" className="text-xs">
                {stats.totalOverdue}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>

        {overdueItems.length === 0 ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No overdue items
          </div>
        ) : (
          <div className="space-y-2">
            {displayItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span>{getItemTypeIcon(item.type)}</span>
                  <span className="truncate">{item.title}</span>
                </div>
                <Badge variant="outline" className="text-xs shrink-0">
                  {formatOverdueTime(item.overdueByHours)}
                </Badge>
              </div>
            ))}
            {overdueItems.length > maxItems && (
              <p className="text-xs text-muted-foreground text-center">
                +{overdueItems.length - maxItems} more items
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div>
              <CardTitle className="text-lg">Overdue Items</CardTitle>
              <CardDescription>
                {stats.totalOverdue} items need attention
                {stats.needingEscalation > 0 && (
                  <span className="text-warning"> • {stats.needingEscalation} ready for escalation</span>
                )}
              </CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats summary */}
        {stats.totalOverdue > 0 && (
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Tasks:</span>
              <Badge variant="outline">{stats.byType.tasks}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Approvals:</span>
              <Badge variant="outline">{stats.byType.approvals}</Badge>
            </div>
            {stats.avgOverdueHours > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Avg: {formatOverdueTime(stats.avgOverdueHours)} overdue
                </span>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {overdueItems.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-10 w-10 text-success mx-auto mb-3" />
            <p className="text-muted-foreground">All caught up!</p>
            <p className="text-sm text-muted-foreground mt-1">
              No overdue items requiring attention
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {overdueItems.map((item) => {
                const needsEscalation = itemsNeedingEscalation.some(i => i.id === item.id);
                
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'p-4 rounded-lg border',
                      needsEscalation 
                        ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800' 
                        : 'bg-card'
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span>{getItemTypeIcon(item.type)}</span>
                          <span className="font-medium truncate">{item.title}</span>
                          {needsEscalation && (
                            <Badge variant="destructive" className="text-xs">
                              Needs Escalation
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className={getPriorityColor(item.priority)}>
                            {item.priority} priority
                          </span>
                          <span>•</span>
                          <span className="text-destructive font-medium">
                            {formatOverdueTime(item.overdueByHours)} overdue
                          </span>
                          {item.assigneeName && (
                            <>
                              <span>•</span>
                              <span>Assigned to {item.assigneeName}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {getSLABadge(item.overdueByHours)}
                        {needsEscalation && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => escalateItem({
                              itemId: item.id,
                              itemType: item.type,
                              escalateTo: 'parent_workspace',
                            })}
                            disabled={isEscalating}
                          >
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            Escalate
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
