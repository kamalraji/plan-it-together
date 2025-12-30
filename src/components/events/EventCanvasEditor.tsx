import React, { useLayoutEffect, useMemo, useState } from 'react';
import { Tldraw, createTLStore, getSnapshot, loadSnapshot, DefaultSpinner } from 'tldraw';
import 'tldraw/tldraw.css';

interface EventCanvasEditorProps {
  value?: any;
  onChange?: (snapshot: any) => void;
}

/**
 * Canvas editor for designing an event hero / layout using tldraw.
 * The serialized snapshot is passed up via `onChange` for persistence.
 */
export const EventCanvasEditor: React.FC<EventCanvasEditorProps> = ({ value, onChange }) => {
  const store = useMemo(() => createTLStore(), []);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useLayoutEffect(() => {
    try {
      if (value) {
        loadSnapshot(store, value);
      }
      setStatus('ready');
    } catch (error) {
      console.error('Failed to load event canvas snapshot', error);
      setStatus('error');
    }

    const cleanup = store.listen(() => {
      if (!onChange) return;
      const snapshot = getSnapshot(store);
      onChange(snapshot);
    });

    return () => {
      cleanup();
    };
  }, [store, value, onChange]);

  if (status === 'loading') {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-2xl border border-border bg-card">
        <DefaultSpinner />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-2xl border border-destructive/40 bg-destructive/5 text-sm text-destructive">
        We couldn&apos;t load the event canvas. You can continue using the form while we fix this.
      </div>
    );
  }

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <Tldraw store={store} />
    </div>
  );
};
