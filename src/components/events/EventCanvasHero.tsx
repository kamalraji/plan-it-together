import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { X, ZoomIn } from 'lucide-react';

interface EventCanvasHeroProps {
  snapshot: any | null | undefined; // PNG data URL string
}

/**
 * Read-only viewer for the event's designed canvas hero.
 * Renders the stored PNG data URL inside a framed card with lightbox support.
 */
export const EventCanvasHero: React.FC<EventCanvasHeroProps> = ({ snapshot }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!snapshot || typeof snapshot !== 'string' || !snapshot.startsWith('data:image')) {
    return null;
  }

  return (
    <>
      <div 
        className="group relative h-[360px] w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm flex items-center justify-center cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
        onClick={() => setIsOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setIsOpen(true)}
      >
        <img
          src={snapshot}
          alt="Event hero sketch"
          className="max-h-full max-w-full object-contain"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-background/0 group-hover:bg-background/10 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-full p-3 shadow-lg">
            <ZoomIn className="h-5 w-5 text-foreground" />
          </div>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 bg-background/95 backdrop-blur-md border-border">
          <DialogTitle className="sr-only">Event Hero Image</DialogTitle>
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-3 right-3 z-50 rounded-full bg-background/80 p-2 text-foreground hover:bg-background transition-colors shadow-md"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center justify-center p-4 max-h-[95vh] overflow-auto">
            <img
              src={snapshot}
              alt="Event hero sketch - full view"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

