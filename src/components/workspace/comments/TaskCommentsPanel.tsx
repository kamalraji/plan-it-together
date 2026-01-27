import { useState } from 'react';
import { useTaskComments } from '@/hooks/useTaskComments';
import { useAuth } from '@/hooks/useAuth';
import { MentionInput } from './MentionInput';
import { CommentItem } from './CommentItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Loader2 } from 'lucide-react';

interface TeamMember {
  id: string;
  full_name: string;
  avatar_url?: string;
}

interface TaskCommentsPanelProps {
  taskId: string;
  teamMembers: TeamMember[];
}

export function TaskCommentsPanel({ taskId, teamMembers }: TaskCommentsPanelProps) {
  const { user } = useAuth();
  const [replyToId, setReplyToId] = useState<string | null>(null);

  const {
    comments, isLoading, addComment, isAddingComment,
    updateComment, isUpdatingComment, deleteComment, isDeletingComment, toggleReaction,
  } = useTaskComments({ taskId });

  const handleSubmitComment = (content: string, mentions: string[]) => {
    addComment({ content, mentions, parentId: replyToId || undefined });
    setReplyToId(null);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-48"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 pr-4">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <h4 className="text-sm font-medium text-foreground">No comments yet</h4>
            <p className="text-sm text-muted-foreground mt-1">Be the first to add a comment</p>
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            {comments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={user?.id}
                teamMembers={teamMembers}
                onReply={setReplyToId}
                onUpdate={(id, content) => updateComment({ commentId: id, content })}
                onDelete={deleteComment}
                onToggleReaction={(id, emoji) => toggleReaction({ commentId: id, emoji })}
                isUpdating={isUpdatingComment}
                isDeleting={isDeletingComment}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {replyToId && (
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-t-lg border-b">
          <span className="text-sm text-muted-foreground">Replying to comment</span>
          <button onClick={() => setReplyToId(null)} className="text-xs text-primary hover:underline">Cancel</button>
        </div>
      )}

      <div className="pt-4 border-t mt-auto">
        <MentionInput teamMembers={teamMembers} onSubmit={handleSubmitComment} isSubmitting={isAddingComment} placeholder={replyToId ? 'Write a reply...' : 'Add a comment... Use @ to mention someone'} />
      </div>
    </div>
  );
}
