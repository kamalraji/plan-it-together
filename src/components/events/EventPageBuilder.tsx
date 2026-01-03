import React from 'react';
import 'grapesjs/dist/css/grapes.min.css';
import { useParams } from 'react-router-dom';
import { usePageBuilder } from './page-builder/usePageBuilder';

/**
 * EventPageBuilder
 *
 * Default GrapesJS-based landing page builder for events.
 * Uses the native GrapesJS UI panels.
 */
export const EventPageBuilder: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();

  const {
    containerRef,
    loading,
  } = usePageBuilder({ eventId });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
};
