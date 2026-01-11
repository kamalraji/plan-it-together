import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Clock, Send, FileText, Users, ArrowRight, Loader2, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useContentApprovals, useReviewApproval, usePendingApprovalsCount, ContentApproval } from '@/hooks/useContentApprovalWorkflow';

interface ContentApprovalWorkflowTabProps {
  workspaceId: string;
}

const STAGE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  submitted: { label: 'Submitted', color: 'bg-blue-500', icon: Send },
  content_review: { label: 'Content Review', color: 'bg-amber-500', icon: Users },
  design_review: { label: 'Design Review', color: 'bg-purple-500', icon: FileText },
  final_approval: { label: 'Final Approval', color: 'bg-cyan-500', icon: CheckCircle },
  approved: { label: 'Approved', color: 'bg-green-500', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-500', icon: XCircle },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-slate-500' },
  medium: { label: 'Medium', color: 'bg-blue-500' },
  high: { label: 'High', color: 'bg-amber-500' },
  urgent: { label: 'Urgent', color: 'bg-red-500' },
};

export function ContentApprovalWorkflowTab({ workspaceId }: ContentApprovalWorkflowTabProps) {
  const [selectedApproval, setSelectedApproval] = useState<ContentApproval | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);

  const { data: approvals, isLoading } = useContentApprovals(workspaceId);
  const { data: pendingCount } = usePendingApprovalsCount(workspaceId);
  const { mutateAsync: reviewApproval, isPending: isReviewing } = useReviewApproval(workspaceId);

  const filteredApprovals = approvals?.filter((a: ContentApproval) => filterStage === 'all' || a.current_stage === filterStage) || [];

  const handleReview = async (action: 'approve' | 'reject') => {
    if (!selectedApproval) return;
    await reviewApproval({ approval_id: selectedApproval.id, action, review_notes: reviewNotes });
    setReviewDialogOpen(false);
    setReviewNotes('');
    setSelectedApproval(null);
  };

  const openReviewDialog = (approval: ContentApproval, action: 'approve' | 'reject') => {
    setSelectedApproval(approval);
    setReviewAction(action);
    setReviewDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Pending Review</p><p className="text-2xl font-bold text-blue-600">{pendingCount || 0}</p></div>
              <Clock className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">In Review</p><p className="text-2xl font-bold text-amber-600">{approvals?.filter((a: ContentApproval) => a.current_stage === 'content_review').length || 0}</p></div>
              <Users className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Approved</p><p className="text-2xl font-bold text-green-600">{approvals?.filter((a: ContentApproval) => a.current_stage === 'approved').length || 0}</p></div>
              <CheckCircle className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Rejected</p><p className="text-2xl font-bold text-red-600">{approvals?.filter((a: ContentApproval) => a.current_stage === 'rejected').length || 0}</p></div>
              <XCircle className="h-8 w-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ArrowRight className="h-5 w-5 text-primary" />Approval Pipeline</CardTitle><CardDescription>Multi-stage review workflow across committees</CardDescription></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-4">
            {Object.entries(STAGE_CONFIG).slice(0, 5).map(([key, config], index) => {
              const Icon = config.icon;
              const count = approvals?.filter((a: ContentApproval) => a.current_stage === key).length || 0;
              return (
                <React.Fragment key={key}>
                  <div className="flex flex-col items-center gap-2">
                    <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', config.color, 'text-white')}><Icon className="h-6 w-6" /></div>
                    <span className="text-xs font-medium text-center max-w-[80px]">{config.label}</span>
                    <Badge variant="secondary" className="text-xs">{count}</Badge>
                  </div>
                  {index < 4 && <div className="flex-1 h-1 bg-muted mx-2 rounded" />}
                </React.Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Content Approvals</CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterStage} onValueChange={setFilterStage}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by stage" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {Object.entries(STAGE_CONFIG).map(([key, config]) => (<SelectItem key={key} value={key}>{config.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (<div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : filteredApprovals.length === 0 ? (<div className="text-center py-12"><FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" /><p className="text-muted-foreground">No approvals found</p></div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {filteredApprovals.map((approval: ContentApproval) => {
                  const stageConfig = STAGE_CONFIG[approval.current_stage] || STAGE_CONFIG.submitted;
                  const priorityConfig = PRIORITY_CONFIG[approval.priority] || PRIORITY_CONFIG.medium;
                  const StageIcon = stageConfig.icon;
                  return (
                    <div key={approval.id} className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium truncate">{approval.title}</h4>
                            <Badge variant="outline" className={cn('text-xs', priorityConfig.color, 'text-white border-0')}>{priorityConfig.label}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{approval.description || 'No description'}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Type: {approval.content_type}</span>
                            <span>Source: {approval.source_committee || 'Unknown'}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={cn('text-xs', stageConfig.color, 'text-white border-0')}><StageIcon className="h-3 w-3 mr-1" />{stageConfig.label}</Badge>
                          {approval.current_stage !== 'approved' && approval.current_stage !== 'rejected' && (
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="outline" className="h-7 text-xs text-green-600" onClick={() => openReviewDialog(approval, 'approve')}><CheckCircle className="h-3 w-3 mr-1" />Approve</Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs text-red-600" onClick={() => openReviewDialog(approval, 'reject')}><XCircle className="h-3 w-3 mr-1" />Reject</Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2">{reviewAction === 'approve' ? <><CheckCircle className="h-5 w-5 text-green-500" />Approve Content</> : <><XCircle className="h-5 w-5 text-red-500" />Reject Content</>}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {selectedApproval && (<div className="p-3 rounded-lg bg-muted"><p className="font-medium">{selectedApproval.title}</p><p className="text-sm text-muted-foreground">{selectedApproval.description}</p></div>)}
            <div><label className="text-sm font-medium mb-2 block">Review Notes</label><Textarea placeholder="Add your review notes..." value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} rows={4} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => reviewAction && handleReview(reviewAction)} disabled={isReviewing} className={reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}>{isReviewing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
