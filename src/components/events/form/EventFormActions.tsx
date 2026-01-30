/**
 * Event Form Actions Component
 * Sticky footer with cancel and submit buttons
 */
import React from 'react';
import { Button } from '@/components/ui/button';

interface EventFormActionsProps {
  mode: 'create' | 'edit';
  isSubmitting: boolean;
  onCancel: () => void;
}

export const EventFormActions: React.FC<EventFormActionsProps> = ({
  mode,
  isSubmitting,
  onCancel,
}) => {
  const helpText = mode === 'create' 
    ? 'Fill required fields to continue' 
    : 'Changes save immediately';
  
  const submitLabel = mode === 'create' ? 'Create Event' : 'Save Changes';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 sm:relative sm:sticky sm:bottom-0 bg-card/95 backdrop-blur-sm border-t border-border/50 p-3 sm:p-4 safe-area-inset-bottom">
      <div className="flex items-center justify-between gap-3 max-w-4xl mx-auto">
        <p className="text-sm text-muted-foreground hidden md:block flex-1">
          {helpText}
        </p>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none h-11 min-h-[44px]"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="flex-1 sm:flex-none h-11 min-h-[44px] min-w-[120px] sm:min-w-[140px]"
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
                Saving...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EventFormActions;
