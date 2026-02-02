/**
 * Event Form Loading State Component
 * Displayed while event data is being loaded
 */
import React from 'react';

export const EventFormLoadingState: React.FC = () => {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-muted-foreground">Loading event...</p>
      </div>
    </div>
  );
};

export default EventFormLoadingState;
