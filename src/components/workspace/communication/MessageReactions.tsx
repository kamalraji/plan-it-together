/**
 * Message Reactions Component
 * Displays emoji reactions and allows adding/removing reactions
 * 
 * Uses Supabase message_reactions table for persistence.
 */
import { useState } from 'react';
import { useMessageReactions, AggregatedReaction } from '@/hooks/useMessageReactions';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SmilePlus, Loader2 } from 'lucide-react';

interface MessageReactionsProps {
  messageId: string;
  compact?: boolean;
}

// Common emoji reactions
const QUICK_EMOJIS = ['👍', '❤️', '🎉', '😂', '😮', '😢', '🔥', '👏', '🙌', '✅', '👀', '💯'];

export function MessageReactions({ messageId, compact = false }: MessageReactionsProps) {
  const { user } = useAuth();
  const [pickerOpen, setPickerOpen] = useState(false);
  const { aggregatedReactions, toggleReaction, isToggling, isLoading } = useMessageReactions(messageId);

  const handleReactionClick = async (emoji: string) => {
    if (!user) return;
    await toggleReaction(emoji);
    setPickerOpen(false);
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Existing reactions */}
      {aggregatedReactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => handleReactionClick(reaction.emoji)}
          disabled={isToggling}
          title={getReactionTooltip(reaction)}
          className={cn(
            'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-colors disabled:opacity-50',
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
                disabled={isToggling}
                className="p-1.5 hover:bg-muted rounded transition-colors text-lg disabled:opacity-50"
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
