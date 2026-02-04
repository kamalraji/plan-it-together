import { useOutgoingRequests } from '@/hooks/useOutgoingRequests';
import { useApprovalRealtimeUpdates } from '@/hooks/useActivityFeed';
import { OutgoingSummaryCards } from './OutgoingSummaryCards';
import { OutgoingRequestsList } from './OutgoingRequestsList';
import { BudgetRequestDialog } from './BudgetRequestDialog';
import { ResourceRequestDialog } from './ResourceRequestDialog';
import { DollarSign, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OutgoingRequestsSectionProps {
  workspaceId: string;
  parentWorkspaceId: string;
}

export function OutgoingRequestsSection({
  workspaceId,
  parentWorkspaceId,
}: OutgoingRequestsSectionProps) {
  const {
    allOutgoingRequests,
    pendingCount,
    approvedCount,
    rejectedCount,
    isLoading,
  } = useOutgoingRequests(workspaceId);

  // Enable real-time updates for approval status changes
  useApprovalRealtimeUpdates(workspaceId);

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <BudgetRequestDialog
          workspaceId={workspaceId}
          parentWorkspaceId={parentWorkspaceId}
          trigger={
            <Button variant="default" size="sm">
              <DollarSign className="h-4 w-4 mr-2" />
              Request Budget
            </Button>
          }
        />
        <ResourceRequestDialog
          workspaceId={workspaceId}
          parentWorkspaceId={parentWorkspaceId}
          trigger={
            <Button variant="outline" size="sm">
              <Package className="h-4 w-4 mr-2" />
              Request Resources
            </Button>
          }
        />
      </div>

      {/* Summary Cards */}
      <OutgoingSummaryCards
        pendingCount={pendingCount}
        approvedCount={approvedCount}
        rejectedCount={rejectedCount}
      />

      {/* Requests List */}
      <OutgoingRequestsList
        requests={allOutgoingRequests}
        isLoading={isLoading}
      />
    </div>
  );
}
