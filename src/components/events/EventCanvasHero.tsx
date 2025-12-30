import React from 'react';

interface EventCanvasHeroProps {
  snapshot: any | null | undefined; // PNG data URL string
}

/**
 * Read-only viewer for the event's designed canvas hero.
 * Renders the stored PNG data URL inside a framed card.
 */
export const EventCanvasHero: React.FC<EventCanvasHeroProps> = ({ snapshot }) => {
  if (!snapshot || typeof snapshot !== 'string' || !snapshot.startsWith('data:image')) {
    // If there's no compatible snapshot, don't render anything extra.
    return null;
  }

  return (
    <div className="relative h-[360px] w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm flex items-center justify-center">
      <img
        src={snapshot}
        alt="Event hero sketch"
        className="max-h-full max-w-full object-contain"
        loading="lazy"
      />
    </div>
  );
};

