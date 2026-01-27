import { useState, useRef, useCallback, TouchEvent } from 'react';

interface SwipeGestureOptions {
  threshold?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeComplete?: (direction: 'left' | 'right') => void;
}

interface SwipeState {
  isSwiping: boolean;
  direction: 'left' | 'right' | null;
  offset: number;
  startX: number;
}

export function useSwipeGesture(options: SwipeGestureOptions = {}) {
  const { threshold = 80, onSwipeLeft, onSwipeRight, onSwipeComplete } = options;
  
  const [swipeState, setSwipeState] = useState<SwipeState>({
    isSwiping: false,
    direction: null,
    offset: 0,
    startX: 0,
  });

  const elementRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    setSwipeState({
      isSwiping: true,
      direction: null,
      offset: 0,
      startX: touch.clientX,
    });
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!swipeState.isSwiping) return;
    
    const touch = e.touches[0];
    const diff = touch.clientX - swipeState.startX;
    const direction = diff > 0 ? 'right' : 'left';
    
    // Limit the swipe distance
    const maxOffset = 120;
    const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, diff));
    
    setSwipeState(prev => ({
      ...prev,
      direction,
      offset: clampedOffset,
    }));
  }, [swipeState.isSwiping, swipeState.startX]);

  const handleTouchEnd = useCallback(() => {
    const { direction, offset } = swipeState;
    
    if (Math.abs(offset) >= threshold) {
      if (direction === 'left' && onSwipeLeft) {
        onSwipeLeft();
      } else if (direction === 'right' && onSwipeRight) {
        onSwipeRight();
      }
      if (direction && onSwipeComplete) {
        onSwipeComplete(direction);
      }
    }
    
    setSwipeState({
      isSwiping: false,
      direction: null,
      offset: 0,
      startX: 0,
    });
  }, [swipeState, threshold, onSwipeLeft, onSwipeRight, onSwipeComplete]);

  const resetSwipe = useCallback(() => {
    setSwipeState({
      isSwiping: false,
      direction: null,
      offset: 0,
      startX: 0,
    });
  }, []);

  return {
    swipeState,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    elementRef,
    resetSwipe,
    isSwipingLeft: swipeState.direction === 'left' && Math.abs(swipeState.offset) >= threshold,
    isSwipingRight: swipeState.direction === 'right' && Math.abs(swipeState.offset) >= threshold,
  };
}
