import { useState } from 'react';
import { TaskComment, REACTION_EMOJIS } from '@/lib/commentTypes';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { MoreHorizontal, Reply, Edit, Trash2, SmilePlus, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface CommentItemProps {
  comment: TaskComment;
  currentUserId?: string;
  teamMembers: { id: string; full_name: string }[];
  onReply: (parentId: string) => void;
  onUpdate: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  onToggleReaction: (commentId: string, emoji: string) => void;
  isUpdating?: boolean;
  isDeleting?: boolean;
  depth?: number;
}

export function CommentItem({
  comment,
  currentUserId,
  teamMembers,
  onReply,
  onUpdate,
  onDelete,
  onToggleReaction,
  isUpdating = false,
  isDeleting = false,
  depth = 0,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const isOwner = currentUserId === comment.user_id;
  const maxDepth = 3;

  // Parse @mentions in content and highlight them
  const renderContent = (content: string) => {
    const parts = content.split(/(@\w+(?:\s\w+)?)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span
            key={index}
            className="inline-flex items-center px-1.5 py-0.5 bg-primary/10 text-primary rounded text-sm font-medium"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== comment.content) {
      onUpdate(comment.id, editContent);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  // Check if current user has reacted with specific emoji
  const hasUserReacted = (emoji: string) => {
    return comment.reactions?.some(
      r => r.emoji === emoji && r.user_id === currentUserId
    );
  };

  return (
    <div className={cn('group', depth > 0 && 'ml-6 pl-4 border-l-2 border-border')}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="shrink-0">
          {comment.user?.avatar_url ? (
            <img
              src={comment.user.avatar_url}
              alt={comment.user.full_name}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
              {comment.user?.full_name?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">
              {comment.user?.full_name || 'Unknown User'}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
            {comment.is_edited && (
              <span className="text-xs text-muted-foreground italic">(edited)</span>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className="min-h-[60px]"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit} disabled={isUpdating}>
                  {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap break-words">
              {renderContent(comment.content)}
            </p>
          )}

          {/* Reactions */}
          {!isEditing && (
            <div className="flex flex-wrap items-center gap-1 mt-2">
              {Object.entries(comment.reactionCounts || {}).map(([emoji, count]) => (
                <button
                  key={emoji}
                  onClick={() => onToggleReaction(comment.id, emoji)}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors',
                    hasUserReacted(emoji)
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted hover:bg-muted/80'
                  )}
                >
                  <span>{emoji}</span>
                  <span>{count}</span>
                </button>
              ))}

              {/* Add reaction button */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <SmilePlus className="h-3.5 w-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="start">
                  <div className="flex gap-1">
                    {REACTION_EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => onToggleReaction(comment.id, emoji)}
                        className={cn(
                          'p-1.5 rounded hover:bg-accent text-lg transition-colors',
                          hasUserReacted(emoji) && 'bg-primary/10'
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Actions */}
              {depth < maxDepth && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onReply(comment.id)}
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </Button>
              )}

              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(comment.id)}
                      className="text-destructive"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              teamMembers={teamMembers}
              onReply={onReply}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onToggleReaction={onToggleReaction}
              isUpdating={isUpdating}
              isDeleting={isDeleting}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
