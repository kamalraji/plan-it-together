import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Clock, CheckCircle, XCircle, RefreshCw, Loader2, Calendar, Zap, Pause, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSocialPostQueue, usePublishToSocial, useSyncSocialAnalytics } from '@/hooks/useContentApprovalWorkflow';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface SocialPostQueueTabProps { workspaceId: string; }

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-amber-500', icon: Clock },
  scheduled: { label: 'Scheduled', color: 'bg-blue-500', icon: Calendar },
  processing: { label: 'Processing', color: 'bg-purple-500', icon: Loader2 },
  posted: { label: 'Posted', color: 'bg-green-500', icon: CheckCircle },
  failed: { label: 'Failed', color: 'bg-red-500', icon: XCircle },
  paused: { label: 'Paused', color: 'bg-slate-500', icon: Pause },
};

const PLATFORM_COLORS: Record<string, string> = { twitter: 'text-sky-500 bg-sky-500/10', linkedin: 'text-blue-600 bg-blue-600/10', instagram: 'text-pink-500 bg-pink-500/10' };

export function SocialPostQueueTab({ workspaceId }: SocialPostQueueTabProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');

  const { data: postQueue, isLoading } = useSocialPostQueue(workspaceId);
  const { mutateAsync: publishPost, isPending: isPublishing } = usePublishToSocial(workspaceId);
  const { mutateAsync: syncAnalytics, isPending: isSyncing } = useSyncSocialAnalytics(workspaceId);

  const filteredQueue = (postQueue || []).filter((p) => (filterStatus === 'all' || p.status === filterStatus) && (filterPlatform === 'all' || p.platform === filterPlatform));

  const handlePublishNow = async (queueItemId: string) => { try { await publishPost(queueItemId); toast.success('Post sent for publishing'); } catch { toast.error('Failed to publish'); } };
  const handleSyncAnalytics = async () => { try { await syncAnalytics('sync_post_metrics'); toast.success('Analytics sync started'); } catch { toast.error('Failed to sync'); } };

  const queueStats = { pending: (postQueue || []).filter((p) => p.status === 'pending').length, scheduled: (postQueue || []).filter((p) => p.status === 'scheduled').length, posted: (postQueue || []).filter((p) => p.status === 'posted').length, failed: (postQueue || []).filter((p) => p.status === 'failed').length };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Pending</p><p className="text-2xl font-bold text-amber-600">{queueStats.pending}</p></div><Clock className="h-8 w-8 text-amber-500/50" /></div></CardContent></Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Scheduled</p><p className="text-2xl font-bold text-blue-600">{queueStats.scheduled}</p></div><Calendar className="h-8 w-8 text-blue-500/50" /></div></CardContent></Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Posted</p><p className="text-2xl font-bold text-green-600">{queueStats.posted}</p></div><CheckCircle className="h-8 w-8 text-green-500/50" /></div></CardContent></Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Failed</p><p className="text-2xl font-bold text-red-600">{queueStats.failed}</p></div><XCircle className="h-8 w-8 text-red-500/50" /></div></CardContent></Card>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem>{Object.entries(STATUS_CONFIG).map(([key, config]) => (<SelectItem key={key} value={key}>{config.label}</SelectItem>))}</SelectContent></Select>
          <Select value={filterPlatform} onValueChange={setFilterPlatform}><SelectTrigger className="w-[150px]"><SelectValue placeholder="Platform" /></SelectTrigger><SelectContent><SelectItem value="all">All Platforms</SelectItem><SelectItem value="twitter">Twitter / X</SelectItem><SelectItem value="linkedin">LinkedIn</SelectItem><SelectItem value="instagram">Instagram</SelectItem></SelectContent></Select>
        </div>
        <Button variant="outline" onClick={handleSyncAnalytics} disabled={isSyncing}>{isSyncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}Sync Analytics</Button>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary" />Post Queue</CardTitle><CardDescription>Manage scheduled and pending social media posts</CardDescription></CardHeader>
        <CardContent>
          {isLoading ? <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          : filteredQueue.length === 0 ? <div className="text-center py-12"><Send className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" /><p className="text-muted-foreground">No posts in queue</p></div>
          : <ScrollArea className="h-[400px]"><div className="space-y-3">{filteredQueue.map((post) => {
              const statusConfig = STATUS_CONFIG[post.status || 'pending'] || STATUS_CONFIG.pending;
              const StatusIcon = statusConfig.icon;
              return (
                <div key={post.id} className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={cn('p-2 rounded-lg', PLATFORM_COLORS[post.platform] || 'bg-muted')}><span className="capitalize font-medium text-sm">{post.platform}</span></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1"><Badge variant="outline" className={cn('text-xs', statusConfig.color, 'text-white border-0')}><StatusIcon className={cn('h-3 w-3 mr-1', post.status === 'processing' && 'animate-spin')} />{statusConfig.label}</Badge></div>
                        <div className="text-xs text-muted-foreground">{post.scheduled_for && <p>Scheduled: {format(new Date(post.scheduled_for), 'PPp')}</p>}{post.posted_at && <p>Posted: {format(new Date(post.posted_at), 'PPp')}</p>}{post.error_message && <p className="text-red-500">{post.error_message}</p>}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {post.status === 'pending' && <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handlePublishNow(post.id)} disabled={isPublishing}><Send className="h-3 w-3 mr-1" />Post Now</Button>}
                      {post.status === 'failed' && <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handlePublishNow(post.id)}><RefreshCw className="h-3 w-3 mr-1" />Retry</Button>}
                      {(post.status === 'pending' || post.status === 'scheduled') && <Button size="sm" variant="ghost" className="h-8 text-red-500 hover:text-red-600" aria-label="Delete post"><Trash2 className="h-4 w-4" /></Button>}
                    </div>
                  </div>
                </div>
              );
            })}</div></ScrollArea>}
        </CardContent>
      </Card>
    </div>
  );
}
