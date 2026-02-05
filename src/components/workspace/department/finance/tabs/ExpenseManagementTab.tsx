import { ExpenseTracker } from '@/components/workspace/finance/ExpenseTracker';
import { Receipt } from 'lucide-react';

interface ExpenseManagementTabProps {
  workspaceId: string;
}

export function ExpenseManagementTab({ workspaceId }: ExpenseManagementTabProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-info/10">
          <Receipt className="w-6 h-6 text-info" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Expense Management</h1>
          <p className="text-sm text-muted-foreground">
            Track, manage, and approve expense submissions
          </p>
        </div>
      </div>

      {/* Expense Tracker with approval actions enabled */}
      <ExpenseTracker workspaceId={workspaceId} showApprovalActions={true} />
    </div>
  );
}
