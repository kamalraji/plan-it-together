import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Loader2, DollarSign } from 'lucide-react';
import { WorkspaceInvoice } from '@/hooks/useWorkspaceInvoices';
import { formatCurrency, calculatePaymentProgress } from '@/utils/invoiceUtils';

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: WorkspaceInvoice | null;
  onSubmit: (invoiceId: string, amount: number) => void;
  isSubmitting?: boolean;
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  invoice,
  onSubmit,
  isSubmitting,
}: RecordPaymentDialogProps) {
  const [amount, setAmount] = useState('');

  if (!invoice) return null;

  const remainingAmount = invoice.amount - (invoice.paid_amount || 0);
  const currentProgress = calculatePaymentProgress(invoice.amount, invoice.paid_amount || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const paymentAmount = parseFloat(amount);
    if (paymentAmount > 0 && paymentAmount <= remainingAmount) {
      onSubmit(invoice.id, paymentAmount);
      setAmount('');
    }
  };

  const handlePayInFull = () => {
    onSubmit(invoice.id, remainingAmount);
    setAmount('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment for invoice {invoice.invoice_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Invoice Summary */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Vendor</span>
              <span className="font-medium">{invoice.vendor_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Amount</span>
              <span className="font-semibold">{formatCurrency(invoice.amount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Already Paid</span>
              <span className="text-emerald-600">{formatCurrency(invoice.paid_amount || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Remaining</span>
              <span className="font-semibold text-primary">{formatCurrency(remainingAmount)}</span>
            </div>
            
            {/* Progress bar */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Payment Progress</span>
                <span className="font-medium">{currentProgress}%</span>
              </div>
              <Progress value={currentProgress} className="h-2" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paymentAmount">Payment Amount (₹)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="paymentAmount"
                  type="number"
                  min="0.01"
                  max={remainingAmount}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-9"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Maximum: {formatCurrency(remainingAmount)}
              </p>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handlePayInFull}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Pay in Full
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > remainingAmount}
                className="w-full sm:w-auto"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Record Payment
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
