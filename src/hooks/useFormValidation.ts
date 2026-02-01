/**
 * useFormValidation Hook
 * 
 * Provides real-time validation feedback for form fields
 * with debounced validation and visual state management.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  validateField, 
  getValidationState,
  type EventFormValues 
} from '@/lib/event-form-schema';

interface FieldValidationState {
  touched: boolean;
  isValidating: boolean;
  error?: string;
  state: 'idle' | 'validating' | 'valid' | 'invalid';
}

type FieldStates = Partial<Record<keyof EventFormValues, FieldValidationState>>;

interface UseFormValidationOptions {
  /** Debounce delay in ms for real-time validation */
  debounceMs?: number;
  /** Fields to validate in real-time */
  realtimeFields?: (keyof EventFormValues)[];
}

export function useFormValidation(options: UseFormValidationOptions = {}) {
  const { debounceMs = 300, realtimeFields } = options;
  
  const [fieldStates, setFieldStates] = useState<FieldStates>({});
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const allValuesRef = useRef<Partial<EventFormValues>>({});

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, []);

  /**
   * Mark a field as touched (usually on blur)
   */
  const touchField = useCallback((fieldName: keyof EventFormValues) => {
    setFieldStates(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        touched: true,
        state: getValidationState(
          fieldName,
          allValuesRef.current[fieldName],
          true,
          prev[fieldName]?.error,
          prev[fieldName]?.isValidating
        ),
      },
    }));
  }, []);

  /**
   * Validate a field with debouncing for real-time feedback
   */
  const validateFieldRealtime = useCallback((
    fieldName: keyof EventFormValues,
    value: unknown,
    immediate = false
  ) => {
    // Store latest value
    allValuesRef.current[fieldName] = value as EventFormValues[typeof fieldName];

    // Skip if not in realtime fields list (if specified)
    if (realtimeFields && !realtimeFields.includes(fieldName)) {
      return;
    }

    // Clear existing timer
    if (debounceTimers.current[fieldName]) {
      clearTimeout(debounceTimers.current[fieldName]);
    }

    // Set validating state
    setFieldStates(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        touched: prev[fieldName]?.touched ?? false,
        isValidating: !immediate,
        state: immediate ? prev[fieldName]?.state || 'idle' : 'validating',
      },
    }));

    const runValidation = () => {
      const result = validateField(fieldName, value, allValuesRef.current);
      
      setFieldStates(prev => {
        const touched = prev[fieldName]?.touched ?? false;
        const newState = getValidationState(
          fieldName,
          value,
          touched,
          result.isValid ? undefined : result.error,
          false
        );

        return {
          ...prev,
          [fieldName]: {
            touched,
            isValidating: false,
            error: result.isValid ? undefined : result.error,
            state: newState,
          },
        };
      });
    };

    if (immediate) {
      runValidation();
    } else {
      debounceTimers.current[fieldName] = setTimeout(runValidation, debounceMs);
    }
  }, [debounceMs, realtimeFields]);

  /**
   * Clear validation state for a field
   */
  const clearFieldValidation = useCallback((fieldName: keyof EventFormValues) => {
    if (debounceTimers.current[fieldName]) {
      clearTimeout(debounceTimers.current[fieldName]);
    }
    setFieldStates(prev => {
      const newState = { ...prev };
      delete newState[fieldName];
      return newState;
    });
  }, []);

  /**
   * Clear all validation states
   */
  const clearAllValidation = useCallback(() => {
    Object.values(debounceTimers.current).forEach(clearTimeout);
    debounceTimers.current = {};
    setFieldStates({});
    allValuesRef.current = {};
  }, []);

  /**
   * Get the current validation state for a field
   */
  const getFieldState = useCallback((fieldName: keyof EventFormValues): FieldValidationState => {
    return fieldStates[fieldName] || {
      touched: false,
      isValidating: false,
      state: 'idle',
    };
  }, [fieldStates]);

  /**
   * Set error for a field (e.g., from server validation)
   */
  const setFieldError = useCallback((fieldName: keyof EventFormValues, error: string) => {
    setFieldStates(prev => ({
      ...prev,
      [fieldName]: {
        touched: true,
        isValidating: false,
        error,
        state: 'invalid',
      },
    }));
  }, []);

  /**
   * Batch update multiple field states
   */
  const updateAllValues = useCallback((values: Partial<EventFormValues>) => {
    allValuesRef.current = { ...allValuesRef.current, ...values };
  }, []);

  return {
    fieldStates,
    touchField,
    validateFieldRealtime,
    clearFieldValidation,
    clearAllValidation,
    getFieldState,
    setFieldError,
    updateAllValues,
  };
}

// ============================================
// Field-specific validation helpers
// ============================================

/**
 * Hook for validating event name with availability check
 */
export function useEventNameValidation() {
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const checkAvailability = useCallback(async (name: string, organizationId: string) => {
    if (!name || name.length < 3 || !organizationId) {
      setIsAvailable(null);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setIsChecking(true);

    debounceRef.current = setTimeout(async () => {
      try {
        // In a real implementation, check if event name exists in the org
        // For now, just simulate the check
        await new Promise(resolve => setTimeout(resolve, 500));
        setIsAvailable(true);
      } catch {
        setIsAvailable(null);
      } finally {
        setIsChecking(false);
      }
    }, 500);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return { isChecking, isAvailable, checkAvailability };
}

/**
 * Hook for slug validation with format checking
 */
export function useSlugValidation() {
  const validateSlug = useCallback((slug: string): { isValid: boolean; error?: string } => {
    if (!slug) return { isValid: true };

    // Check format
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      return {
        isValid: false,
        error: 'Use only lowercase letters, numbers, and hyphens',
      };
    }

    // Check length
    if (slug.length < 3) {
      return { isValid: false, error: 'Must be at least 3 characters' };
    }
    if (slug.length > 60) {
      return { isValid: false, error: 'Cannot exceed 60 characters' };
    }

    return { isValid: true };
  }, []);

  const formatSlug = useCallback((input: string): string => {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }, []);

  return { validateSlug, formatSlug };
}
