import { differenceInDays, format } from 'date-fns';

/**
 * Generate a unique invoice number
 * Format: INV-YYYY-XXX (e.g., INV-2025-001)
 */
export function generateInvoiceNumber(
  existingInvoices: { invoice_number: string }[]
): string {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  
  // Find the highest number for this year
  const yearInvoices = existingInvoices
    .filter(inv => inv.invoice_number.startsWith(prefix))
    .map(inv => {
      const numPart = inv.invoice_number.replace(prefix, '');
      return parseInt(numPart, 10) || 0;
    });

  const maxNum = yearInvoices.length > 0 ? Math.max(...yearInvoices) : 0;
  const nextNum = (maxNum + 1).toString().padStart(3, '0');
  
  return `${prefix}${nextNum}`;
}

/**
 * Check if an invoice is overdue
 */
export function isInvoiceOverdue(dueDate: string, status: string): boolean {
  if (status === 'paid' || status === 'cancelled') return false;
  const due = new Date(dueDate);
  const now = new Date();
  return due < now;
}

/**
 * Calculate payment progress percentage
 */
export function calculatePaymentProgress(amount: number, paidAmount: number): number {
  if (amount <= 0) return 0;
  return Math.min(Math.round((paidAmount / amount) * 100), 100);
}

/**
 * Get days until due or days overdue
 */
export function getDaysUntilDue(dueDate: string, status: string): string | null {
  if (status === 'paid') return null;
  if (status === 'cancelled') return 'Cancelled';
  
  const days = differenceInDays(new Date(dueDate), new Date());
  
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today';
  return `${days}d left`;
}

/**
 * Format currency for display (INR)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatInvoiceDate(dateString: string): string {
  return format(new Date(dateString), 'dd MMM yyyy');
}

/**
 * Get status color configuration
 */
export function getInvoiceStatusConfig(status: string) {
  switch (status) {
    case 'paid':
      return {
        bgClass: 'bg-emerald-500/10',
        textClass: 'text-emerald-600',
        borderClass: 'border-emerald-500/20',
        label: 'Paid',
      };
    case 'sent':
      return {
        bgClass: 'bg-blue-500/10',
        textClass: 'text-blue-600',
        borderClass: 'border-blue-500/20',
        label: 'Sent',
      };
    case 'draft':
      return {
        bgClass: 'bg-muted',
        textClass: 'text-muted-foreground',
        borderClass: 'border-border',
        label: 'Draft',
      };
    case 'overdue':
      return {
        bgClass: 'bg-destructive/10',
        textClass: 'text-destructive',
        borderClass: 'border-destructive/20',
        label: 'Overdue',
      };
    case 'cancelled':
      return {
        bgClass: 'bg-muted',
        textClass: 'text-muted-foreground',
        borderClass: 'border-border',
        label: 'Cancelled',
      };
    default:
      return {
        bgClass: 'bg-muted',
        textClass: 'text-muted-foreground',
        borderClass: 'border-border',
        label: status,
      };
  }
}
