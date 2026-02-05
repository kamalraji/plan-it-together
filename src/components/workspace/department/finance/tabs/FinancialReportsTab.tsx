import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileSpreadsheet, 
  Download, 
  FileText, 
  BarChart3,
  Calendar,
  Clock
} from 'lucide-react';
import { useWorkspaceBudget } from '@/hooks/useWorkspaceBudget';
import { useWorkspaceExpenses } from '@/hooks/useWorkspaceExpenses';
import { toast } from 'sonner';

interface FinancialReportsTabProps {
  workspaceId: string;
}

export function FinancialReportsTab({ workspaceId }: FinancialReportsTabProps) {
  const { budget } = useWorkspaceBudget(workspaceId);
  const { expenses, stats } = useWorkspaceExpenses(workspaceId);

  const reportTypes = [
    {
      id: 'budget-summary',
      name: 'Budget Summary',
      description: 'Overview of budget allocation vs spending',
      icon: BarChart3,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      id: 'expense-report',
      name: 'Expense Report',
      description: 'Detailed list of all expenses with status',
      icon: FileText,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
    },
    {
      id: 'category-breakdown',
      name: 'Category Breakdown',
      description: 'Spending analysis by category',
      icon: FileSpreadsheet,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      id: 'monthly-summary',
      name: 'Monthly Summary',
      description: 'Month-by-month financial overview',
      icon: Calendar,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ];

  const handleExport = (reportType: string) => {
    toast.info(`Exporting ${reportType} report...`, {
      description: 'This feature will generate a downloadable report.',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <FileSpreadsheet className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Financial Reports</h1>
          <p className="text-sm text-muted-foreground">
            Generate and download financial reports
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Budget</p>
            <p className="text-xl font-bold">{formatCurrency(budget?.allocated || 0)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Spent</p>
            <p className="text-xl font-bold">{formatCurrency(budget?.used || 0)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Expenses</p>
            <p className="text-xl font-bold">{expenses.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Pending Approval</p>
            <p className="text-xl font-bold">{stats.pendingCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id} className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${report.bgColor}`}>
                    <Icon className={`w-6 h-6 ${report.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{report.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {report.description}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2"
                      onClick={() => handleExport(report.name)}
                    >
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Exports */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Recent Exports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No recent exports</p>
            <p className="text-xs mt-1">Generated reports will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
