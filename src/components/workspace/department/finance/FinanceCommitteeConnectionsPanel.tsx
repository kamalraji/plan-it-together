import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  Receipt, 
  Users,
  ClipboardCheck,
  ChevronRight 
} from 'lucide-react';

interface FinanceCommitteeConnectionsPanelProps {
  workspaceId: string;
  eventId: string;
  orgSlug?: string;
}

export function FinanceCommitteeConnectionsPanel({ workspaceId, eventId, orgSlug }: FinanceCommitteeConnectionsPanelProps) {
  const navigate = useNavigate();

  // Fetch child committees
  const { data: committees = [] } = useQuery({
    queryKey: ['finance-dept-committee-connections', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, status')
        .eq('parent_workspace_id', workspaceId)
        .eq('workspace_type', 'COMMITTEE')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch budget data for each committee
  const { data: budgetData = {} } = useQuery({
    queryKey: ['finance-dept-committee-budgets', committees.map(c => c.id)],
    queryFn: async () => {
      const result: Record<string, { allocated: number; used: number }> = {};
      
      for (const committee of committees) {
        const { data, error } = await supabase
          .from('workspace_budgets')
          .select('allocated, used')
          .eq('workspace_id', committee.id)
          .maybeSingle();
        
        if (!error && data) {
          result[committee.id] = {
            allocated: data.allocated || 0,
            used: data.used || 0,
          };
        }
      }
      
      return result;
    },
    enabled: committees.length > 0,
  });

  const getCommitteeIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('finance')) return DollarSign;
    if (lower.includes('registration')) return ClipboardCheck;
    if (lower.includes('expense')) return Receipt;
    return Users;
  };

  const getCommitteeColor = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('finance')) return 'text-green-500 bg-green-500/10';
    if (lower.includes('registration')) return 'text-blue-500 bg-blue-500/10';
    if (lower.includes('expense')) return 'text-orange-500 bg-orange-500/10';
    return 'text-purple-500 bg-purple-500/10';
  };

  const handleCommitteeClick = (committeeId: string) => {
    const basePath = orgSlug ? `/${orgSlug}/workspaces` : '/workspaces';
    navigate(`${basePath}/${eventId}?workspaceId=${committeeId}`);
  };

  if (committees.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Finance Committees</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No finance committees found. Create Finance or Registration committees to see them here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Finance Committees</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {committees.map((committee) => {
          const Icon = getCommitteeIcon(committee.name);
          const colorClasses = getCommitteeColor(committee.name);
          const budget = budgetData[committee.id] || { allocated: 0, used: 0 };
          const utilizationPercent = budget.allocated > 0 
            ? Math.round((budget.used / budget.allocated) * 100) 
            : 0;

          return (
            <div
              key={committee.id}
              className="p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors"
              onClick={() => handleCommitteeClick(committee.id)}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colorClasses.split(' ')[1]}`}>
                  <Icon className={`h-4 w-4 ${colorClasses.split(' ')[0]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {committee.name}
                    </p>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={utilizationPercent} 
                      className="h-1.5 flex-1" 
                    />
                    <span className="text-xs text-muted-foreground">
                      ${(budget.used / 1000).toFixed(1)}k / ${(budget.allocated / 1000).toFixed(1)}k
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
