import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { PublishEventModal } from './PublishEventModal';
import { EventApprovalStatus } from './EventApprovalStatus';
import { useEventPublish } from '@/hooks/useEventPublish';
import { EventStatus } from '@/types';
import { 
  Rocket, 
  ChevronDown, 
  EyeOff, 
  Play, 
  CheckCircle, 
  XCircle,
  Clock 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventStatusActionsProps {
  eventId: string;
  currentStatus: EventStatus;
  canManage: boolean;
  onStatusChange?: () => void;
}

export function EventStatusActions({
  eventId,
  currentStatus,
  canManage,
  onStatusChange,
}: EventStatusActionsProps) {
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showApprovalStatus, setShowApprovalStatus] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'unpublish' | 'ongoing' | 'completed' | 'cancelled';
    title: string;
    description: string;
  } | null>(null);

  const { 
    publishRequest, 
    unpublishEvent, 
    changeStatus,
    isLoading 
  } = useEventPublish(eventId);

  const isPending = publishRequest?.status === 'pending';

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    try {
      switch (confirmAction.type) {
        case 'unpublish':
          await unpublishEvent();
          break;
        case 'ongoing':
          await changeStatus({ newStatus: EventStatus.ONGOING });
          break;
        case 'completed':
          await changeStatus({ newStatus: EventStatus.COMPLETED });
          break;
        case 'cancelled':
          await changeStatus({ newStatus: EventStatus.CANCELLED });
          break;
      }
      setConfirmAction(null);
      onStatusChange?.();
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (!canManage) return null;

  const getStatusBadgeStyle = (status: EventStatus) => {
    switch (status) {
      case EventStatus.DRAFT:
        return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400';
      case EventStatus.PUBLISHED:
        return 'bg-green-500/20 text-green-600 dark:text-green-400';
      case EventStatus.ONGOING:
        return 'bg-blue-500/20 text-blue-600 dark:text-blue-400';
      case EventStatus.COMPLETED:
        return 'bg-muted text-muted-foreground';
      case EventStatus.CANCELLED:
        return 'bg-red-500/20 text-red-600 dark:text-red-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Status Badge with Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className={cn('gap-2', getStatusBadgeStyle(currentStatus))}
              disabled={isLoading}
            >
              {currentStatus}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {currentStatus === EventStatus.PUBLISHED && (
              <>
                <DropdownMenuItem
                  onClick={() => setConfirmAction({
                    type: 'ongoing',
                    title: 'Mark as Ongoing',
                    description: 'This will indicate that the event is currently in progress.',
                  })}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Mark as Ongoing
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setConfirmAction({
                    type: 'unpublish',
                    title: 'Unpublish Event',
                    description: 'This will revert the event to draft status. It will no longer be visible to participants.',
                  })}
                >
                  <EyeOff className="h-4 w-4 mr-2" />
                  Unpublish
                </DropdownMenuItem>
              </>
            )}
            {currentStatus === EventStatus.ONGOING && (
              <>
                <DropdownMenuItem
                  onClick={() => setConfirmAction({
                    type: 'completed',
                    title: 'Mark as Completed',
                    description: 'This will mark the event as finished.',
                  })}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Completed
                </DropdownMenuItem>
              </>
            )}
            {(currentStatus === EventStatus.DRAFT || currentStatus === EventStatus.PUBLISHED) && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setConfirmAction({
                    type: 'cancelled',
                    title: 'Cancel Event',
                    description: 'This will cancel the event. This action cannot be undone easily.',
                  })}
                  className="text-red-600 dark:text-red-400"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Event
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Primary Action Button */}
        {currentStatus === EventStatus.DRAFT && !isPending && (
          <Button
            onClick={() => setShowPublishModal(true)}
            size="sm"
            className="gap-2"
          >
            <Rocket className="h-4 w-4" />
            Publish Event
          </Button>
        )}

        {/* Pending Approval Badge */}
        {isPending && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400"
            onClick={() => setShowApprovalStatus(true)}
          >
            <Clock className="h-4 w-4" />
            Pending Approval
          </Button>
        )}
      </div>

      {/* Publish Modal */}
      <PublishEventModal
        eventId={eventId}
        open={showPublishModal}
        onOpenChange={setShowPublishModal}
        onSuccess={onStatusChange}
      />

      {/* Approval Status Modal */}
      {publishRequest && (
        <EventApprovalStatus
          eventId={eventId}
          request={publishRequest}
          open={showApprovalStatus}
          onOpenChange={setShowApprovalStatus}
        />
      )}

      {/* Confirm Action Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
