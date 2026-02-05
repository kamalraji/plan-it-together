import { useState } from 'react';
import { useEventPublishApprovals, type EventPublishApprovalItem } from '@/hooks/useEventPublishApprovals';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { 
  Rocket, 
  Calendar, 
  User, 
  CheckCircle, 
  XCircle, 
  Loader2,
  FileText,
  AlertTriangle,
  Layout,
  Ticket,
  Search,
  Accessibility,
  Tags
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface EventPublishApprovalListProps {
  workspaceId: string;
}

// Settings icon mapping for checklist display
const SETTINGS_ICONS: Record<string, React.ElementType> = {
  'landing-page': Layout,
  'ticketing': Ticket,
  'seo': Search,
  'accessibility': Accessibility,
  'promo-codes': Tags,
};

export function EventPublishApprovalList({ workspaceId }: EventPublishApprovalListProps) {
  const { 
    pendingRequests, 
    isLoading, 
    approveRequest, 
    rejectRequest,
    isApproving,
    isRejecting 
  } = useEventPublishApprovals(workspaceId);

  const [selectedRequest, setSelectedRequest] = useState<EventPublishApprovalItem | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');

  const handleAction = async () => {
    if (!selectedRequest || !actionType) return;

    try {
      if (actionType === 'approve') {
        await approveRequest({ 
          requestId: selectedRequest.id, 
          eventId: selectedRequest.eventId,
          notes: notes || undefined 
        });
      } else {
        await rejectRequest({ 
          requestId: selectedRequest.id, 
          notes 
        });
      }
      setSelectedRequest(null);
      setActionType(null);
      setNotes('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getPriorityStyle = (priority: string) => {
    const styles: Record<string, string> = {
      low: 'bg-muted text-muted-foreground',
      medium: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
      high: 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
      urgent: 'bg-red-500/20 text-red-600 dark:text-red-400',
    };
    return styles[priority] || styles.medium;
  };

  const getChecklistStats = (snapshot: any) => {
    if (!snapshot?.items) return { pass: 0, warning: 0, fail: 0, total: 0, percentage: 0 };
    const items = snapshot.items as any[];
    const pass = items.filter(i => i.status === 'pass').length;
    const warning = items.filter(i => i.status === 'warning').length;
    const fail = items.filter(i => i.status === 'fail').length;
    const total = items.length;
    const percentage = total > 0 ? Math.round((pass / total) * 100) : 0;
    return { pass, warning, fail, total, percentage };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (pendingRequests.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Rocket className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No pending event publish requests</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {pendingRequests.map((request) => {
          const stats = getChecklistStats(request.checklistSnapshot);
          return (
            <Card key={request.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Rocket className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-medium">
                      {request.eventName}
                    </CardTitle>
                  </div>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full font-medium capitalize',
                    getPriorityStyle(request.priority)
                  )}>
                    {request.priority}
                  </span>
                </div>
                <CardDescription className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {request.requesterName || 'Unknown'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(request.requestedAt), 'MMM d, yyyy')}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 space-y-3">
                {/* Completion Progress */}
                {request.checklistSnapshot && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Checklist Completion</span>
                      <span className="font-medium">{stats.percentage}%</span>
                    </div>
                    <Progress value={stats.percentage} className="h-1.5" />
                    <div className="flex gap-3 text-xs">
                      <span className="text-success">{stats.pass} pass</span>
                      {stats.warning > 0 && <span className="text-warning">{stats.warning} warning</span>}
                      {stats.fail > 0 && <span className="text-destructive">{stats.fail} fail</span>}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    className="gap-1"
                    onClick={() => {
                      setSelectedRequest(request);
                      setActionType('approve');
                    }}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={() => {
                      setSelectedRequest(request);
                      setActionType('reject');
                    }}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                  {request.checklistSnapshot && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 ml-auto"
                      onClick={() => {
                        setSelectedRequest(request);
                        setActionType(null);
                      }}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      View Details
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action Dialog */}
      <Dialog 
        open={!!selectedRequest && !!actionType} 
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRequest(null);
            setActionType(null);
            setNotes('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === 'approve' ? (
                <>
                  <CheckCircle className="h-5 w-5 text-success" />
                  Approve Publish Request
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  Reject Publish Request
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' 
                ? `Approve and publish "${selectedRequest?.eventName}"?`
                : `Reject publish request for "${selectedRequest?.eventName}"?`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {actionType === 'reject' && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Please provide feedback to help the requester understand why this was rejected.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {actionType === 'approve' ? 'Notes (Optional)' : 'Rejection Reason'}
              </label>
              <Textarea
                placeholder={actionType === 'approve' 
                  ? 'Add any notes for the requester...'
                  : 'Explain why this request was rejected...'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedRequest(null);
                setActionType(null);
                setNotes('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === 'approve' ? 'default' : 'destructive'}
              onClick={handleAction}
              disabled={isApproving || isRejecting || (actionType === 'reject' && !notes.trim())}
            >
              {(isApproving || isRejecting) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {actionType === 'approve' ? 'Approve & Publish' : 'Reject Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detailed Checklist View Dialog */}
      <Dialog 
        open={!!selectedRequest && !actionType} 
        onOpenChange={(open) => {
          if (!open) setSelectedRequest(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Publish Request Details</DialogTitle>
            <DialogDescription>
              Review checklist for "{selectedRequest?.eventName}"
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {selectedRequest?.checklistSnapshot?.items ? (
              <>
                {/* Summary Stats */}
                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  {(() => {
                    const stats = getChecklistStats(selectedRequest.checklistSnapshot);
                    return (
                      <>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Completion</p>
                          <Progress value={stats.percentage} className="h-2 mt-1" />
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{stats.percentage}%</p>
                          <p className="text-xs text-muted-foreground">{stats.pass}/{stats.total} items</p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Grouped Items */}
                <div className="space-y-3">
                  {/* Basic Items */}
                  {(() => {
                    const items = selectedRequest.checklistSnapshot.items as any[];
                    const basicItems = items.filter(i => i.category === 'basic' || !i.category);
                    const eventSpaceItems = items.filter(i => i.category === 'event-space');

                    return (
                      <>
                        {basicItems.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">Basic Information</p>
                            <div className="space-y-1">
                              {basicItems.map((item: any, index: number) => (
                                <div 
                                  key={index}
                                  className={cn(
                                    'flex items-center gap-2 p-2 rounded-lg text-sm',
                                    item.status === 'pass' && 'bg-success/10',
                                    item.status === 'warning' && 'bg-warning/10',
                                    item.status === 'fail' && 'bg-destructive/10',
                                  )}
                                >
                                  {item.status === 'pass' && <CheckCircle className="h-4 w-4 text-success" />}
                                  {item.status === 'warning' && <AlertTriangle className="h-4 w-4 text-warning" />}
                                  {item.status === 'fail' && <XCircle className="h-4 w-4 text-destructive" />}
                                  <span className="flex-1">{item.label}</span>
                                  {item.required && (
                                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                      Required
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {eventSpaceItems.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">Event Space Settings</p>
                            <div className="space-y-1">
                              {eventSpaceItems.map((item: any, index: number) => {
                                const Icon = SETTINGS_ICONS[item.settingsTab || item.id] || FileText;
                                return (
                                  <div 
                                    key={index}
                                    className={cn(
                                      'flex items-center gap-2 p-2 rounded-lg text-sm',
                                      item.status === 'pass' && 'bg-success/10',
                                      item.status === 'warning' && 'bg-warning/10',
                                      item.status === 'fail' && 'bg-destructive/10',
                                    )}
                                  >
                                    <Icon className={cn(
                                      'h-4 w-4',
                                      item.status === 'pass' && 'text-success',
                                      item.status === 'warning' && 'text-warning',
                                      item.status === 'fail' && 'text-destructive',
                                    )} />
                                    <div className="flex-1">
                                      <span>{item.label}</span>
                                      <p className="text-xs text-muted-foreground">{item.description}</p>
                                    </div>
                                    {item.required && (
                                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                        Required
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No checklist data available</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              Close
            </Button>
            <Button 
              onClick={() => setActionType('approve')}
              disabled={!!(selectedRequest?.checklistSnapshot && getChecklistStats(selectedRequest.checklistSnapshot).fail > 0)}
            >
              <CheckCircle className="h-4 w-4 mr-1.5" />
              Approve & Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
