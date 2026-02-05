import { InvoiceManager } from '@/components/workspace/finance/InvoiceManager';
import { useWorkspaceInvoices } from '@/hooks/useWorkspaceInvoices';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { formatCurrency } from '@/utils/invoiceUtils';

interface InvoiceManagementTabProps {
  workspaceId: string;
}

export function InvoiceManagementTab({ workspaceId }: InvoiceManagementTabProps) {
  const { stats, isLoading } = useWorkspaceInvoices(workspaceId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Invoice Management</h1>
          <p className="text-sm text-muted-foreground">
            Track invoices, payments, and vendor billing
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {!isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Clock className="w-4 h-4 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Outstanding</p>
                  <p className="text-lg font-semibold">{formatCurrency(stats.totalOutstanding)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                  <p className="text-lg font-semibold">{formatCurrency(stats.overdueAmount)}</p>
                  <p className="text-xs text-muted-foreground">{stats.overdueCount} invoices</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Paid This Month</p>
                  <p className="text-lg font-semibold">{formatCurrency(stats.paidThisMonth)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10">
                  <FileText className="w-4 h-4 text-info" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-lg font-semibold">{stats.draftCount + stats.sentCount}</p>
                  <p className="text-xs text-muted-foreground">{stats.draftCount} draft, {stats.sentCount} sent</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invoice Manager */}
      <InvoiceManager workspaceId={workspaceId} />
    </div>
  );
}
