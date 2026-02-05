import { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useWorkspaceExpenses } from '@/hooks/useWorkspaceExpenses';
import { useWorkspaceBudget, useBudgetRequests } from '@/hooks/useWorkspaceBudget';
import { FileText, Download, Loader2, Calendar, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';

interface GenerateReportTabProps {
  workspace: Workspace;
}

type ReportType = 'budget-summary' | 'expense-report' | 'approval-history' | 'financial-overview';

export function GenerateReportTab({ workspace }: GenerateReportTabProps) {
  const { expenses, isLoading: expensesLoading } = useWorkspaceExpenses(workspace.id);
  const { budget, categories, isLoading: budgetLoading } = useWorkspaceBudget(workspace.id);
  const { requests, isLoading: requestsLoading } = useBudgetRequests(workspace.id, 'requester');

  const [reportType, setReportType] = useState<ReportType>('financial-overview');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const isLoading = expensesLoading || budgetLoading || requestsLoading;

  const generateCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filterByDate = <T extends { created_at?: string; submitted_at?: string }>(items: T[]) => {
    return items.filter(item => {
      const itemDate = new Date(item.created_at || item.submitted_at || '');
      if (dateFrom && itemDate < new Date(dateFrom)) return false;
      if (dateTo && itemDate > new Date(dateTo)) return false;
      return true;
    });
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    try {
      switch (reportType) {
        case 'budget-summary':
          const budgetData = [
            {
              'Workspace': workspace.name,
              'Total Allocated': budget?.allocated ?? 0,
              'Total Used': budget?.used ?? 0,
              'Remaining': (budget?.allocated ?? 0) - (budget?.used ?? 0),
              'Currency': budget?.currency ?? 'INR',
              'Fiscal Year': budget?.fiscal_year ?? 'N/A',
            },
            ...categories.map(cat => ({
              'Category': cat.name,
              'Allocated': cat.allocated,
              'Used': cat.used,
              'Remaining': cat.allocated - cat.used,
              'Currency': '',
              'Fiscal Year': '',
            }))
          ];
          generateCSV(budgetData, 'budget-summary');
          break;

        case 'expense-report':
          const filteredExpenses = filterByDate(expenses);
          const expenseData = filteredExpenses.map(exp => ({
            'Date': format(new Date(exp.submitted_at), 'yyyy-MM-dd'),
            'Description': exp.description,
            'Category': exp.category,
            'Amount': exp.amount,
            'Status': exp.status,
            'Notes': exp.notes ?? '',
          }));
          generateCSV(expenseData, 'expense-report');
          break;

        case 'approval-history':
          const filteredRequests = filterByDate(requests);
          const requestData = filteredRequests.map(req => ({
            'Date': format(new Date(req.created_at), 'yyyy-MM-dd'),
            'Amount Requested': req.requested_amount,
            'Reason': req.reason,
            'Status': req.status,
            'Reviewed At': req.reviewed_at ? format(new Date(req.reviewed_at), 'yyyy-MM-dd') : 'Pending',
            'Review Notes': req.review_notes ?? '',
          }));
          generateCSV(requestData, 'approval-history');
          break;

        case 'financial-overview':
          const overviewData = [
            { 'Metric': 'Total Budget Allocated', 'Value': budget?.allocated ?? 0 },
            { 'Metric': 'Total Budget Used', 'Value': budget?.used ?? 0 },
            { 'Metric': 'Budget Remaining', 'Value': (budget?.allocated ?? 0) - (budget?.used ?? 0) },
            { 'Metric': 'Total Expenses', 'Value': expenses.reduce((sum, e) => sum + Number(e.amount), 0) },
            { 'Metric': 'Pending Expenses', 'Value': expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + Number(e.amount), 0) },
            { 'Metric': 'Approved Expenses', 'Value': expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + Number(e.amount), 0) },
            { 'Metric': 'Pending Budget Requests', 'Value': requests.filter(r => r.status === 'pending').length },
          ];
          generateCSV(overviewData, 'financial-overview');
          break;
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-info" />
            Generate Financial Report
          </CardTitle>
          <CardDescription>
            Create reports from your budget, expenses, and approval data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Report Type Selection */}
          <div className="space-y-2">
            <Label>Report Type</Label>
            <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="financial-overview">Financial Overview</SelectItem>
                <SelectItem value="budget-summary">Budget Summary</SelectItem>
                <SelectItem value="expense-report">Expense Report</SelectItem>
                <SelectItem value="approval-history">Approval History</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-from" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                From Date (optional)
              </Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-to" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                To Date (optional)
              </Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Generate & Download CSV
          </Button>
        </CardContent>
      </Card>

      {/* Quick Stats Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-500" />
            Data Preview
          </CardTitle>
          <CardDescription>Current data that will be included in reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">₹{(budget?.allocated ?? 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Budget Allocated</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{expenses.length}</div>
              <p className="text-xs text-muted-foreground">Total Expenses</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-xs text-muted-foreground">Budget Categories</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{requests.length}</div>
              <p className="text-xs text-muted-foreground">Budget Requests</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
