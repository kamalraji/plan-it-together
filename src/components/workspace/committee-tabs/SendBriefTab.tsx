import { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Send, Users, FileText, Clock, CheckCircle, Plus, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  useWorkspaceAnnouncements, 
  useAnnouncementStats,
  AUDIENCE_OPTIONS,
  getAudienceLabel 
} from '@/hooks/useWorkspaceAnnouncements';
import { format } from 'date-fns';

interface SendBriefTabProps {
  workspace: Workspace;
}

export function SendBriefTab({ workspace }: SendBriefTabProps) {
  const { 
    announcements, 
    isLoading, 
    createAnnouncement, 
    sendAnnouncement,
    deleteAnnouncement 
  } = useWorkspaceAnnouncements(workspace.id);
  const { stats } = useAnnouncementStats(workspace.id);
  
  const [showComposer, setShowComposer] = useState(false);
  const [briefTitle, setBriefTitle] = useState('');
  const [briefContent, setBriefContent] = useState('');
  const [recipients, setRecipients] = useState('all');

  const handleSendBrief = () => {
    if (!briefTitle.trim() || !briefContent.trim()) return;
    
    createAnnouncement.mutate({
      title: briefTitle,
      content: briefContent,
      target_audience: recipients,
      announcement_type: 'brief',
      sendNow: true,
      channels: { in_app: true },
    }, {
      onSuccess: () => {
        setShowComposer(false);
        setBriefTitle('');
        setBriefContent('');
        setRecipients('all');
      },
    });
  };

  const handleSaveDraft = () => {
    if (!briefTitle.trim()) return;
    
    createAnnouncement.mutate({
      title: briefTitle,
      content: briefContent,
      target_audience: recipients,
      announcement_type: 'brief',
      sendNow: false,
    }, {
      onSuccess: () => {
        setShowComposer(false);
        setBriefTitle('');
        setBriefContent('');
        setRecipients('all');
      },
    });
  };

  const handleSendDraft = (id: string) => {
    sendAnnouncement.mutate(id);
  };

  const handleDeleteDraft = (id: string) => {
    deleteAnnouncement.mutate(id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return { className: 'border-emerald-500/30 text-emerald-600', label: 'Sent' };
      case 'scheduled':
        return { className: 'border-warning/30 text-warning', label: 'Scheduled' };
      case 'draft':
      default:
        return { className: 'border-slate-500/30 text-muted-foreground', label: 'Draft' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Send className="h-6 w-6 text-rose-500" />
            Send Brief
          </h2>
          <p className="text-muted-foreground mt-1">
            Communicate with your volunteer team
          </p>
        </div>
        <Button 
          className="bg-rose-500 hover:bg-rose-600 text-white"
          onClick={() => setShowComposer(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Brief
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 border-rose-500/20">
          <CardContent className="p-4">
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold text-rose-600">{stats.total}</div>
            )}
            <div className="text-xs text-muted-foreground">Total Briefs</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="p-4">
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold text-emerald-600">{stats.sent}</div>
            )}
            <div className="text-xs text-muted-foreground">Sent</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4">
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold text-warning">{stats.scheduled}</div>
            )}
            <div className="text-xs text-muted-foreground">Scheduled</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-slate-500/10 to-slate-600/5 border-slate-500/20">
          <CardContent className="p-4">
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold text-muted-foreground">{stats.drafts}</div>
            )}
            <div className="text-xs text-muted-foreground">Drafts</div>
          </CardContent>
        </Card>
      </div>

      {/* Composer */}
      {showComposer && (
        <Card className="border-rose-500/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-rose-500" />
              Compose Brief
            </CardTitle>
            <CardDescription>
              Create a new communication for your volunteers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Brief title..."
                value={briefTitle}
                onChange={(e) => setBriefTitle(e.target.value)}
                aria-required="true"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipients">Recipients</Label>
              <Select value={recipients} onValueChange={setRecipients}>
                <SelectTrigger id="recipients">
                  <SelectValue placeholder="Select recipients" />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Write your brief here..."
                value={briefContent}
                onChange={(e) => setBriefContent(e.target.value)}
                rows={6}
                aria-required="true"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowComposer(false);
                  setBriefTitle('');
                  setBriefContent('');
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="outline"
                onClick={handleSaveDraft}
                disabled={!briefTitle.trim() || createAnnouncement.isPending}
              >
                {createAnnouncement.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Save Draft
              </Button>
              <Button 
                className="bg-rose-500 hover:bg-rose-600"
                onClick={handleSendBrief}
                disabled={!briefTitle.trim() || !briefContent.trim() || createAnnouncement.isPending}
              >
                {createAnnouncement.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Briefs History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Briefs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </>
          ) : announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Send className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No briefs yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Create your first brief to communicate with your team
              </p>
            </div>
          ) : (
            announcements.map(brief => {
              const statusBadge = getStatusBadge(brief.status);
              
              return (
                <div
                  key={brief.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  role="listitem"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      brief.status === 'sent' ? 'bg-emerald-500/10' :
                      brief.status === 'scheduled' ? 'bg-warning/10' :
                      'bg-slate-500/10'
                    }`}>
                      {getStatusIcon(brief.status)}
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{brief.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        {getAudienceLabel(brief.target_audience)}
                      </div>
                      {brief.sent_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Sent {format(new Date(brief.sent_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {brief.status === 'draft' && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteDraft(brief.id)}
                          disabled={deleteAnnouncement.isPending}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendDraft(brief.id)}
                          disabled={sendAnnouncement.isPending}
                          className="h-8"
                        >
                          {sendAnnouncement.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <Send className="h-3 w-3 mr-1" />
                              Send
                            </>
                          )}
                        </Button>
                      </>
                    )}
                    <Badge 
                      variant="outline"
                      className={statusBadge.className}
                    >
                      {statusBadge.label}
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
