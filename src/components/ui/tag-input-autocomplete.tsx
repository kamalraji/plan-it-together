import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/looseClient';

interface TagInputWithAutocompleteProps {
  eventId: string;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  maxTags?: number;
  placeholder?: string;
  disabled?: boolean;
}

export const TagInputWithAutocomplete: React.FC<TagInputWithAutocompleteProps> = ({
  eventId,
  tags,
  onTagsChange,
  maxTags = 10,
  placeholder = 'Add a tag and press Enter',
  disabled = false,
}) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch existing tags from organization's events
  useEffect(() => {
    const fetchExistingTags = async () => {
      if (!input.trim() || input.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        // First get the organization_id for this event
        const { data: eventData } = await supabase
          .from('events')
          .select('organization_id')
          .eq('id', eventId)
          .maybeSingle();

        if (!eventData?.organization_id) {
          setSuggestions([]);
          return;
        }

        // Fetch all events in this organization
        const { data: events } = await supabase
          .from('events')
          .select('branding')
          .eq('organization_id', eventData.organization_id)
          .neq('id', eventId); // Exclude current event

        if (!events) {
          setSuggestions([]);
          return;
        }

        // Extract all unique tags from events
        const allTags = new Set<string>();
        events.forEach((event: { branding: unknown }) => {
          const branding = event.branding as Record<string, any>;
          const seoTags = branding?.seo?.tags as string[] | undefined;
          if (seoTags && Array.isArray(seoTags)) {
            seoTags.forEach((tag) => allTags.add(tag.toLowerCase()));
          }
        });

        // Filter suggestions based on input and exclude already selected tags
        const filteredTags = Array.from(allTags)
          .filter(
            (tag) =>
              tag.includes(input.toLowerCase()) && !tags.includes(tag)
          )
          .slice(0, 5);

        setSuggestions(filteredTags);
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchExistingTags, 300);
    return () => clearTimeout(debounceTimer);
  }, [input, eventId, tags]);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < maxTags) {
      onTagsChange([...tags, trimmedTag]);
      setInput('');
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        addTag(suggestions[selectedIndex]);
      } else if (input.trim()) {
        addTag(input);
      }
    } else if (e.key === ',') {
      e.preventDefault();
      if (input.trim()) {
        addTag(input);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setShowSuggestions(true);
    setSelectedIndex(-1);
  };

  const handleSuggestionClick = (tag: string) => {
    addTag(tag);
    inputRef.current?.focus();
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isMaxReached = tags.length >= maxTags;

  return (
    <div className="space-y-3">
      {/* Input with autocomplete */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              placeholder={isMaxReached ? `Maximum ${maxTags} tags reached` : placeholder}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              disabled={disabled || isMaxReached}
              className="pr-8"
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => addTag(input)}
            disabled={!input.trim() || isMaxReached || disabled}
          >
            Add
          </Button>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg overflow-hidden"
          >
            <div className="p-1">
              <p className="px-2 py-1 text-xs text-muted-foreground font-medium">
                Suggestions from other events
              </p>
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion}
                  type="button"
                  className={cn(
                    'w-full px-2 py-1.5 text-sm text-left rounded-sm transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    selectedIndex === index && 'bg-accent text-accent-foreground'
                  )}
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Selected tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="pl-2 pr-1 py-1">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
