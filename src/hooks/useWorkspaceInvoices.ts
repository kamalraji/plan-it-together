import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { INVOICE_COLUMNS } from '@/lib/supabase-columns';
import type { Database } from '@/integrations/supabase/types';

type WorkspaceInvoiceInsert = Database['public']['Tables']['workspace_invoices']['Insert'];

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface WorkspaceInvoice {
  id: string;
  workspace_id: string;
  invoice_number: string;
  vendor_name: string;
  vendor_id: string | null;
  amount: number;
  paid_amount: number;
  due_date: string;
  issue_date: string;
  status: InvoiceStatus;
  payment_terms: string | null;
  notes: string | null;
  attachment_url: string | null;
  created_by: string;
  sent_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateInvoiceInput {
  invoice_number: string;
  vendor_name: string;
  vendor_id?: string | null;
  amount: number;
  due_date: string;
  issue_date?: string;
  payment_terms?: string;
  notes?: string;
}

export interface RecordPaymentInput {
  invoiceId: string;
  amount: number;
}

export function useWorkspaceInvoices(workspaceId: string) {
  const queryClient = useQueryClient();

  // Fetch invoices with explicit columns
  const invoicesQuery = useQuery({
    queryKey: ['workspace-invoices', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_invoices')
        .select(INVOICE_COLUMNS.detail)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WorkspaceInvoice[];
    },
    enabled: !!workspaceId,
  });

  // Create invoice with typed insert
  const createInvoiceMutation = useMutation({
    mutationFn: async (input: CreateInvoiceInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const insertData: WorkspaceInvoiceInsert = {
        workspace_id: workspaceId,
        invoice_number: input.invoice_number,
        vendor_name: input.vendor_name,
        vendor_id: input.vendor_id || null,
        amount: input.amount,
        due_date: input.due_date,
        issue_date: input.issue_date || new Date().toISOString(),
        payment_terms: input.payment_terms || null,
        notes: input.notes || null,
        created_by: user?.id || '',
        status: 'draft',
        paid_amount: 0,
      };
      
      const { data, error } = await supabase
        .from('workspace_invoices')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-invoices', workspaceId] });
      toast.success('Invoice created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create invoice: ' + error.message);
    },
  });

  // Update invoice
  const updateInvoiceMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WorkspaceInvoice> & { id: string }) => {
      const { data, error } = await supabase
        .from('workspace_invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-invoices', workspaceId] });
      toast.success('Invoice updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update invoice: ' + error.message);
    },
  });

  // Update invoice status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: InvoiceStatus }) => {
      const updates: Partial<WorkspaceInvoice> = { status };
      
      if (status === 'sent') {
        updates.sent_at = new Date().toISOString();
      } else if (status === 'paid') {
        updates.paid_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('workspace_invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-invoices', workspaceId] });
      toast.success(`Invoice marked as ${variables.status}`);
    },
    onError: (error) => {
      toast.error('Failed to update status: ' + error.message);
    },
  });

  // Record payment
  const recordPaymentMutation = useMutation({
    mutationFn: async ({ invoiceId, amount }: RecordPaymentInput) => {
      // First get current invoice
      const { data: invoice, error: fetchError } = await supabase
        .from('workspace_invoices')
        .select('amount, paid_amount')
        .eq('id', invoiceId)
        .single();

      if (fetchError) throw fetchError;

      const newPaidAmount = (invoice.paid_amount || 0) + amount;
      const isPaidInFull = newPaidAmount >= invoice.amount;

      const updates: Partial<WorkspaceInvoice> = {
        paid_amount: newPaidAmount,
      };

      if (isPaidInFull) {
        updates.status = 'paid';
        updates.paid_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('workspace_invoices')
        .update(updates)
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-invoices', workspaceId] });
      toast.success('Payment recorded successfully');
    },
    onError: (error) => {
      toast.error('Failed to record payment: ' + error.message);
    },
  });

  // Delete invoice
  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase
        .from('workspace_invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-invoices', workspaceId] });
      toast.success('Invoice deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete invoice: ' + error.message);
    },
  });

  // Calculate statistics
  const invoices = invoicesQuery.data || [];
  
  const stats = {
    totalOutstanding: invoices
      .filter(i => i.status !== 'paid' && i.status !== 'cancelled')
      .reduce((sum, i) => sum + (i.amount - (i.paid_amount || 0)), 0),
    overdueCount: invoices.filter(i => i.status === 'overdue').length,
    overdueAmount: invoices
      .filter(i => i.status === 'overdue')
      .reduce((sum, i) => sum + (i.amount - (i.paid_amount || 0)), 0),
    paidThisMonth: invoices
      .filter(i => {
        if (i.status !== 'paid' || !i.paid_at) return false;
        const paidDate = new Date(i.paid_at);
        const now = new Date();
        return paidDate.getMonth() === now.getMonth() && 
               paidDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, i) => sum + i.amount, 0),
    draftCount: invoices.filter(i => i.status === 'draft').length,
    sentCount: invoices.filter(i => i.status === 'sent').length,
  };

  return {
    invoices,
    stats,
    isLoading: invoicesQuery.isLoading,
    error: invoicesQuery.error,
    createInvoice: createInvoiceMutation.mutate,
    updateInvoice: updateInvoiceMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
    recordPayment: recordPaymentMutation.mutate,
    deleteInvoice: deleteInvoiceMutation.mutate,
    isCreating: createInvoiceMutation.isPending,
    isUpdating: updateInvoiceMutation.isPending || updateStatusMutation.isPending,
    isRecordingPayment: recordPaymentMutation.isPending,
    isDeleting: deleteInvoiceMutation.isPending,
  };
}
