/**
 * useAIContentAssist - Hook for AI-powered content generation
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type AIAssistType = 'task_description' | 'message_compose' | 'summarize' | 'suggest_subtasks';

interface AIAssistContext {
  workspaceName?: string;
  channelName?: string;
  taskTitle?: string;
}

interface UseAIContentAssistReturn {
  generate: (type: AIAssistType, content: string, context?: AIAssistContext) => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
}

export const useAIContentAssist = (): UseAIContentAssistReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generate = useCallback(
    async (
      type: AIAssistType,
      content: string,
      context?: AIAssistContext
    ): Promise<string | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke('ai-content-assist', {
          body: { type, content, context },
        });

        if (fnError) {
          throw new Error(fnError.message);
        }

        if (data?.error) {
          // Handle specific error types
          if (data.error.includes('Rate limit')) {
            toast({
              variant: 'destructive',
              title: 'Rate Limit',
              description: 'Too many requests. Please wait a moment and try again.',
            });
          } else if (data.error.includes('credits')) {
            toast({
              variant: 'destructive',
              title: 'AI Credits Exhausted',
              description: 'Please add credits to continue using AI features.',
            });
          }
          throw new Error(data.error);
        }

        return data?.content || null;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to generate content';
        setError(message);
        console.error('AI Content Assist error:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  return { generate, isLoading, error };
};

/**
 * Quick AI actions hook for common use cases
 */
export const useQuickAIActions = () => {
  const { generate, isLoading, error } = useAIContentAssist();

  const improveTaskDescription = useCallback(
    (taskTitle: string, currentDescription: string, workspaceName?: string) =>
      generate('task_description', currentDescription || taskTitle, {
        workspaceName,
        taskTitle,
      }),
    [generate]
  );

  const composeMessage = useCallback(
    (topic: string, channelName?: string) =>
      generate('message_compose', topic, { channelName }),
    [generate]
  );

  const summarizeContent = useCallback(
    (content: string) => generate('summarize', content),
    [generate]
  );

  const suggestSubtasks = useCallback(
    (taskTitle: string, taskDescription: string) =>
      generate('suggest_subtasks', taskDescription, { taskTitle }),
    [generate]
  );

  return {
    improveTaskDescription,
    composeMessage,
    summarizeContent,
    suggestSubtasks,
    isLoading,
    error,
  };
};
