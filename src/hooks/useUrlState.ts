/**
 * useUrlState Hook
 * Industrial-standard URL state management for deep linking and filter persistence
 * 
 * Features:
 * - Syncs component state with URL query parameters
 * - Type-safe with generics
 * - Supports default values and cleanup
 * - Uses replace mode to prevent cluttering history
 */

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

type URLStateValue = string | number | boolean | string[] | null;

/**
 * Sync a single value with a URL query parameter
 */
export function useUrlState<T extends URLStateValue>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const value = useMemo(() => {
    const param = searchParams.get(key);
    
    if (param === null) return defaultValue;
    
    // Parse based on default value type
    if (typeof defaultValue === 'number') {
      const parsed = Number(param);
      return (isNaN(parsed) ? defaultValue : parsed) as T;
    }
    
    if (typeof defaultValue === 'boolean') {
      return (param === 'true') as unknown as T;
    }
    
    if (Array.isArray(defaultValue)) {
      return param.split(',').filter(Boolean) as unknown as T;
    }
    
    return param as T;
  }, [searchParams, key, defaultValue]);

  const setValue = useCallback((newValue: T) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      
      // Remove parameter if it equals default
      const shouldRemove = 
        newValue === defaultValue ||
        newValue === null ||
        newValue === '' ||
        (Array.isArray(newValue) && newValue.length === 0);
      
      if (shouldRemove) {
        next.delete(key);
      } else if (Array.isArray(newValue)) {
        next.set(key, newValue.join(','));
      } else {
        next.set(key, String(newValue));
      }
      
      return next;
    }, { replace: true });
  }, [key, defaultValue, setSearchParams]);

  return [value, setValue];
}

/**
 * Sync multiple values with URL query parameters
 * Returns an object with values and setters
 */
export function useUrlStateObject<T extends Record<string, URLStateValue>>(
  defaults: T
): { values: T; setValue: <K extends keyof T>(key: K, value: T[K]) => void; setValues: (updates: Partial<T>) => void; resetAll: () => void } {
  const [searchParams, setSearchParams] = useSearchParams();

  const values = useMemo(() => {
    const result = {} as T;
    
    for (const [key, defaultValue] of Object.entries(defaults)) {
      const param = searchParams.get(key);
      
      if (param === null) {
        result[key as keyof T] = defaultValue as T[keyof T];
        continue;
      }
      
      if (typeof defaultValue === 'number') {
        const parsed = Number(param);
        result[key as keyof T] = (isNaN(parsed) ? defaultValue : parsed) as T[keyof T];
      } else if (typeof defaultValue === 'boolean') {
        result[key as keyof T] = (param === 'true') as unknown as T[keyof T];
      } else if (Array.isArray(defaultValue)) {
        result[key as keyof T] = param.split(',').filter(Boolean) as unknown as T[keyof T];
      } else {
        result[key as keyof T] = param as T[keyof T];
      }
    }
    
    return result;
  }, [searchParams, defaults]);

  const setValue = useCallback(<K extends keyof T>(key: K, newValue: T[K]) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      const defaultValue = defaults[key];
      
      const shouldRemove = 
        newValue === defaultValue ||
        newValue === null ||
        newValue === '' ||
        (Array.isArray(newValue) && newValue.length === 0);
      
      if (shouldRemove) {
        next.delete(key as string);
      } else if (Array.isArray(newValue)) {
        next.set(key as string, newValue.join(','));
      } else {
        next.set(key as string, String(newValue));
      }
      
      return next;
    }, { replace: true });
  }, [defaults, setSearchParams]);

  const setValues = useCallback((updates: Partial<T>) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      
      for (const [key, newValue] of Object.entries(updates)) {
        const defaultValue = defaults[key as keyof T];
        
        const shouldRemove = 
          newValue === defaultValue ||
          newValue === null ||
          newValue === '' ||
          (Array.isArray(newValue) && newValue.length === 0);
        
        if (shouldRemove) {
          next.delete(key);
        } else if (Array.isArray(newValue)) {
          next.set(key, newValue.join(','));
        } else {
          next.set(key, String(newValue));
        }
      }
      
      return next;
    }, { replace: true });
  }, [defaults, setSearchParams]);

  const resetAll = useCallback(() => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      for (const key of Object.keys(defaults)) {
        next.delete(key);
      }
      return next;
    }, { replace: true });
  }, [defaults, setSearchParams]);

  return { values, setValue, setValues, resetAll };
}

/**
 * Parse tab from URL with validation against allowed values
 */
export function useUrlTab<T extends string>(
  key: string,
  defaultTab: T,
  allowedTabs: readonly T[]
): [T, (tab: T) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = useMemo(() => {
    const param = searchParams.get(key);
    if (param && allowedTabs.includes(param as T)) {
      return param as T;
    }
    return defaultTab;
  }, [searchParams, key, defaultTab, allowedTabs]);

  const setTab = useCallback((tab: T) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (tab === defaultTab) {
        next.delete(key);
      } else {
        next.set(key, tab);
      }
      return next;
    }, { replace: true });
  }, [key, defaultTab, setSearchParams]);

  return [currentTab, setTab];
}
