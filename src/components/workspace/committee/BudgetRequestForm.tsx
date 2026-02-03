import { useState } from 'react';
import { TrendingUp, Send, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useBudgetRequests, useWorkspaceBudget } from '@/hooks/useWorkspaceBudget';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface BudgetRequestFormProps {
  workspaceId: string;
  parentWorkspaceId: string | null;
}

const statusConfig = {
  pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Pending' },
  approved: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Rejected' },
};

export function BudgetRequestForm({ workspaceId, parentWorkspaceId }: BudgetRequestFormProps) {
  const { user } = useAuth();
  const { budget } = useWorkspaceBudget(workspaceId);
  const { requests, createRequest } = useBudgetRequests(workspaceId, 'requester');
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [formData, setFormData] = useState({ amount: '', reason: '' });

  const handleSubmit = () => {
    if (!formData.amount || !formData.reason.trim() || !parentWorkspaceId || !user?.id) return;

    createRequest({
      requesting_workspace_id: workspaceId,
      target_workspace_id: parentWorkspaceId,
      requested_amount: parseFloat(formData.amount),
      reason: formData.reason,
      requested_by: user.id,
    });

    setFormData({ amount: '', reason: '' });
    setShowRequestDialog(false);
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const recentRequests = requests.slice(0, 5);

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Budget Requests</h3>
            <p className="text-xs text-muted-foreground">
              {pendingRequests.length} pending request{pendingRequests.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {parentWorkspaceId && (
          <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Send className="h-4 w-4 mr-1" />
                Request Budget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Budget Increase</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Current Budget</p>
                  <p className="text-lg font-bold text-foreground">
                    ₹{budget?.allocated?.toLocaleString('en-IN') || '0'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Amount Requested (₹)</label>
                  <Input
                    type="number"
                    placeholder="e.g., 50000"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Reason</label>
                  <Textarea
                    placeholder="Explain why the additional budget is needed..."
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    className="mt-1"
                    rows={4}
                  />
                </div>
                <Button onClick={handleSubmit} className="w-full" disabled={!formData.amount || !formData.reason}>
                  Submit Request
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!parentWorkspaceId && (
        <p className="text-sm text-muted-foreground text-center py-4">
          This is a top-level workspace. Budget requests are not available.
        </p>
      )}

      {parentWorkspaceId && recentRequests.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No budget requests yet. Submit a request when you need additional funds.
        </p>
      )}

      {recentRequests.length > 0 && (
        <div className="space-y-3">
          {recentRequests.map((request) => {
            const config = statusConfig[request.status];
            const Icon = config.icon;

            return (
              <div key={request.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">
                      ₹{request.requested_amount.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(request.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.color}`}>
                    <Icon className="h-3 w-3" />
                    {config.label}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{request.reason}</p>
                {request.review_notes && (
                  <p className="text-xs text-muted-foreground italic border-t border-border pt-2 mt-2">
                    Note: {request.review_notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
