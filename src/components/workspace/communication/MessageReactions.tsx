/**
 * Message Reactions Component
 * Displays emoji reactions and allows adding/removing reactions
 * 
 * Uses localStorage for reactions until a dedicated message_reactions table is created.
 * This provides a functional UI that can be migrated to database storage later.
 */
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SmilePlus } from 'lucide-react';

interface MessageReactionsProps {
  messageId: string;
  compact?: boolean;
}

interface StoredReaction {
  emoji: string;
  users: { id: string; name: string }[];
}

interface AggregatedReaction {
  emoji: string;
  count: number;
  users: { id: string; name: string }[];
  userReacted: boolean;
}

// Common emoji reactions
const QUICK_EMOJIS = ['👍', '❤️', '🎉', '😂', '😮', '😢', '🔥', '👏', '🙌', '✅', '👀', '💯'];

// Storage key for reactions
const REACTIONS_STORAGE_KEY = 'message_reactions';

// Helper to get/set reactions from localStorage
const getStoredReactions = (messageId: string): StoredReaction[] => {
  try {
    const stored = localStorage.getItem(REACTIONS_STORAGE_KEY);
    if (!stored) return [];
    const allReactions = JSON.parse(stored) as Record<string, StoredReaction[]>;
    return allReactions[messageId] || [];
  } catch {
    return [];
  }
};

const setStoredReactions = (messageId: string, reactions: StoredReaction[]) => {
  try {
    const stored = localStorage.getItem(REACTIONS_STORAGE_KEY);
    const allReactions = stored ? JSON.parse(stored) : {};
    allReactions[messageId] = reactions;
    localStorage.setItem(REACTIONS_STORAGE_KEY, JSON.stringify(allReactions));
  } catch {
    // Silently fail if localStorage is not available
  }
};

export function MessageReactions({ messageId, compact = false }: MessageReactionsProps) {
  const { user } = useAuth();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [reactions, setReactions] = useState<StoredReaction[]>([]);

  // Load reactions on mount
  useEffect(() => {
    setReactions(getStoredReactions(messageId));
  }, [messageId]);

  // Aggregate reactions for display
  const aggregatedReactions: AggregatedReaction[] = reactions.map((reaction) => ({
    emoji: reaction.emoji,
    count: reaction.users.length,
    users: reaction.users,
    userReacted: reaction.users.some((u) => u.id === user?.id),
  }));

  // Toggle reaction
  const handleReactionClick = useCallback(
    (emoji: string) => {
      if (!user) return;

      const userName = user.name || user.email?.split('@')[0] || 'User';
      const currentReactions = [...reactions];
      
      // Find if this emoji already exists
      const existingReactionIndex = currentReactions.findIndex((r) => r.emoji === emoji);

      if (existingReactionIndex >= 0) {
        const existingReaction = currentReactions[existingReactionIndex];
        const userIndex = existingReaction.users.findIndex((u) => u.id === user.id);

        if (userIndex >= 0) {
          // Remove user from reaction
          existingReaction.users.splice(userIndex, 1);
          if (existingReaction.users.length === 0) {
            // Remove the entire reaction if no users left
            currentReactions.splice(existingReactionIndex, 1);
          }
        } else {
          // Add user to reaction
          existingReaction.users.push({ id: user.id, name: userName });
        }
      } else {
        // Create new reaction with this emoji
        currentReactions.push({ emoji, users: [{ id: user.id, name: userName }] });
      }

      setReactions(currentReactions);
      setStoredReactions(messageId, currentReactions);
      setPickerOpen(false);
    },
    [reactions, user, messageId]
  );

  // Get tooltip text for reaction
  const getReactionTooltip = (reaction: AggregatedReaction) => {
    if (reaction.users.length === 1) {
      return reaction.users[0].name || 'Someone';
    } else if (reaction.users.length <= 3) {
      return reaction.users.map((u) => u.name || 'Someone').join(', ');
    } else {
      return `${reaction.users
        .slice(0, 2)
        .map((u) => u.name || 'Someone')
        .join(', ')} and ${reaction.users.length - 2} others`;
    }
  };

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Existing reactions */}
      {aggregatedReactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => handleReactionClick(reaction.emoji)}
          title={getReactionTooltip(reaction)}
          className={cn(
            'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-colors',
            reaction.userReacted
              ? 'bg-primary/20 border border-primary/40 hover:bg-primary/30'
              : 'bg-muted border border-border hover:bg-muted/80',
            compact && 'px-1 py-0'
          )}
        >
          <span className={compact ? 'text-xs' : 'text-sm'}>{reaction.emoji}</span>
          <span className="text-muted-foreground font-medium">{reaction.count}</span>
        </button>
      ))}

      {/* Add reaction button */}
      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity',
              aggregatedReactions.length > 0 && 'opacity-100'
            )}
          >
            <SmilePlus className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" side="top" align="start">
          <div className="grid grid-cols-6 gap-1">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReactionClick(emoji)}
                className="p-1.5 hover:bg-muted rounded transition-colors text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Standalone emoji picker for use in message actions
export function EmojiPicker({
  onSelect,
  disabled = false,
}: {
  onSelect: (emoji: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={disabled}>
          <SmilePlus className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" side="top">
        <div className="grid grid-cols-6 gap-1">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onSelect(emoji);
                setOpen(false);
              }}
              className="p-1.5 hover:bg-muted rounded transition-colors text-lg"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
