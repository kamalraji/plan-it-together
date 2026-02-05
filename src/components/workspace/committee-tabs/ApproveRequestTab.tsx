import { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useBudgetRequests } from '@/hooks/useWorkspaceBudget';
import { useWorkspaceExpenses } from '@/hooks/useWorkspaceExpenses';
import { CheckCircle, XCircle, Clock, Loader2, AlertCircle, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface ApproveRequestTabProps {
  workspace: Workspace;
}

export function ApproveRequestTab({ workspace }: ApproveRequestTabProps) {
  const { requests, isLoading: requestsLoading, reviewRequest, isReviewing } = useBudgetRequests(workspace.id, 'approver');
  const { expenses, updateExpenseStatus, isUpdating } = useWorkspaceExpenses(workspace.id);
  
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<string | null>(null);
  const [action, setAction] = useState<'approved' | 'rejected' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  // Get current user ID
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const pendingExpenses = expenses.filter(e => e.status === 'pending');

  const handleReviewRequest = () => {
    if (!selectedRequest || !action || !currentUser) return;
    
    reviewRequest({
      id: selectedRequest,
      status: action,
      reviewed_by: currentUser.id,
      review_notes: reviewNotes || undefined,
    }, {
      onSuccess: () => {
        setSelectedRequest(null);
        setAction(null);
        setReviewNotes('');
      },
    });
  };

  const handleReviewExpense = () => {
    if (!selectedExpense || !action) return;
    
    updateExpenseStatus({
      id: selectedExpense,
      status: action,
    }, {
      onSuccess: () => {
        setSelectedExpense(null);
        setAction(null);
      },
    });
  };

  const openRequestDialog = (requestId: string, actionType: 'approved' | 'rejected') => {
    setSelectedRequest(requestId);
    setAction(actionType);
    setReviewNotes('');
  };

  const openExpenseDialog = (expenseId: string, actionType: 'approved' | 'rejected') => {
    setSelectedExpense(expenseId);
    setAction(actionType);
  };

  if (requestsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-warning">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">Pending Budget Requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-warning">{pendingExpenses.length}</div>
            <p className="text-xs text-muted-foreground">Pending Expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-success">
              {requests.filter(r => r.status === 'approved').length}
            </div>
            <p className="text-xs text-muted-foreground">Approved Requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-destructive">
              {requests.filter(r => r.status === 'rejected').length}
            </div>
            <p className="text-xs text-muted-foreground">Rejected Requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Budget Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-warning" />
            Pending Budget Requests
          </CardTitle>
          <CardDescription>Budget requests from sub-workspaces awaiting your approval</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success/50" />
              <p>No pending budget requests</p>
              <p className="text-sm">All caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-warning/5 border-warning/20"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        ₹{request.requested_amount.toLocaleString()}
                      </span>
                      <Badge variant="outline" className="bg-warning/10 text-warning">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{request.reason}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      From: {request.requesting_workspace?.name ?? 'Unknown'} • 
                      {format(new Date(request.created_at), ' MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500/30 text-red-600 hover:bg-red-500/10"
                      onClick={() => openRequestDialog(request.id, 'rejected')}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => openRequestDialog(request.id, 'approved')}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            Pending Expenses
          </CardTitle>
          <CardDescription>Expense records awaiting approval</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingExpenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success/50" />
              <p>No pending expenses</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-warning/5 border-warning/20"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{expense.description}</span>
                      <Badge variant="outline">{expense.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      ₹{Number(expense.amount).toLocaleString()} • 
                      {format(new Date(expense.submitted_at), ' MMM d, yyyy')}
                    </p>
                    {expense.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{expense.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500/30 text-red-600 hover:bg-red-500/10"
                      onClick={() => openExpenseDialog(expense.id, 'rejected')}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => openExpenseDialog(expense.id, 'approved')}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budget Request Review Dialog */}
      <AlertDialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {action === 'approved' ? 'Approve Budget Request' : 'Reject Budget Request'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {action === 'approved'
                ? 'This will allocate the requested budget to the workspace.'
                : 'This will reject the budget request. You can add notes explaining your decision.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Add review notes (optional)..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReviewRequest}
              disabled={isReviewing}
              className={cn(
                action === 'approved'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              )}
            >
              {isReviewing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {action === 'approved' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Expense Review Dialog */}
      <AlertDialog open={!!selectedExpense} onOpenChange={() => setSelectedExpense(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {action === 'approved' ? 'Approve Expense' : 'Reject Expense'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {action === 'approved'
                ? 'This will approve the expense and update the budget accordingly.'
                : 'This will reject the expense record.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReviewExpense}
              disabled={isUpdating}
              className={cn(
                action === 'approved'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              )}
            >
              {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {action === 'approved' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
