import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  Clock, 
  User,
  AlertTriangle 
} from 'lucide-react';
import { TaskApprovalRequest, ApprovalDecision } from '@/lib/taskApprovalTypes';
import { useTaskApprovalRequests } from '@/hooks/useTaskApprovalRequests';
import { getApprovalLevelDisplay } from '@/hooks/useTaskApprovalCheck';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskApprovalDialogProps {
  request: TaskApprovalRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole: string;
  canApprove: boolean;
  isSelfApproval: boolean;
  allowSelfApproval?: boolean;
  workspaceId: string;
}

export function TaskApprovalDialog({
  request,
  open,
  onOpenChange,
  userRole,
  canApprove,
  isSelfApproval,
  allowSelfApproval = false,
  workspaceId,
}: TaskApprovalDialogProps) {
  const [notes, setNotes] = useState('');
  const [decision, setDecision] = useState<ApprovalDecision | null>(null);

  const { submitDecision, isSubmittingDecision } = useTaskApprovalRequests(workspaceId);

  if (!request) return null;

  const handleSubmit = async () => {
    if (!decision) return;

    await submitDecision({
      requestId: request.id,
      decision,
      notes: notes || undefined,
      approverRole: userRole,
      level: request.currentLevel,
    });

    setNotes('');
    setDecision(null);
    onOpenChange(false);
  };

  const currentApprovalLevel = request.policy?.approvalChain.find(
    l => l.level === request.currentLevel
  );

  const showSelfApprovalWarning = isSelfApproval && !allowSelfApproval;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning" />
            Review Approval Request
          </DialogTitle>
          <DialogDescription>
            Review and make a decision on this task approval request
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 pr-4">
            {/* Task Info */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <h4 className="font-medium text-sm text-foreground mb-2">Task</h4>
              <p className="text-foreground">{request.task?.title}</p>
              <div className="flex gap-2 mt-2">
                {request.task?.category && (
                  <Badge variant="secondary" className="text-xs">
                    {request.task.category}
                  </Badge>
                )}
                {request.task?.priority && (
                  <Badge variant="outline" className="text-xs">
                    {request.task.priority}
                  </Badge>
                )}
              </div>
            </div>

            {/* Requester Info */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  Requested by {request.requester?.name || 'Unknown'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(request.requestedAt), 'PPp')}
                </p>
              </div>
            </div>

            {/* Approval Progress */}
            <div>
              <h4 className="text-sm font-medium mb-2">Approval Progress</h4>
              <div className="flex items-center gap-2">
                {request.policy?.approvalChain.map((level, idx) => {
                  const decision = request.decisions.find(d => d.level === level.level);
                  const isCurrent = level.level === request.currentLevel;

                  return (
                    <div key={level.level} className="flex items-center">
                      {idx > 0 && (
                        <ArrowRight className="h-4 w-4 mx-1 text-muted-foreground" />
                      )}
                      <div
                        className={cn(
                          'rounded-full p-1.5 border-2',
                          decision?.decision === 'APPROVED' && 'bg-success/20 border-success',
                          decision?.decision === 'REJECTED' && 'bg-destructive/20 border-destructive',
                          isCurrent && !decision && 'bg-warning/20 border-warning',
                          !isCurrent && !decision && 'bg-muted border-muted-foreground/30'
                        )}
                      >
                        {decision?.decision === 'APPROVED' ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : decision?.decision === 'REJECTED' ? (
                          <XCircle className="h-4 w-4 text-destructive" />
                        ) : (
                          <span className="h-4 w-4 flex items-center justify-center text-xs font-medium">
                            {level.level}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {currentApprovalLevel && (
                <p className="text-xs text-muted-foreground mt-2">
                  Current level: {getApprovalLevelDisplay(currentApprovalLevel)}
                </p>
              )}
            </div>

            {/* Previous Decisions */}
            {request.decisions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Previous Decisions</h4>
                <div className="space-y-2">
                  {request.decisions.map((d) => (
                    <div
                      key={d.id}
                      className="text-sm p-2 rounded-md bg-muted/50 flex items-start gap-2"
                    >
                      {d.decision === 'APPROVED' ? (
                        <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                      ) : d.decision === 'REJECTED' ? (
                        <XCircle className="h-4 w-4 text-destructive mt-0.5" />
                      ) : (
                        <ArrowRight className="h-4 w-4 text-info mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">
                          {d.decision} by {d.approver?.name || 'Unknown'} (Level {d.level})
                        </p>
                        {d.notes && (
                          <p className="text-muted-foreground text-xs mt-1">{d.notes}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(d.decidedAt), 'PPp')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Self Approval Warning */}
            {showSelfApprovalWarning && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
                <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
                    Self-approval not allowed
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-500">
                    You cannot approve your own request. Another approver must review this task.
                  </p>
                </div>
              </div>
            )}

            {/* Decision Form */}
            {canApprove && !showSelfApprovalWarning && (
              <div className="space-y-4">
                <div>
                  <Label>Your Decision</Label>
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      variant={decision === 'APPROVED' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDecision('APPROVED')}
                      className={cn(
                        decision === 'APPROVED' && 'bg-success hover:bg-success/90'
                      )}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      type="button"
                      variant={decision === 'REJECTED' ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={() => setDecision('REJECTED')}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any comments about your decision..."
                    className="mt-1.5"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {!canApprove && !showSelfApprovalWarning && (
              <p className="text-sm text-muted-foreground text-center py-2">
                You don't have permission to approve this request at the current level.
              </p>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {canApprove && !showSelfApprovalWarning && decision && (
            <Button
              onClick={handleSubmit}
              disabled={isSubmittingDecision}
              className={cn(
                decision === 'APPROVED' && 'bg-success hover:bg-success/90',
                decision === 'REJECTED' && 'bg-destructive hover:bg-destructive/90'
              )}
            >
              {isSubmittingDecision ? 'Submitting...' : `Confirm ${decision}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
