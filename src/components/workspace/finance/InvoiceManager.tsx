import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  Plus, 
  Send,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Trash2,
  CreditCard,
  XCircle,
} from 'lucide-react';
import { useWorkspaceInvoices, WorkspaceInvoice } from '@/hooks/useWorkspaceInvoices';
import { InvoiceFormDialog } from './InvoiceFormDialog';
import { RecordPaymentDialog } from './RecordPaymentDialog';
import { 
  formatCurrency, 
  getDaysUntilDue, 
  calculatePaymentProgress,
  getInvoiceStatusConfig,
} from '@/utils/invoiceUtils';
import { useConfirmation } from '@/components/ui/confirmation-dialog';

interface InvoiceManagerProps {
  workspaceId: string;
}

export function InvoiceManager({ workspaceId }: InvoiceManagerProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<WorkspaceInvoice | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  
  const { confirm, dialogProps, ConfirmationDialog: ConfirmDialog } = useConfirmation();

  const {
    invoices,
    stats,
    isLoading,
    createInvoice,
    updateStatus,
    recordPayment,
    deleteInvoice,
    isCreating,
    isRecordingPayment,
  } = useWorkspaceInvoices(workspaceId);

  const handleSendInvoice = (invoice: WorkspaceInvoice) => {
    updateStatus({ id: invoice.id, status: 'sent' });
  };

  const handleSendReminder = async (invoice: WorkspaceInvoice) => {
    const confirmed = await confirm({
      title: 'Send Payment Reminder',
      description: `Send a payment reminder for invoice ${invoice.invoice_number} to ${invoice.vendor_name}?`,
      variant: 'warning',
      confirmLabel: 'Send Reminder',
    });
    
    if (confirmed) {
      // For now, just show success - could integrate with email system
      updateStatus({ id: invoice.id, status: 'overdue' });
    }
  };

  const handleDeleteInvoice = async (invoice: WorkspaceInvoice) => {
    const confirmed = await confirm({
      title: 'Delete Invoice',
      description: `Are you sure you want to delete invoice ${invoice.invoice_number}? This action cannot be undone.`,
      variant: 'danger',
      confirmLabel: 'Delete',
    });
    
    if (confirmed) {
      deleteInvoice(invoice.id);
    }
  };

  const handleRecordPayment = (invoice: WorkspaceInvoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentDialog(true);
  };

  const handleCancelInvoice = async (invoice: WorkspaceInvoice) => {
    const confirmed = await confirm({
      title: 'Cancel Invoice',
      description: `Are you sure you want to cancel invoice ${invoice.invoice_number}?`,
      variant: 'warning',
      confirmLabel: 'Cancel Invoice',
    });
    
    if (confirmed) {
      updateStatus({ id: invoice.id, status: 'cancelled' });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="w-3 h-3 mr-1" />;
      case 'sent':
        return <Send className="w-3 h-3 mr-1" />;
      case 'draft':
        return <FileText className="w-3 h-3 mr-1" />;
      case 'overdue':
        return <AlertTriangle className="w-3 h-3 mr-1" />;
      case 'cancelled':
        return <XCircle className="w-3 h-3 mr-1" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
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
              <div className="p-2 rounded-lg bg-info/10">
                <FileText className="w-5 h-5 text-info" />
              </div>
              <div>
                <CardTitle className="text-lg">Invoice Manager</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {formatCurrency(stats.totalOutstanding)} outstanding
                  {stats.overdueCount > 0 && (
                    <span className="text-destructive"> · {stats.overdueCount} overdue</span>
                  )}
                </p>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-1.5"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="w-4 h-4" />
              New Invoice
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No invoices yet</p>
              <p className="text-sm">Create your first invoice to get started</p>
            </div>
          ) : (
            invoices.map(invoice => {
              const statusConfig = getInvoiceStatusConfig(invoice.status);
              const paidPercentage = calculatePaymentProgress(invoice.amount, invoice.paid_amount || 0);

              return (
                <div
                  key={invoice.id}
                  className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">{invoice.invoice_number}</span>
                        <Badge className={`${statusConfig.bgClass} ${statusConfig.textClass} ${statusConfig.borderClass}`}>
                          {getStatusIcon(invoice.status)}
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{invoice.vendor_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(invoice.amount)}</p>
                      <p className={`text-xs ${statusConfig.textClass}`}>
                        {getDaysUntilDue(invoice.due_date, invoice.status) || 'Completed'}
                      </p>
                    </div>
                  </div>
                  
                  {(invoice.status === 'sent' || invoice.status === 'overdue') && (invoice.paid_amount || 0) > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Payment progress</span>
                        <span className="font-medium">{paidPercentage}%</span>
                      </div>
                      <Progress value={paidPercentage} className="h-1.5" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatCurrency(invoice.paid_amount || 0)} of {formatCurrency(invoice.amount)} paid
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {invoice.status === 'draft' && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 text-xs gap-1"
                          onClick={() => handleSendInvoice(invoice)}
                        >
                          <Send className="w-3 h-3" />
                          Send Invoice
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteInvoice(invoice)}
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </Button>
                      </>
                    )}
                    {invoice.status === 'sent' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 text-xs gap-1"
                        onClick={() => handleRecordPayment(invoice)}
                      >
                        <CreditCard className="w-3 h-3" />
                        Record Payment
                      </Button>
                    )}
                    {invoice.status === 'overdue' && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => handleSendReminder(invoice)}
                        >
                          <AlertTriangle className="w-3 h-3" />
                          Send Reminder
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 text-xs gap-1"
                          onClick={() => handleRecordPayment(invoice)}
                        >
                          <CreditCard className="w-3 h-3" />
                          Record Payment
                        </Button>
                      </>
                    )}
                    {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 text-xs gap-1"
                        onClick={() => handleCancelInvoice(invoice)}
                      >
                        <XCircle className="w-3 h-3" />
                        Cancel
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 ml-auto">
                      <ExternalLink className="w-3 h-3" />
                      View
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <InvoiceFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={(data) => {
          createInvoice(data);
          setShowCreateDialog(false);
        }}
        isSubmitting={isCreating}
        existingInvoices={invoices}
      />

      <RecordPaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        invoice={selectedInvoice}
        onSubmit={(invoiceId, amount) => {
          recordPayment({ invoiceId, amount });
          setShowPaymentDialog(false);
        }}
        isSubmitting={isRecordingPayment}
      />

      <ConfirmDialog {...dialogProps} />
    </>
  );
}
