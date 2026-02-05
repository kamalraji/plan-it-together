import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useEventPublish, type EventPublishRequest } from '@/hooks/useEventPublish';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface EventApprovalStatusProps {
  eventId: string;
  request: EventPublishRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventApprovalStatus({
  eventId,
  request,
  open,
  onOpenChange,
}: EventApprovalStatusProps) {
  const { cancelRequest } = useEventPublish(eventId);
  const [isCancelling, setIsCancelling] = React.useState(false);

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await cancelRequest(request.id);
      onOpenChange(false);
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusInfo = () => {
    switch (request.status) {
      case 'pending':
        return {
          icon: Clock,
          color: 'text-warning',
          bg: 'bg-warning/10',
          label: 'Pending Review',
          description: 'Your publish request is awaiting review by workspace managers.',
        };
      case 'approved':
        return {
          icon: CheckCircle,
          color: 'text-success',
          bg: 'bg-success/10',
          label: 'Approved',
          description: 'Your event has been approved and published!',
        };
      case 'rejected':
        return {
          icon: XCircle,
          color: 'text-destructive',
          bg: 'bg-destructive/10',
          label: 'Rejected',
          description: 'Your publish request was not approved. Please review the feedback and try again.',
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const getPriorityBadge = (priority: string) => {
    const styles = {
      low: 'bg-muted text-muted-foreground',
      medium: 'bg-info/20 text-info',
      high: 'bg-warning/20 text-warning',
      urgent: 'bg-destructive/20 text-destructive',
    };
    return styles[priority as keyof typeof styles] || styles.medium;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Publish Request Status</DialogTitle>
          <DialogDescription>
            Request submitted {format(new Date(request.requestedAt), 'PPp')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status Card */}
          <div className={cn('rounded-lg p-4', statusInfo.bg)}>
            <div className="flex items-center gap-3">
              <StatusIcon className={cn('h-6 w-6', statusInfo.color)} />
              <div>
                <p className={cn('font-medium', statusInfo.color)}>
                  {statusInfo.label}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {statusInfo.description}
                </p>
              </div>
            </div>
          </div>

          {/* Request Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Priority</span>
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full font-medium capitalize',
                getPriorityBadge(request.priority)
              )}>
                {request.priority}
              </span>
            </div>

            {request.reviewedAt && (
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Reviewed</span>
                <span className="text-sm">
                  {format(new Date(request.reviewedAt), 'PPp')}
                </span>
              </div>
            )}
          </div>

          {/* Review Notes (if rejected) */}
          {request.status === 'rejected' && request.reviewNotes && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-destructive">
                    Reviewer Feedback
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {request.reviewNotes}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Checklist Snapshot */}
          {request.checklistSnapshot && request.status === 'rejected' && (
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Checklist at time of request</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Review the checklist and address any issues before resubmitting.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {request.status === 'pending' ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleCancel}
                disabled={isCancelling}
              >
                {isCancelling && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Cancel Request
              </Button>
            </>
          ) : (
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
