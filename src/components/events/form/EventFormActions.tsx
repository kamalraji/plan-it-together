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
    <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm border-t border-border/50 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground hidden sm:block">
          {helpText}
        </p>
        <div className="flex items-center gap-3 ml-auto">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="min-w-[140px]"
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
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
