import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { format, parseISO } from 'date-fns';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  ArrowRight,
  ChevronDown,
  ChevronUp,
  MessageSquare 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DeadlineExtension } from '@/hooks/useDeadlineExtensions';

interface DeadlineExtensionReviewCardProps {
  extension: DeadlineExtension;
  onApprove: (extensionId: string, reviewNotes?: string) => void;
  onReject: (extensionId: string, reviewNotes?: string) => void;
  isReviewing?: boolean;
}

export function DeadlineExtensionReviewCard({
  extension,
  onApprove,
  onReject,
  isReviewing = false,
}: DeadlineExtensionReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');

  const isPending = extension.status === 'pending';
  const currentDate = extension.current_due_date ? parseISO(extension.current_due_date) : null;
  const requestedDate = parseISO(extension.requested_due_date);

  const getStatusBadge = () => {
    switch (extension.status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Rejected</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">Pending</Badge>;
    }
  };

  return (
    <Card className={cn(
      "transition-all",
      isPending && "border-amber-200 dark:border-amber-800"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              {extension.checklist_title || 'Checklist'}
            </CardTitle>
            {extension.workspace_name && (
              <p className="text-xs text-muted-foreground">
                From: {extension.workspace_name}
              </p>
            )}
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Date comparison */}
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">
              {currentDate ? format(currentDate, 'MMM d, yyyy') : 'No deadline'}
            </span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium">{format(requestedDate, 'MMM d, yyyy')}</span>
          </div>
        </div>

        {/* Justification */}
        <div className="p-2.5 bg-muted/50 rounded-md">
          <div className="flex items-center gap-1.5 mb-1">
            <MessageSquare className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Justification</span>
          </div>
          <p className="text-sm">{extension.justification}</p>
        </div>

        {/* Review section for pending requests */}
        {isPending && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between"
              onClick={() => setExpanded(!expanded)}
            >
              <span className="text-xs">Review & Respond</span>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {expanded && (
              <div className="space-y-3 pt-2 border-t animate-in fade-in slide-in-from-top-2 duration-200">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Review Notes (optional)
                  </label>
                  <Textarea
                    placeholder="Add notes about your decision..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                    onClick={() => onReject(extension.id, reviewNotes)}
                    disabled={isReviewing}
                  >
                    <XCircle className="h-4 w-4 mr-1.5" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => onApprove(extension.id, reviewNotes)}
                    disabled={isReviewing}
                  >
                    <CheckCircle className="h-4 w-4 mr-1.5" />
                    Approve
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Show review notes if reviewed */}
        {!isPending && extension.review_notes && (
          <div className="p-2.5 bg-muted/30 rounded-md border">
            <p className="text-xs text-muted-foreground mb-1">Review Notes</p>
            <p className="text-sm">{extension.review_notes}</p>
          </div>
        )}

        {/* Timestamp */}
        <p className="text-xs text-muted-foreground">
          Requested {format(parseISO(extension.requested_at), 'PPP')}
          {extension.reviewed_at && (
            <> • Reviewed {format(parseISO(extension.reviewed_at), 'PPP')}</>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
