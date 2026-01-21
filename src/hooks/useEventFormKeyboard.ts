import { useEffect, useCallback } from 'react';

interface UseEventFormKeyboardOptions {
  onSave: () => void;
  onSaveDraft?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
}

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  description: string;
}

/**
 * Hook for keyboard shortcuts in the event form.
 * Supports Ctrl/Cmd+S for save, Escape for cancel.
 */
export function useEventFormKeyboard({
  onSave,
  onSaveDraft,
  onCancel,
  disabled = false,
}: UseEventFormKeyboardOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifierKey = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + S: Save form
      if (modifierKey && e.key === 's') {
        e.preventDefault();
        if (e.shiftKey && onSaveDraft) {
          // Ctrl/Cmd + Shift + S: Save as draft
          onSaveDraft();
        } else {
          onSave();
        }
        return;
      }

      // Escape: Cancel/close form
      if (e.key === 'Escape' && onCancel) {
        e.preventDefault();
        onCancel();
        return;
      }
    },
    [disabled, onSave, onSaveDraft, onCancel]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Return shortcuts info for display
  const shortcuts: KeyboardShortcut[] = [
    { key: 'S', ctrl: true, meta: true, description: 'Save' },
    { key: 'S', ctrl: true, meta: true, shift: true, description: 'Save draft' },
    { key: 'Escape', description: 'Cancel' },
  ];

  return { shortcuts };
}

// Format shortcut for display
export function formatShortcut(shortcut: string): string {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';
  
  return shortcut
    .replace('Ctrl+', `${modKey}+`)
    .replace('Cmd+', `${modKey}+`);
}
