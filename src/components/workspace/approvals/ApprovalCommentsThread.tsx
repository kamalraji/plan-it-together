import { useState } from 'react';
import { useApprovalComments, ApprovalComment } from '@/hooks/useApprovalComments';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Send, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ApprovalCommentsThreadProps {
  requestType: 'budget' | 'resource' | 'access';
  requestId: string;
}

export function ApprovalCommentsThread({ requestType, requestId }: ApprovalCommentsThreadProps) {
  const { user } = useAuth();
  const { comments, isLoading, addComment, isAddingComment, deleteComment } = useApprovalComments(
    requestType,
    requestId
  );
  const [newComment, setNewComment] = useState('');

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    addComment(newComment.trim());
    setNewComment('');
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <MessageSquare className="h-4 w-4" />
        Discussion ({comments.length})
      </div>

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No comments yet. Start the discussion!
        </p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isOwn={comment.userId === user?.id}
              onDelete={() => deleteComment(comment.id)}
              getInitials={getInitials}
            />
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-2 border-t border-border/50">
        <Textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="text-sm min-h-[60px] resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleSubmit();
            }
          }}
        />
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={!newComment.trim() || isAddingComment}
          className="h-10 w-10 shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface CommentItemProps {
  comment: ApprovalComment;
  isOwn: boolean;
  onDelete: () => void;
  getInitials: (name: string | null) => string;
}

function CommentItem({ comment, isOwn, onDelete, getInitials }: CommentItemProps) {
  return (
    <div className="flex gap-3 group">
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarImage src={comment.avatarUrl || undefined} />
        <AvatarFallback className="text-xs bg-primary/10 text-primary">
          {getInitials(comment.userName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{comment.userName || 'Unknown'}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
          {isOwn && (
            <button
              onClick={onDelete}
              className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto p-1 hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap break-words">
          {comment.content}
        </p>
      </div>
    </div>
  );
}
