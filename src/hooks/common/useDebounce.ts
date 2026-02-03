import { useState, useEffect } from 'react';

/**
 * Debounce a value by a specified delay.
 * Returns the debounced value which updates only after the delay has passed
 * since the last change to the input value.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
