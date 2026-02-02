import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  category: 'navigation' | 'actions' | 'task' | 'general';
}

interface UseGlobalKeyboardShortcutsOptions {
  onNewTask?: () => void;
  onSearch?: () => void;
  onToggleSidebar?: () => void;
  onShowShortcuts?: () => void;
  disabled?: boolean;
}

export const GLOBAL_SHORTCUTS: KeyboardShortcut[] = [
  // Navigation
  { key: 'h', ctrl: true, meta: true, description: 'Go to Home', category: 'navigation' },
  { key: 'd', ctrl: true, meta: true, description: 'Go to Dashboard', category: 'navigation' },
  { key: 'e', ctrl: true, meta: true, description: 'Go to Events', category: 'navigation' },
  
  // Actions
  { key: 'n', ctrl: true, meta: true, description: 'New Task', category: 'actions' },
  { key: 'k', ctrl: true, meta: true, description: 'Open Search', category: 'actions' },
  { key: 'b', ctrl: true, meta: true, description: 'Toggle Sidebar', category: 'actions' },
  
  // Task Management
  { key: '1', ctrl: true, meta: true, description: 'Set Low Priority', category: 'task' },
  { key: '2', ctrl: true, meta: true, description: 'Set Medium Priority', category: 'task' },
  { key: '3', ctrl: true, meta: true, description: 'Set High Priority', category: 'task' },
  { key: '4', ctrl: true, meta: true, description: 'Set Urgent Priority', category: 'task' },
  
  // General
  { key: '?', shift: true, description: 'Show Keyboard Shortcuts', category: 'general' },
  { key: 'Escape', description: 'Close Modal/Cancel', category: 'general' },
];

export function useGlobalKeyboardShortcuts({
  onNewTask,
  onSearch,
  onToggleSidebar,
  onShowShortcuts,
  disabled = false,
}: UseGlobalKeyboardShortcutsOptions = {}) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;

      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape to work in inputs
        if (e.key !== 'Escape') return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifierKey = isMac ? e.metaKey : e.ctrlKey;

      // Show shortcuts with ?
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        onShowShortcuts?.();
        return;
      }

      // Navigation shortcuts
      if (modifierKey) {
        switch (e.key.toLowerCase()) {
          case 'h':
            e.preventDefault();
            navigate('/');
            return;
          case 'd':
            e.preventDefault();
            // Navigate to first available dashboard or home
            if (location.pathname.includes('/workspace/')) {
              // Stay on current workspace
            } else {
              navigate('/');
            }
            return;
          case 'e':
            e.preventDefault();
            navigate('/events');
            return;
          case 'n':
            e.preventDefault();
            onNewTask?.();
            return;
          case 'k':
            e.preventDefault();
            onSearch?.();
            return;
          case 'b':
            e.preventDefault();
            onToggleSidebar?.();
            return;
        }
      }
    },
    [disabled, navigate, location, onNewTask, onSearch, onToggleSidebar, onShowShortcuts]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return { shortcuts: GLOBAL_SHORTCUTS };
}

/**
 * Format a shortcut key for display
 */
export function formatShortcutKey(shortcut: KeyboardShortcut): string {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const parts: string[] = [];

  if (shortcut.ctrl || shortcut.meta) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }
  if (shortcut.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }
  
  // Format the key itself
  let key = shortcut.key;
  if (key === 'Escape') key = 'Esc';
  if (key === ' ') key = 'Space';
  parts.push(key.toUpperCase());

  return parts.join(isMac ? '' : '+');
}
