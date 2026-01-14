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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EventPublishChecklist } from './EventPublishChecklist';
import { useEventPublish, type PublishPriority } from '@/hooks/useEventPublish';
import { Rocket, Send, AlertTriangle, Building2, Loader2 } from 'lucide-react';

interface PublishEventModalProps {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PublishEventModal({
  eventId,
  open,
  onOpenChange,
  onSuccess,
}: PublishEventModalProps) {
  const {
    event,
    rootWorkspace,
    requiresApproval,
    checklist,
    isLoading,
    publishEvent,
    requestApproval,
    isPublishing,
    isRequestingApproval,
  } = useEventPublish(eventId);

  const [priority, setPriority] = useState<PublishPriority>('medium');
  const [notes, setNotes] = useState('');
  const [confirmStep, setConfirmStep] = useState(false);

  const handlePublish = async () => {
    try {
      await publishEvent();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleRequestApproval = async () => {
    try {
      await requestApproval({ priority, notes: notes || undefined });
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleClose = () => {
    setConfirmStep(false);
    setNotes('');
    setPriority('medium');
    onOpenChange(false);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const isPending = isPublishing || isRequestingApproval;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Publish Event
          </DialogTitle>
          <DialogDescription>
            {event?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Workspace Info */}
          {rootWorkspace && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium">ROOT Workspace</p>
                <p className="text-muted-foreground">{rootWorkspace.name}</p>
              </div>
              {requiresApproval && (
                <span className="ml-auto text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                  Approval Required
                </span>
              )}
            </div>
          )}

          {/* Checklist */}
          <div>
            <h4 className="text-sm font-medium mb-3">Pre-Publish Checklist</h4>
            <EventPublishChecklist
              items={checklist.items}
              canPublish={checklist.canPublish}
              warningCount={checklist.warningCount}
              failCount={checklist.failCount}
            />
          </div>

          {/* Approval Options (if required) */}
          {requiresApproval && checklist.canPublish && !confirmStep && (
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-700 dark:text-yellow-400">
                    Approval Required
                  </p>
                  <p className="text-muted-foreground mt-1">
                    This workspace requires manager approval before events can be published.
                    Your request will be reviewed by workspace managers.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as PublishPriority)}>
                    <SelectTrigger id="priority">
                      <SelectValue />
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
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any notes for the reviewer..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Step for Direct Publish */}
          {!requiresApproval && checklist.canPublish && confirmStep && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm font-medium text-primary">
                Ready to publish "{event?.name}"?
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                The event will become visible according to its visibility settings.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>

          {checklist.canPublish && (
            requiresApproval ? (
              <Button
                onClick={handleRequestApproval}
                disabled={isPending}
                className="gap-2"
              >
                {isRequestingApproval ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Request Approval
              </Button>
            ) : (
              confirmStep ? (
                <Button
                  onClick={handlePublish}
                  disabled={isPending}
                  className="gap-2"
                >
                  {isPublishing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Rocket className="h-4 w-4" />
                  )}
                  Confirm & Publish
                </Button>
              ) : (
                <Button
                  onClick={() => setConfirmStep(true)}
                  className="gap-2"
                >
                  <Rocket className="h-4 w-4" />
                  Publish Now
                </Button>
              )
            )
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
