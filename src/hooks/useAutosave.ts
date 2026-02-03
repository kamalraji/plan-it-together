import { useCallback, useRef, useState, useEffect } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'unsaved' | 'error';

interface AutosaveOptions {
  /** Debounce delay in ms (default: 2000) */
  debounceMs?: number;
  /** Periodic save interval in ms (default: 30000) */
  intervalMs?: number;
  /** Function to save the data */
  onSave: (data: unknown) => Promise<void>;
  /** Callback when save status changes */
  onStatusChange?: (status: SaveStatus) => void;
}

export function useAutosave({
  debounceMs = 2000,
  intervalMs = 30000,
  onSave,
  onStatusChange,
}: AutosaveOptions) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  
  const dataRef = useRef<unknown>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const intervalRef = useRef<NodeJS.Timeout>();
  const isSavingRef = useRef(false);
  const hasUnsavedChangesRef = useRef(false);

  const updateStatus = useCallback((newStatus: SaveStatus) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  }, [onStatusChange]);

  const performSave = useCallback(async () => {
    if (isSavingRef.current || !hasUnsavedChangesRef.current || !dataRef.current) {
      return;
    }

    isSavingRef.current = true;
    updateStatus('saving');

    try {
      await onSave(dataRef.current);
      hasUnsavedChangesRef.current = false;
      setLastSavedAt(new Date());
      updateStatus('saved');
    } catch (error) {
      console.error('Autosave failed:', error);
      updateStatus('error');
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave, updateStatus]);

  // Debounced save - called when data changes
  const triggerSave = useCallback((data: unknown) => {
    dataRef.current = data;
    hasUnsavedChangesRef.current = true;
    updateStatus('unsaved');

    // Clear existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new debounce timeout
    debounceTimeoutRef.current = setTimeout(() => {
      performSave();
    }, debounceMs);
  }, [debounceMs, performSave, updateStatus]);

  // Force immediate save
  const saveNow = useCallback(async () => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    await performSave();
  }, [performSave]);

  // Set up periodic save interval
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (hasUnsavedChangesRef.current) {
        performSave();
      }
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [intervalMs, performSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Save on beforeunload if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChangesRef.current) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return {
    status,
    lastSavedAt,
    triggerSave,
    saveNow,
    hasUnsavedChanges: hasUnsavedChangesRef.current,
  };
}
