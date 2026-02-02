import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, X } from 'lucide-react';
import { ApprovalStep } from '@/hooks/useMultiStepApproval';

interface ApprovalStepActionsProps {
  step: ApprovalStep;
  onApprove: (stepId: string, comments?: string) => void;
  onReject: (stepId: string, comments?: string) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
  requireComments?: boolean;
}

export function ApprovalStepActions({
  step,
  onApprove,
  onReject,
  isApproving = false,
  isRejecting = false,
  requireComments = false,
}: ApprovalStepActionsProps) {
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [comments, setComments] = useState('');

  const handleApprove = () => {
    if (requireComments) {
      setShowApproveDialog(true);
    } else {
      onApprove(step.id);
    }
  };

  const handleReject = () => {
    setShowRejectDialog(true);
  };

  const confirmApprove = () => {
    onApprove(step.id, comments);
    setShowApproveDialog(false);
    setComments('');
  };

  const confirmReject = () => {
    onReject(step.id, comments);
    setShowRejectDialog(false);
    setComments('');
  };

  if (step.status !== 'pending') {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="text-green-600 border-green-600/30 hover:bg-green-500/10"
          onClick={handleApprove}
          disabled={isApproving || isRejecting}
        >
          <Check className="h-4 w-4 mr-1" />
          {isApproving ? 'Approving...' : 'Approve'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-red-600 border-red-600/30 hover:bg-red-500/10"
          onClick={handleReject}
          disabled={isApproving || isRejecting}
        >
          <X className="h-4 w-4 mr-1" />
          {isRejecting ? 'Rejecting...' : 'Reject'}
        </Button>
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirm Approval</DialogTitle>
            <DialogDescription>
              Add optional comments for this approval.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="approve-comments">Comments (optional)</Label>
            <Textarea
              id="approve-comments"
              placeholder="Add any notes about this approval..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmApprove}
              className="bg-green-600 hover:bg-green-700"
              disabled={isApproving}
            >
              {isApproving ? 'Approving...' : 'Confirm Approval'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirm Rejection</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this request.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reject-comments">Reason for rejection</Label>
            <Textarea
              id="reject-comments"
              placeholder="Explain why this request is being rejected..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              className="mt-2"
              required
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmReject}
              variant="destructive"
              disabled={isRejecting || !comments.trim()}
            >
              {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
