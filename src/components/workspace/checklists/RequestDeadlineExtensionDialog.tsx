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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, parseISO, addDays } from 'date-fns';
import { CalendarIcon, Clock, AlertTriangle } from 'lucide-react';

interface RequestDeadlineExtensionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checklistTitle: string;
  currentDueDate: string | null;
  onSubmit: (data: { requestedDueDate: Date; justification: string }) => void;
  isSubmitting?: boolean;
}

export function RequestDeadlineExtensionDialog({
  open,
  onOpenChange,
  checklistTitle,
  currentDueDate,
  onSubmit,
  isSubmitting = false,
}: RequestDeadlineExtensionDialogProps) {
  const [requestedDueDate, setRequestedDueDate] = useState<Date | undefined>();
  const [justification, setJustification] = useState('');

  const parsedCurrentDueDate = currentDueDate ? parseISO(currentDueDate) : null;
  const minDate = parsedCurrentDueDate ? addDays(parsedCurrentDueDate, 1) : new Date();

  const handleSubmit = () => {
    if (!requestedDueDate || !justification.trim()) return;
    onSubmit({ requestedDueDate, justification: justification.trim() });
    handleClose();
  };

  const handleClose = () => {
    setRequestedDueDate(undefined);
    setJustification('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Request Deadline Extension
          </DialogTitle>
          <DialogDescription>
            Request more time to complete this delegated checklist. Your request will be sent to the parent workspace for approval.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Checklist info */}
          <div className="p-3 bg-muted/50 rounded-lg border">
            <p className="text-sm font-medium">{checklistTitle}</p>
            {parsedCurrentDueDate && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">Current deadline:</span>
                <Badge variant="outline" className="text-xs">
                  {format(parsedCurrentDueDate, 'PPP')}
                </Badge>
              </div>
            )}
          </div>

          {/* New due date */}
          <div className="space-y-2">
            <Label>Requested New Deadline</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !requestedDueDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {requestedDueDate ? format(requestedDueDate, 'PPP') : 'Select new deadline'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={requestedDueDate}
                  onSelect={setRequestedDueDate}
                  disabled={(date) => date < minDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Justification */}
          <div className="space-y-2">
            <Label>Justification</Label>
            <Textarea
              placeholder="Explain why you need more time..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Provide a clear reason for the extension request. This will help the approver make a decision.
            </p>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-200">
              Extension requests require approval from the parent workspace. Continue working on the checklist while waiting for approval.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!requestedDueDate || !justification.trim() || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
