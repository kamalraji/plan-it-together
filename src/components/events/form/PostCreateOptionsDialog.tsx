/**
 * Post Create Options Dialog
 * Shows options after successful event creation
 */
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Pencil, Users, Eye, ArrowRight } from 'lucide-react';

interface PostCreateOptionsDialogProps {
  open: boolean;
  eventName?: string;
  onContinueEditing: () => void;
  onCreateWorkspace: () => void;
  onViewEvent: () => void;
}

export const PostCreateOptionsDialog: React.FC<PostCreateOptionsDialogProps> = ({
  open,
  eventName,
  onContinueEditing,
  onCreateWorkspace,
  onViewEvent,
}) => {
  return (
    <Dialog open={open}>
      <DialogContent 
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">🎉</span>
            Event Created!
          </DialogTitle>
          <DialogDescription>
            {eventName ? (
              <>
                <strong className="text-foreground">{eventName}</strong> has been saved as a draft.
              </>
            ) : (
              'Your event has been saved as a draft.'
            )}{' '}
            What would you like to do next?
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {/* Primary action: Create Workspace */}
          <Button
            onClick={onCreateWorkspace}
            className="w-full justify-between h-auto py-3 px-4"
          >
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Create Workspace</div>
                <div className="text-xs text-primary-foreground/70">
                  Set up teams and publish your event
                </div>
              </div>
            </div>
            <ArrowRight className="h-4 w-4" />
          </Button>

          {/* Secondary actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={onContinueEditing}
              className="h-auto py-3 px-4 flex flex-col items-center gap-1"
            >
              <Pencil className="h-4 w-4" />
              <span className="text-xs">Continue Editing</span>
            </Button>

            <Button
              variant="outline"
              onClick={onViewEvent}
              className="h-auto py-3 px-4 flex flex-col items-center gap-1"
            >
              <Eye className="h-4 w-4" />
              <span className="text-xs">Preview Event</span>
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          You can always access these options from the event dashboard.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default PostCreateOptionsDialog;
