/**
 * SmartComposeInput - AI-enhanced text input with "Tab to apply" logic
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useAIContentAssist } from '@/hooks/useAIContentAssist';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/common/useDebounce';

interface SmartComposeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoSuggest?: boolean;
  suggestType?: 'task_description' | 'message_compose';
  context?: {
    workspaceName?: string;
    channelName?: string;
  };
  minLength?: number;
  debounceMs?: number;
}

export const SmartComposeInput: React.FC<SmartComposeInputProps> = ({
  value,
  onChange,
  placeholder = 'Start typing...',
  className,
  autoSuggest = true,
  suggestType = 'message_compose',
  context,
  minLength = 15,
  debounceMs = 1500,
}) => {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { generate, isLoading } = useAIContentAssist();
  const debouncedValue = useDebounce(value, debounceMs);

  // Generate suggestion when user pauses typing
  useEffect(() => {
    if (!autoSuggest || !debouncedValue || debouncedValue.length < minLength) {
      setSuggestion(null);
      setShowSuggestion(false);
      return;
    }

    // Don't suggest if already has significant content
    if (debouncedValue.length > 200) {
      return;
    }

    const fetchSuggestion = async () => {
      const result = await generate(suggestType, debouncedValue, context);
      if (result && result !== debouncedValue) {
        setSuggestion(result);
        setShowSuggestion(true);
      }
    };

    fetchSuggestion();
  }, [debouncedValue, autoSuggest, generate, suggestType, context, minLength]);

  // Handle Tab to apply suggestion
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Tab' && showSuggestion && suggestion) {
        e.preventDefault();
        onChange(suggestion);
        setSuggestion(null);
        setShowSuggestion(false);
      } else if (e.key === 'Escape' && showSuggestion) {
        e.preventDefault();
        setSuggestion(null);
        setShowSuggestion(false);
      }
    },
    [showSuggestion, suggestion, onChange]
  );

  // Clear suggestion when user types
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    if (showSuggestion) {
      setShowSuggestion(false);
    }
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn('resize-none', className)}
      />

      {/* AI Indicator */}
      {isLoading && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>AI thinking...</span>
        </div>
      )}

      {/* Suggestion Preview */}
      {showSuggestion && suggestion && !isLoading && (
        <div className="absolute left-0 right-0 bottom-full mb-2 z-10">
          <div className="bg-card border rounded-lg shadow-lg p-3 max-h-[150px] overflow-y-auto">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">AI Suggestion</p>
                <p className="text-sm whitespace-pre-wrap line-clamp-4">{suggestion}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 pt-2 border-t text-xs text-muted-foreground">
              <kbd className="px-1.5 py-0.5 bg-muted rounded">Tab</kbd>
              <span>to apply</span>
              <span className="mx-1">•</span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded">Esc</kbd>
              <span>to dismiss</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
