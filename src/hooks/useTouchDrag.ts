import { useState, useCallback, useRef, useEffect } from 'react';

interface TouchDragState<T> {
  isDragging: boolean;
  draggedItem: T | null;
  touchPosition: { x: number; y: number } | null;
  dropTarget: string | null;
}

interface UseTouchDragOptions<T> {
  onDragStart?: (item: T) => void;
  onDragEnd?: (item: T | null, dropTarget: string | null) => void;
  onDrop?: (item: T, dropTarget: string) => void;
  dropTargetSelector?: string;
  feedbackDuration?: number;
}

interface UseTouchDragReturn<T> {
  state: TouchDragState<T>;
  touchHandlers: {
    onTouchStart: (e: React.TouchEvent, item: T) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
  dropZoneProps: (targetId: string) => {
    'data-drop-zone': string;
    'aria-dropeffect': 'move';
    className?: string;
  };
  isDraggingItem: (item: T) => boolean;
  isDropTarget: (targetId: string) => boolean;
}

/**
 * Custom hook for touch-based drag and drop functionality
 * Provides mobile-friendly drag interactions for Kanban boards and sortable lists
 */
export function useTouchDrag<T extends { id: string }>(
  options: UseTouchDragOptions<T> = {}
): UseTouchDragReturn<T> {
  const {
    onDragStart,
    onDragEnd,
    onDrop,
    dropTargetSelector = '[data-drop-zone]',
    feedbackDuration = 150,
  } = options;

  const [state, setState] = useState<TouchDragState<T>>({
    isDragging: false,
    draggedItem: null,
    touchPosition: null,
    dropTarget: null,
  });

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startPositionRef = useRef<{ x: number; y: number } | null>(null);
  const hasMoved = useRef(false);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const findDropTarget = useCallback((x: number, y: number): string | null => {
    const elements = document.elementsFromPoint(x, y);
    for (const element of elements) {
      const dropZone = element.closest(dropTargetSelector);
      if (dropZone && dropZone instanceof HTMLElement) {
        return dropZone.dataset.dropZone || null;
      }
    }
    return null;
  }, [dropTargetSelector]);

  const onTouchStart = useCallback((e: React.TouchEvent, item: T) => {
    const touch = e.touches[0];
    startPositionRef.current = { x: touch.clientX, y: touch.clientY };
    hasMoved.current = false;

    // Long press to initiate drag (300ms)
    longPressTimerRef.current = setTimeout(() => {
      if (!hasMoved.current) {
        // Haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(feedbackDuration);
        }

        setState({
          isDragging: true,
          draggedItem: item,
          touchPosition: { x: touch.clientX, y: touch.clientY },
          dropTarget: null,
        });

        onDragStart?.(item);
      }
    }, 300);
  }, [onDragStart, feedbackDuration]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    
    // Check if we've moved enough to cancel long press
    if (startPositionRef.current && !state.isDragging) {
      const dx = Math.abs(touch.clientX - startPositionRef.current.x);
      const dy = Math.abs(touch.clientY - startPositionRef.current.y);
      if (dx > 10 || dy > 10) {
        hasMoved.current = true;
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }
    }

    if (state.isDragging) {
      e.preventDefault(); // Prevent scrolling while dragging
      
      const dropTarget = findDropTarget(touch.clientX, touch.clientY);
      
      setState(prev => ({
        ...prev,
        touchPosition: { x: touch.clientX, y: touch.clientY },
        dropTarget,
      }));
    }
  }, [state.isDragging, findDropTarget]);

  const onTouchEnd = useCallback((_e: React.TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (state.isDragging && state.draggedItem) {
      if (state.dropTarget) {
        onDrop?.(state.draggedItem, state.dropTarget);
      }
      onDragEnd?.(state.draggedItem, state.dropTarget);
    }

    setState({
      isDragging: false,
      draggedItem: null,
      touchPosition: null,
      dropTarget: null,
    });

    startPositionRef.current = null;
    hasMoved.current = false;
  }, [state.isDragging, state.draggedItem, state.dropTarget, onDrop, onDragEnd]);

  const dropZoneProps = useCallback((targetId: string) => ({
    'data-drop-zone': targetId,
    'aria-dropeffect': 'move' as const,
    className: state.dropTarget === targetId ? 'ring-2 ring-primary ring-opacity-50' : undefined,
  }), [state.dropTarget]);

  const isDraggingItem = useCallback((item: T) => {
    return state.isDragging && state.draggedItem?.id === item.id;
  }, [state.isDragging, state.draggedItem]);

  const isDropTarget = useCallback((targetId: string) => {
    return state.dropTarget === targetId;
  }, [state.dropTarget]);

  return {
    state,
    touchHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
    dropZoneProps,
    isDraggingItem,
    isDropTarget,
  };
}
