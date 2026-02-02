/**
 * Message Actions Component
 * Hover toolbar with quick actions for messages
 */
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { MessageSquare, SmilePlus, MoreHorizontal, Pencil, Trash2, Pin, Copy } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface MessageActionsProps {
  messageId: string;
  isOwnMessage: boolean;
  onReply: () => void;
  onReact: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPin?: () => void;
  onCopy: () => void;
  className?: string;
}

// Quick reaction emojis for the toolbar
const QUICK_REACTIONS = ['👍', '❤️', '🎉', '😂'];

export function MessageActions({
  messageId,
  isOwnMessage,
  onReply,
  onReact,
  onEdit,
  onDelete,
  onPin,
  onCopy,
  className,
}: MessageActionsProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          'absolute -top-3 right-2 flex items-center gap-0.5 p-0.5 rounded-md bg-card border border-border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity',
          className
        )}
      >
        {/* Quick Reactions */}
        {QUICK_REACTIONS.map((emoji) => (
          <Tooltip key={emoji}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-muted"
                onClick={() => {
                  // This will be handled by the parent component
                  const event = new CustomEvent('quick-react', {
                    detail: { messageId, emoji },
                  });
                  window.dispatchEvent(event);
                }}
              >
                <span className="text-sm">{emoji}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              React with {emoji}
            </TooltipContent>
          </Tooltip>
        ))}

        {/* More reactions */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-muted" onClick={onReact}>
              <SmilePlus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Add reaction
          </TooltipContent>
        </Tooltip>

        {/* Reply in thread */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-muted" onClick={onReply}>
              <MessageSquare className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Reply in thread
          </TooltipContent>
        </Tooltip>

        {/* More actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-muted">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={onCopy}>
              <Copy className="h-4 w-4 mr-2" />
              Copy text
            </DropdownMenuItem>
            
            {onPin && (
              <DropdownMenuItem onClick={onPin}>
                <Pin className="h-4 w-4 mr-2" />
                Pin message
              </DropdownMenuItem>
            )}

            {isOwnMessage && (
              <>
                <DropdownMenuSeparator />
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit message
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete message
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
}
