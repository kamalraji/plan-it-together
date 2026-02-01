import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TaskSuggestion {
  title: string;
  description: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  phase: 'PRE_EVENT' | 'DURING_EVENT' | 'POST_EVENT';
  estimatedHours?: number;
  subtasks?: string[];
}

interface UseTaskAISuggestionsOptions {
  eventName?: string;
  eventCategory?: string;
  startDate?: string;
  endDate?: string;
  existingTasks?: string[];
  workspaceType?: string;
}

export function useTaskAISuggestions(options: UseTaskAISuggestionsOptions) {
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const fetchSuggestions = useCallback(async () => {
    if (!options.eventName || !options.eventCategory || !options.startDate) {
      toast({
        title: 'Missing event context',
        description: 'Please ensure event details are available.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('suggest-tasks', {
        body: {
          eventName: options.eventName,
          eventCategory: options.eventCategory,
          startDate: options.startDate,
          endDate: options.endDate,
          existingTasks: options.existingTasks || [],
          workspaceType: options.workspaceType,
        },
      });

      if (fnError) throw fnError;

      if (data?.error) {
        throw new Error(data.error);
      }

      const newSuggestions = (data?.suggestions || []) as TaskSuggestion[];
      setSuggestions(newSuggestions);
      setDismissedIds(new Set());

      if (newSuggestions.length > 0) {
        toast({
          title: 'AI Suggestions Ready',
          description: `${newSuggestions.length} task suggestions generated.`,
        });
      } else {
        toast({
          title: 'No suggestions',
          description: 'AI could not generate suggestions at this time.',
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch suggestions';
      setError(message);
      toast({
        title: 'Failed to get suggestions',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [options, toast]);

  const dismissSuggestion = useCallback((index: number) => {
    const suggestion = suggestions[index];
    if (suggestion) {
      setDismissedIds(prev => new Set([...prev, suggestion.title]));
    }
  }, [suggestions]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setDismissedIds(new Set());
  }, []);

  const visibleSuggestions = suggestions.filter(s => !dismissedIds.has(s.title));

  return {
    suggestions: visibleSuggestions,
    allSuggestions: suggestions,
    isLoading,
    error,
    fetchSuggestions,
    dismissSuggestion,
    clearSuggestions,
    hasSuggestions: visibleSuggestions.length > 0,
  };
}
