import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Receipt, 
  Plus, 
  Search, 
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Check,
  X,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { useWorkspaceExpenses, EXPENSE_CATEGORIES, WorkspaceExpense } from '@/hooks/useWorkspaceExpenses';
import { CreateExpenseDialog } from './CreateExpenseDialog';
import { Skeleton } from '@/components/ui/skeleton';

interface ExpenseTrackerProps {
  workspaceId: string;
  showApprovalActions?: boolean;
}

const categories = ['All', ...EXPENSE_CATEGORIES];

export function ExpenseTracker({ workspaceId, showApprovalActions = false }: ExpenseTrackerProps) {
  const { 
    expenses, 
    stats, 
    isLoading, 
    createExpense, 
    isCreating,
    updateExpenseStatus,
    isUpdating 
  } = useWorkspaceExpenses(workspaceId);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || expense.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || expense.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (status: WorkspaceExpense['status']) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
    }
  };

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

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-success/10">
              <Receipt className="w-5 h-5 text-success" />
              </div>
              <div>
                <CardTitle className="text-lg">Expense Tracker</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {formatCurrency(stats.pending)} pending · {formatCurrency(stats.approved)} approved
                </p>
              </div>
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4" />
              Add Expense
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Expense List */}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filteredExpenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>{expenses.length === 0 ? 'No expenses recorded yet' : 'No expenses found'}</p>
              </div>
            ) : (
              filteredExpenses.map(expense => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-background">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{expense.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{expense.category}</span>
                        <span>·</span>
                        <span>{format(new Date(expense.submitted_at), 'MMM d')}</span>
                        {expense.notes && (
                          <>
                            <span>·</span>
                            <span className="truncate max-w-[120px]">{expense.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm">{formatCurrency(expense.amount)}</span>
                    {getStatusBadge(expense.status)}
                    
                    {/* Approval Actions for pending expenses */}
                    {showApprovalActions && expense.status === 'pending' && (
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                          onClick={() => handleReject(expense.id)}
                          disabled={isUpdating}
                        >
                          {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 w-7 p-0 bg-success hover:bg-success/90"
                          onClick={() => handleApprove(expense.id)}
                          disabled={isUpdating}
                        >
                          {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-4 h-4" />}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <CreateExpenseDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={createExpense}
        isSubmitting={isCreating}
      />
    </>
  );
}
