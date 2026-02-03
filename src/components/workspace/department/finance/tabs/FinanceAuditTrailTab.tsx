import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { History, Search, Filter, Download, CheckCircle2, Clock, XCircle, DollarSign, Receipt, FileText } from 'lucide-react';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useWorkspaceExpenses } from '@/hooks/useWorkspaceExpenses';
import { useWorkspaceBudget, useBudgetRequests } from '@/hooks/useWorkspaceBudget';
import { Skeleton } from '@/components/ui/skeleton';

interface FinanceAuditTrailTabProps {
  workspaceId: string;
}

interface AuditEntry {
  id: string;
  type: 'expense' | 'budget_request' | 'budget_change';
  action: string;
  description: string;
  amount?: number;
  status?: string;
  timestamp: string;
  actor?: string;
}

export function FinanceAuditTrailTab({ workspaceId }: FinanceAuditTrailTabProps) {
  const { expenses, isLoading: expensesLoading } = useWorkspaceExpenses(workspaceId);
  const { isLoading: budgetLoading } = useWorkspaceBudget(workspaceId);
  const { requests, isLoading: requestsLoading } = useBudgetRequests(workspaceId, 'approver');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const isLoading = expensesLoading || budgetLoading || requestsLoading;

  // Combine all financial activities into audit entries
  const auditEntries = useMemo<AuditEntry[]>(() => {
    const entries: AuditEntry[] = [];

    // Add expense entries
    expenses.forEach(expense => {
      entries.push({
        id: `expense-${expense.id}`,
        type: 'expense',
        action: expense.status === 'approved' ? 'Expense Approved' : 
                expense.status === 'rejected' ? 'Expense Rejected' : 'Expense Submitted',
        description: expense.description,
        amount: expense.amount,
        status: expense.status,
        timestamp: expense.submitted_at,
      });
    });

    // Add budget request entries
    requests.forEach(request => {
      entries.push({
        id: `request-${request.id}`,
        type: 'budget_request',
        action: request.status === 'approved' ? 'Budget Request Approved' :
                request.status === 'rejected' ? 'Budget Request Rejected' : 'Budget Request Submitted',
        description: request.reason,
        amount: request.requested_amount,
        status: request.status,
        timestamp: request.created_at,
      });
    });

    // Sort by timestamp descending
    return entries.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [expenses, requests]);

  const filteredEntries = useMemo(() => {
    return auditEntries.filter(entry => {
      const matchesSearch = entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           entry.action.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || entry.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [auditEntries, searchTerm, typeFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
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
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'expense':
        return <Receipt className="w-4 h-4 text-blue-500" />;
      case 'budget_request':
        return <DollarSign className="w-4 h-4 text-emerald-500" />;
      case 'budget_change':
        return <FileText className="w-4 h-4 text-purple-500" />;
      default:
        return <History className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-12 w-full" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-indigo-500/10">
          <History className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Finance Audit Trail</h1>
          <p className="text-sm text-muted-foreground">
            Complete history of financial activities
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search audit entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="expense">Expenses</SelectItem>
                <SelectItem value="budget_request">Budget Requests</SelectItem>
                <SelectItem value="budget_change">Budget Changes</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Entries */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No audit entries found</p>
              <p className="text-sm mt-1">Financial activities will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-background">
                      {getTypeIcon(entry.type)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{entry.action}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {entry.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(entry.timestamp), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {entry.amount !== undefined && (
                      <span className="font-semibold text-sm">
                        {formatCurrency(entry.amount)}
                      </span>
                    )}
                    {getStatusBadge(entry.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}