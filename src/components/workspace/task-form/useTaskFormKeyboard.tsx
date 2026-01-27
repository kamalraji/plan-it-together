import { useEffect, useCallback, RefObject } from 'react';
import { TaskPriority } from '@/types';

interface UseTaskFormKeyboardOptions {
  formRef: RefObject<HTMLFormElement>;
  onSubmit: () => void;
  onCancel: () => void;
  onSaveDraft?: () => void;
  onPriorityChange?: (priority: TaskPriority) => void;
  onToggleDependencies?: () => void;
  onToggleSubtasks?: () => void;
  disabled?: boolean;
}

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  description: string;
  action: () => void;
}

export function useTaskFormKeyboard({
  formRef,
  onSubmit,
  onCancel,
  onSaveDraft,
  onPriorityChange,
  onToggleDependencies,
  onToggleSubtasks,
  disabled = false,
}: UseTaskFormKeyboardOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifierKey = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + Enter: Submit form
      if (modifierKey && e.key === 'Enter') {
        e.preventDefault();
        onSubmit();
        return;
      }

      // Escape: Cancel/close form
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
        return;
      }

      // Ctrl/Cmd + S: Save draft
      if (modifierKey && e.key === 's') {
        e.preventDefault();
        onSaveDraft?.();
        return;
      }

      // Ctrl/Cmd + 1/2/3/4: Set priority
      if (modifierKey && onPriorityChange) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            onPriorityChange(TaskPriority.LOW);
            return;
          case '2':
            e.preventDefault();
            onPriorityChange(TaskPriority.MEDIUM);
            return;
          case '3':
            e.preventDefault();
            onPriorityChange(TaskPriority.HIGH);
            return;
          case '4':
            e.preventDefault();
            onPriorityChange(TaskPriority.URGENT);
            return;
        }
      }

      // Ctrl/Cmd + D: Toggle dependencies
      if (modifierKey && e.key === 'd') {
        e.preventDefault();
        onToggleDependencies?.();
        return;
      }

      // Ctrl/Cmd + T: Toggle subtasks
      if (modifierKey && e.key === 't') {
        // Don't prevent default for Cmd+T (new tab) on Mac
        if (!isMac || e.shiftKey) {
          e.preventDefault();
          onToggleSubtasks?.();
        }
        return;
      }
    },
    [disabled, onSubmit, onCancel, onSaveDraft, onPriorityChange, onToggleDependencies, onToggleSubtasks]
  );

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    // Listen on the form element to capture keyboard events
    form.addEventListener('keydown', handleKeyDown);

    return () => {
      form.removeEventListener('keydown', handleKeyDown);
    };
  }, [formRef, handleKeyDown]);

  // Return shortcuts info for display
  const shortcuts: KeyboardShortcut[] = [
    { key: 'Enter', ctrl: true, meta: true, description: 'Submit', action: onSubmit },
    { key: 'Escape', description: 'Cancel', action: onCancel },
    { key: 'S', ctrl: true, meta: true, description: 'Save draft', action: onSaveDraft || (() => {}) },
    { key: '1', ctrl: true, meta: true, description: 'Low priority', action: () => onPriorityChange?.(TaskPriority.LOW) },
    { key: '2', ctrl: true, meta: true, description: 'Medium priority', action: () => onPriorityChange?.(TaskPriority.MEDIUM) },
    { key: '3', ctrl: true, meta: true, description: 'High priority', action: () => onPriorityChange?.(TaskPriority.HIGH) },
  ];

  return { shortcuts };
}

// Keyboard shortcut hint component
export function KeyboardShortcutHint({ shortcut, className }: { shortcut: string; className?: string }) {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';
  
  const formattedShortcut = shortcut
    .replace('Ctrl+', `${modKey}+`)
    .replace('Cmd+', `${modKey}+`);

  return (
    <kbd className={`text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground font-mono ${className || ''}`}>
      {formattedShortcut}
    </kbd>
  );
}
