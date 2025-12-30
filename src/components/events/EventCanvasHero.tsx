import React, { useLayoutEffect, useMemo, useState } from 'react';
import { Tldraw, createTLStore, loadSnapshot, DefaultSpinner } from 'tldraw';
import 'tldraw/tldraw.css';

interface EventCanvasHeroProps {
  snapshot: any | null | undefined;
}

/**
 * Read-only viewer for the event's designed canvas hero.
 * Renders the stored tldraw snapshot without any editing UI.
 */
export const EventCanvasHero: React.FC<EventCanvasHeroProps> = ({ snapshot }) => {
  const store = useMemo(() => createTLStore(), []);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useLayoutEffect(() => {
    if (!snapshot) {
      setStatus('error');
      return;
    }

    try {
      loadSnapshot(store, snapshot);
      setStatus('ready');
    } catch (error) {
      console.error('Failed to load event canvas hero snapshot', error);
      setStatus('error');
    }
  }, [snapshot, store]);

  if (status === 'loading') {
    return (
      <div className="flex h-[360px] items-center justify-center rounded-2xl border border-border bg-card">
        <DefaultSpinner />
      </div>
    );
  }

  if (status === 'error') {
    // Silently fail and let the rest of the hero render using branding
    return null;
  }

  return (
    <div className="relative h-[360px] w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <Tldraw
        store={store}
        hideUi
        onMount={(editor) => {
          editor.updateInstanceState({ isReadonly: true });
        }}
      />
    </div>
  );
};
