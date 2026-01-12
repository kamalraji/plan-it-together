import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DollarSign, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ApprovalPriority } from '@/hooks/useWorkspaceApprovals';

interface BudgetRequestDialogProps {
  workspaceId: string;
  parentWorkspaceId: string;
  trigger?: React.ReactNode;
}

export function BudgetRequestDialog({
  workspaceId,
  parentWorkspaceId,
  trigger,
}: BudgetRequestDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState<ApprovalPriority>('medium');

  const createRequestMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('workspace_budget_requests')
        .insert({
          requesting_workspace_id: workspaceId,
          target_workspace_id: parentWorkspaceId,
          requested_amount: parseFloat(amount),
          reason,
          priority,
          requested_by: user?.id!,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outgoing-budget-requests', workspaceId] });
      toast.success('Budget request submitted successfully');
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to submit request: ' + (error as Error).message);
    },
  });

  const resetForm = () => {
    setAmount('');
    setReason('');
    setPriority('medium');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!reason.trim()) {
      toast.error('Please provide a reason for the request');
      return;
    }
    createRequestMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <DollarSign className="h-4 w-4 mr-2" />
            Request Budget
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              Request Budget
            </DialogTitle>
            <DialogDescription>
              Submit a budget request to your parent workspace for approval.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (INR)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                step="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as ApprovalPriority)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason / Justification</Label>
              <Textarea
                id="reason"
                placeholder="Describe why you need this budget..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createRequestMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createRequestMutation.isPending}>
              {createRequestMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
