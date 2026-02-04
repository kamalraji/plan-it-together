import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UsernameValidationState {
  isChecking: boolean;
  isAvailable: boolean | null;
  error: string | undefined;
  suggestions: string[];
}

interface AvailabilityResult {
  available: boolean;
  reason: string | null;
  message: string;
}

// Basic profanity filter - expand as needed
const PROFANITY_PATTERNS = [
  /\b(ass|fuck|shit|damn|bitch|crap|piss|dick|cock|pussy|fag|slut|whore|bastard|cunt)\b/i,
];

export function useUsernameValidation(username: string, debounceMs = 500) {
  const { user } = useAuth();
  const [state, setState] = useState<UsernameValidationState>({
    isChecking: false,
    isAvailable: null,
    error: undefined,
    suggestions: [],
  });

  // Format validation (client-side, immediate)
  const validateFormat = useCallback((value: string): string | undefined => {
    if (!value) return undefined;
    
    const trimmed = value.trim();
    
    if (trimmed.length < 3) {
      return 'Username must be at least 3 characters';
    }
    
    if (trimmed.length > 30) {
      return 'Username must be 30 characters or less';
    }
    
    if (!/^[a-zA-Z]/.test(trimmed)) {
      return 'Username must start with a letter';
    }
    
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(trimmed)) {
      return 'Only letters, numbers, and underscores allowed';
    }
    
    // Check profanity
    const lower = trimmed.toLowerCase();
    if (PROFANITY_PATTERNS.some(pattern => pattern.test(lower))) {
      return 'Username contains inappropriate content';
    }
    
    return undefined;
  }, []);

  // Generate username suggestions based on the attempted username
  const generateSuggestions = useCallback((base: string): string[] => {
    const suggestions: string[] = [];
    const clean = base.replace(/[^a-zA-Z0-9]/g, '').slice(0, 25).toLowerCase();
    
    if (!clean || clean.length < 2) return [];
    
    // Add random numbers
    suggestions.push(`${clean}${Math.floor(Math.random() * 999)}`);
    
    // Add year
    suggestions.push(`${clean}_${new Date().getFullYear()}`);
    
    // Add prefix
    if (clean.length <= 27) {
      suggestions.push(`the_${clean}`);
    }
    
    // Add underscore variant
    if (clean.length <= 28) {
      suggestions.push(`${clean}_x`);
    }
    
    return suggestions.filter(s => s.length >= 3 && s.length <= 30).slice(0, 3);
  }, []);

  useEffect(() => {
    const trimmedUsername = username?.trim() || '';
    
    // Reset state if empty or too short
    if (!trimmedUsername || trimmedUsername.length < 3) {
      setState({ 
        isChecking: false, 
        isAvailable: null, 
        error: undefined, 
        suggestions: [] 
      });
      return;
    }

    // Check format first (immediate feedback)
    const formatError = validateFormat(trimmedUsername);
    if (formatError) {
      setState({ 
        isChecking: false, 
        isAvailable: false, 
        error: formatError, 
        suggestions: [] 
      });
      return;
    }

    // Show loading state
    setState(prev => ({ ...prev, isChecking: true, error: undefined }));

    // Debounced API call
    const timeoutId = setTimeout(async () => {
      try {
        const { data, error } = await supabase.rpc('check_username_availability', {
          _username: trimmedUsername,
          _user_id: user?.id,
        });

        if (error) throw error;

        const result = data as unknown as AvailabilityResult;
        
        setState({
          isChecking: false,
          isAvailable: result.available,
          error: result.available ? undefined : (result.message || 'Username unavailable'),
          suggestions: result.available ? [] : generateSuggestions(trimmedUsername),
        });
      } catch (_err) {
        setState({
          isChecking: false,
          isAvailable: null,
          error: 'Unable to check availability. Please try again.',
          suggestions: [],
        });
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [username, user?.id, validateFormat, generateSuggestions, debounceMs]);

  return {
    ...state,
    formatError: validateFormat(username?.trim() || ''),
  };
}

// Helper to check if user can change username (30-day rate limit)
export function canChangeUsername(usernameChangedAt: string | null | undefined): {
  canChange: boolean;
  daysRemaining: number;
} {
  if (!usernameChangedAt) {
    return { canChange: true, daysRemaining: 0 };
  }
  
  const changedDate = new Date(usernameChangedAt);
  const thirtyDaysLater = new Date(changedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const now = new Date();
  
  if (now >= thirtyDaysLater) {
    return { canChange: true, daysRemaining: 0 };
  }
  
  const daysRemaining = Math.ceil(
    (thirtyDaysLater.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
  );
  
  return { canChange: false, daysRemaining };
}
