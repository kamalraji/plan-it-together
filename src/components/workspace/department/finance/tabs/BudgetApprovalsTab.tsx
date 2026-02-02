import { BudgetApprovalQueue } from '@/components/workspace/finance/BudgetApprovalQueue';
import { useWorkspaceExpenses } from '@/hooks/useWorkspaceExpenses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ClipboardCheck, 
  CheckCircle2, 
  Clock, 
  Check,
  X,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';

interface BudgetApprovalsTabProps {
  workspaceId: string;
}

export function BudgetApprovalsTab({ workspaceId }: BudgetApprovalsTabProps) {
  const { expenses, updateExpenseStatus, isUpdating } = useWorkspaceExpenses(workspaceId);
  
  const pendingExpenses = expenses.filter(e => e.status === 'pending');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleApprove = (id: string) => {
    updateExpenseStatus({ id, status: 'approved' });
  };

  const handleReject = (id: string) => {
    updateExpenseStatus({ id, status: 'rejected' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-orange-500/10">
          <ClipboardCheck className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Approvals Queue</h1>
          <p className="text-sm text-muted-foreground">
            Review and approve pending budget requests and expenses
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Requests Queue */}
        <BudgetApprovalQueue workspaceId={workspaceId} />

        {/* Pending Expenses */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Pending Expenses</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {pendingExpenses.length} expense{pendingExpenses.length !== 1 ? 's' : ''} awaiting review
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingExpenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No pending expenses</p>
              </div>
            ) : (
              pendingExpenses.map(expense => (
                <div
                  key={expense.id}
                  className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">{expense.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Badge variant="outline" className="text-xs">
                          {expense.category}
                        </Badge>
                        <span>·</span>
                        <span>{format(new Date(expense.submitted_at), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    <span className="font-semibold text-emerald-600">
                      {formatCurrency(expense.amount)}
                    </span>
                  </div>
                  
                  {expense.notes && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {expense.notes}
                    </p>
                  )}

                  <div className="flex items-center gap-2 justify-end">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 text-xs gap-1 text-destructive hover:bg-destructive/10"
                      onClick={() => handleReject(expense.id)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                      Reject
                    </Button>
                    <Button 
                      size="sm" 
                      className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => handleApprove(expense.id)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      Approve
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
