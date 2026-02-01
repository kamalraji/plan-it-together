import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamMember {
  id: string;
  full_name: string;
  avatar_url?: string;
}

interface MentionInputProps {
  teamMembers: TeamMember[];
  onSubmit: (content: string, mentions: string[]) => void;
  placeholder?: string;
  isSubmitting?: boolean;
  autoFocus?: boolean;
}

export function MentionInput({
  teamMembers,
  onSubmit,
  placeholder = 'Add a comment... Use @ to mention someone',
  isSubmitting = false,
  autoFocus = false,
}: MentionInputProps) {
  const [content, setContent] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentions, setMentions] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filteredMembers = teamMembers.filter(m =>
    m.full_name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const handleChange = (value: string) => {
    setContent(value);

    // Check for @ trigger
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);

    if (atMatch) {
      setShowMentions(true);
      setMentionSearch(atMatch[1]);
      setMentionIndex(0);
    } else {
      setShowMentions(false);
      setMentionSearch('');
    }
  };

  const insertMention = (member: TeamMember) => {
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = content.slice(0, cursorPos);
    const textAfterCursor = content.slice(cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    const newContent =
      textBeforeCursor.slice(0, atIndex) +
      `@${member.full_name} ` +
      textAfterCursor;

    setContent(newContent);
    setShowMentions(false);
    setMentionSearch('');

    if (!mentions.includes(member.id)) {
      setMentions([...mentions, member.id]);
    }

    // Focus back on textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(i => Math.min(i + 1, filteredMembers.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredMembers[mentionIndex]);
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!content.trim() || isSubmitting) return;
    onSubmit(content, mentions);
    setContent('');
    setMentions([]);
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [content]);

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={e => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-h-[80px] resize-none pr-2"
            autoFocus={autoFocus}
          />

          {/* Mention dropdown */}
          {showMentions && filteredMembers.length > 0 && (
            <div className="absolute bottom-full left-0 mb-1 w-64 bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
              {filteredMembers.map((member, index) => (
                <button
                  key={member.id}
                  onClick={() => insertMention(member)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors',
                    index === mentionIndex && 'bg-accent'
                  )}
                >
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                    {member.full_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate">{member.full_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          size="icon"
          className="shrink-0 self-end"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {mentions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {mentions.map(id => {
            const member = teamMembers.find(m => m.id === id);
            return member ? (
              <span
                key={id}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full"
              >
                @{member.full_name}
                <button
                  onClick={() => setMentions(mentions.filter(m => m !== id))}
                  className="hover:text-destructive"
                >
                  ×
                </button>
              </span>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}
