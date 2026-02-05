import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface EscalationHistoryItem {
  id: string;
  itemType: string;
  itemId: string;
  workspaceId: string;
  escalatedFrom: string | null;
  escalatedTo: string | null;
  escalationLevel: number;
  reason: string | null;
  slaStatus: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolutionNotes: string | null;
  createdAt: string;
}

interface EscalationHistoryPanelProps {
  workspaceId: string;
  maxItems?: number;
}

export function EscalationHistoryPanel({ workspaceId, maxItems = 20 }: EscalationHistoryPanelProps) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['escalation-history', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('escalation_history')
        .select('*')
        .or(`workspace_id.eq.${workspaceId},escalated_from.eq.${workspaceId},escalated_to.eq.${workspaceId}`)
        .order('created_at', { ascending: false })
        .limit(maxItems);

      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        itemType: row.item_type,
        itemId: row.item_id,
        workspaceId: row.workspace_id,
        escalatedFrom: row.escalated_from,
        escalatedTo: row.escalated_to,
        escalationLevel: row.escalation_level,
        reason: row.reason,
        slaStatus: row.sla_status,
        resolvedAt: row.resolved_at,
        resolvedBy: row.resolved_by,
        resolutionNotes: row.resolution_notes,
        createdAt: row.created_at,
      })) as EscalationHistoryItem[];
    },
  });

  const getSLABadge = (status: string | null) => {
    switch (status) {
      case 'met':
        return <Badge className="bg-success/10 text-success border-success/20">SLA Met</Badge>;
      case 'breached':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">SLA Breached</Badge>;
      case 'at_risk':
        return <Badge className="bg-warning/10 text-warning border-warning/20">At Risk</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case 'TASK':
        return '📋';
      case 'BUDGET_REQUEST':
        return '💰';
      case 'RESOURCE_REQUEST':
        return '📦';
      default:
        return '📌';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-info/10">
            <History className="h-5 w-5 text-info" />
          </div>
          <div>
            <CardTitle className="text-lg">Escalation History</CardTitle>
            <CardDescription>
              Audit trail of escalated items and resolutions
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No escalation history yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Escalated items will appear here
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="relative pl-6 pb-4 border-l-2 border-border last:pb-0"
                >
                  {/* Timeline dot */}
                  <div className={`absolute -left-2 top-0 w-4 h-4 rounded-full border-2 ${
                    item.resolvedAt 
                      ? 'bg-success border-success' 
                      : 'bg-warning border-warning'
                  }`} />

                  <div className="bg-muted/30 rounded-lg p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span>{getItemTypeIcon(item.itemType)}</span>
                        <span className="font-medium text-sm">
                          {item.itemType.replace('_', ' ')}
                        </span>
                        {getSLABadge(item.slaStatus)}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </span>
                    </div>

                    {/* Reason */}
                    {item.reason && (
                      <p className="text-sm text-foreground mb-2">
                        {item.reason}
                      </p>
                    )}

                    {/* Escalation path */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <ArrowUpRight className="h-3 w-3" />
                      <span>Level {item.escalationLevel} escalation</span>
                    </div>

                    {/* Resolution info */}
                    {item.resolvedAt ? (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          <span className="text-success font-medium">Resolved</span>
                          <span className="text-muted-foreground">
                            {format(new Date(item.resolvedAt), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                        {item.resolutionNotes && (
                          <p className="text-sm text-muted-foreground mt-1 italic">
                            "{item.resolutionNotes}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-warning" />
                          <span className="text-warning font-medium">Pending resolution</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
