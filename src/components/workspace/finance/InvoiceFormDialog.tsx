import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CreateInvoiceInput } from '@/hooks/useWorkspaceInvoices';
import { generateInvoiceNumber } from '@/utils/invoiceUtils';

interface InvoiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateInvoiceInput) => void;
  isSubmitting?: boolean;
  existingInvoices?: { invoice_number: string }[];
}

const PAYMENT_TERMS = [
  { value: 'due_on_receipt', label: 'Due on Receipt' },
  { value: 'net_7', label: 'Net 7 Days' },
  { value: 'net_15', label: 'Net 15 Days' },
  { value: 'net_30', label: 'Net 30 Days' },
  { value: 'net_45', label: 'Net 45 Days' },
  { value: 'net_60', label: 'Net 60 Days' },
];

export function InvoiceFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  existingInvoices = [],
}: InvoiceFormDialogProps) {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [issueDate, setIssueDate] = useState<Date>(new Date());
  const [paymentTerms, setPaymentTerms] = useState('net_30');
  const [notes, setNotes] = useState('');

  // Generate invoice number when dialog opens
  useEffect(() => {
    if (open) {
      setInvoiceNumber(generateInvoiceNumber(existingInvoices));
    }
  }, [open, existingInvoices]);

  const resetForm = () => {
    setInvoiceNumber('');
    setVendorName('');
    setAmount('');
    setDueDate(undefined);
    setIssueDate(new Date());
    setPaymentTerms('net_30');
    setNotes('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vendorName || !amount || !dueDate) return;

    onSubmit({
      invoice_number: invoiceNumber,
      vendor_name: vendorName,
      amount: parseFloat(amount),
      due_date: dueDate.toISOString(),
      issue_date: issueDate.toISOString(),
      payment_terms: paymentTerms,
      notes: notes || undefined,
    });

    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="INV-2025-001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendorName">Vendor Name</Label>
            <Input
              id="vendorName"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="Enter vendor name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Issue Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !issueDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {issueDate ? format(issueDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={issueDate}
                    onSelect={(date) => date && setIssueDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dueDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Payment Terms</Label>
            <Select value={paymentTerms} onValueChange={setPaymentTerms}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment terms" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_TERMS.map((term) => (
                  <SelectItem key={term.value} value={term.value}>
                    {term.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !vendorName || !amount || !dueDate}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Invoice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
