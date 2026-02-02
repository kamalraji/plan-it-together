import { useRef, useCallback, useEffect } from 'react';

interface SwipeConfig {
  threshold?: number;
  velocityThreshold?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  isTracking: boolean;
}

interface LongPressConfig {
  delay?: number;
  onLongPress: (event: TouchEvent | MouseEvent) => void;
  onPress?: () => void;
}

/**
 * Hook for detecting swipe gestures
 */
export function useSwipeGesture<T extends HTMLElement = HTMLElement>(
  config: SwipeConfig
) {
  const {
    threshold = 50,
    velocityThreshold = 0.3,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
  } = config;

  const elementRef = useRef<T>(null);
  const touchState = useRef<TouchState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    isTracking: false,
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    touchState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      isTracking: true,
    };
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!touchState.current.isTracking) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchState.current.startX;
      const deltaY = touch.clientY - touchState.current.startY;
      const deltaTime = Date.now() - touchState.current.startTime;

      const velocityX = Math.abs(deltaX) / deltaTime;
      const velocityY = Math.abs(deltaY) / deltaTime;

      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);

      if (isHorizontalSwipe) {
        if (Math.abs(deltaX) > threshold || velocityX > velocityThreshold) {
          if (deltaX > 0) {
            onSwipeRight?.();
          } else {
            onSwipeLeft?.();
          }
        }
      } else {
        if (Math.abs(deltaY) > threshold || velocityY > velocityThreshold) {
          if (deltaY > 0) {
            onSwipeDown?.();
          } else {
            onSwipeUp?.();
          }
        }
      }

      touchState.current.isTracking = false;
    },
    [threshold, velocityThreshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  return elementRef;
}

/**
 * Hook for detecting long press gestures
 */
export function useLongPress<T extends HTMLElement = HTMLElement>(
  config: LongPressConfig
) {
  const { delay = 500, onLongPress, onPress } = config;

  const elementRef = useRef<T>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);
  const startPosition = useRef({ x: 0, y: 0 });

  const start = useCallback(
    (event: TouchEvent | MouseEvent) => {
      isLongPress.current = false;

      // Store start position
      if ('touches' in event) {
        startPosition.current = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY,
        };
      } else {
        startPosition.current = {
          x: event.clientX,
          y: event.clientY,
        };
      }

      timerRef.current = setTimeout(() => {
        isLongPress.current = true;
        onLongPress(event);
      }, delay);
    },
    [delay, onLongPress]
  );

  const clear = useCallback(
    (_event: TouchEvent | MouseEvent, shouldTriggerPress = true) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (shouldTriggerPress && !isLongPress.current && onPress) {
        onPress();
      }
    },
    [onPress]
  );

  const move = useCallback(
    (event: TouchEvent | MouseEvent) => {
      // Cancel long press if moved too much
      let currentX: number;
      let currentY: number;

      if ('touches' in event) {
        currentX = event.touches[0].clientX;
        currentY = event.touches[0].clientY;
      } else {
        currentX = event.clientX;
        currentY = event.clientY;
      }

      const distance = Math.sqrt(
        Math.pow(currentX - startPosition.current.x, 2) +
          Math.pow(currentY - startPosition.current.y, 2)
      );

      if (distance > 10) {
        clear(event, false);
      }
    },
    [clear]
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => start(e);
    const handleTouchEnd = (e: TouchEvent) => clear(e);
    const handleTouchMove = (e: TouchEvent) => move(e);
    const handleMouseDown = (e: MouseEvent) => start(e);
    const handleMouseUp = (e: MouseEvent) => clear(e);
    const handleMouseMove = (e: MouseEvent) => move(e);
    const handleMouseLeave = (e: MouseEvent) => clear(e, false);

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mouseup', handleMouseUp);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mouseup', handleMouseUp);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [start, clear, move]);

  return elementRef;
}

/**
 * Hook for swipe-to-action gestures (like iOS swipe to delete)
 */
export function useSwipeAction<T extends HTMLElement = HTMLElement>(config: {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  swipeThreshold?: number;
  leftActionColor?: string;
  rightActionColor?: string;
}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    swipeThreshold = 100,
  } = config;

  const elementRef = useRef<T>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentX.current = startX.current;
    isDragging.current = true;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging.current || !elementRef.current) return;

    currentX.current = e.touches[0].clientX;
    const delta = currentX.current - startX.current;

    // Limit the swipe distance
    const limitedDelta = Math.max(-swipeThreshold * 1.5, Math.min(swipeThreshold * 1.5, delta));
    
    elementRef.current.style.transform = `translateX(${limitedDelta}px)`;
    elementRef.current.style.transition = 'none';
  }, [swipeThreshold]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current || !elementRef.current) return;

    const delta = currentX.current - startX.current;
    
    elementRef.current.style.transition = 'transform 0.3s ease-out';
    elementRef.current.style.transform = 'translateX(0)';

    if (Math.abs(delta) > swipeThreshold) {
      if (delta > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (delta < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    isDragging.current = false;
  }, [swipeThreshold, onSwipeLeft, onSwipeRight]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return elementRef;
}

/**
 * Hook for pinch-to-zoom gestures
 */
export function usePinchZoom<T extends HTMLElement = HTMLElement>(config: {
  minScale?: number;
  maxScale?: number;
  onScaleChange?: (scale: number) => void;
}) {
  const { minScale = 0.5, maxScale = 3, onScaleChange } = config;

  const elementRef = useRef<T>(null);
  const initialDistance = useRef(0);
  const currentScale = useRef(1);

  const getDistance = useCallback((touches: TouchList) => {
    return Math.sqrt(
      Math.pow(touches[0].clientX - touches[1].clientX, 2) +
        Math.pow(touches[0].clientY - touches[1].clientY, 2)
    );
  }, []);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialDistance.current = getDistance(e.touches);
      }
    },
    [getDistance]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length !== 2 || !elementRef.current) return;

      const distance = getDistance(e.touches);
      const scale = distance / initialDistance.current;
      const newScale = Math.max(minScale, Math.min(maxScale, currentScale.current * scale));

      elementRef.current.style.transform = `scale(${newScale})`;
      onScaleChange?.(newScale);
    },
    [getDistance, minScale, maxScale, onScaleChange]
  );

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (e.touches.length < 2 && elementRef.current) {
      // Get current scale from transform
      const transform = elementRef.current.style.transform;
      const match = transform.match(/scale\(([\d.]+)\)/);
      if (match) {
        currentScale.current = parseFloat(match[1]);
      }
    }
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { ref: elementRef, resetScale: () => { currentScale.current = 1; } };
}
