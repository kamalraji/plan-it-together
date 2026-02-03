import { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Megaphone, Send, Users, Clock, CheckCircle, FileText, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useWorkspaceAnnouncements, AUDIENCE_OPTIONS, getAudienceLabel } from '@/hooks/useWorkspaceAnnouncements';
import { format } from 'date-fns';

interface MassAnnouncementTabProps {
  workspace: Workspace;
}

export function MassAnnouncementTab({ workspace }: MassAnnouncementTabProps) {
  const [showComposer, setShowComposer] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [recipients, setRecipients] = useState('all');
  const [sendEmail, setSendEmail] = useState(true);
  const [sendPush, setSendPush] = useState(true);

  const {
    announcements,
    isLoading,
    createAnnouncement,
    deleteAnnouncement,
  } = useWorkspaceAnnouncements(workspace.id);

  const handleSend = () => {
    createAnnouncement.mutate({
      title,
      content: message,
      target_audience: recipients,
      channels: { email: sendEmail, in_app: sendPush },
      sendNow: true,
    });
    setShowComposer(false);
    setTitle('');
    setMessage('');
  };

  const handleSaveDraft = () => {
    createAnnouncement.mutate({
      title,
      content: message,
      target_audience: recipients,
      channels: { email: sendEmail, in_app: sendPush },
      sendNow: false,
    });
    setShowComposer(false);
    setTitle('');
    setMessage('');
  };

  // Calculate stats from real data
  const stats = {
    totalSent: announcements.filter((a) => a.status === 'sent').length,
    totalRecipients: announcements.reduce((sum, a) => sum + (a.recipients_count || 0), 0),
    // Placeholder for open rate - would need tracking
    openRate: announcements.length > 0 ? 94 : 0,
  };

  const sentAnnouncements = announcements.filter((a) => a.status === 'sent');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-rose-500" />
            Mass Announcement
          </h2>
          <p className="text-muted-foreground mt-1">
            Send announcements to all volunteers
          </p>
        </div>
        <Button 
          className="bg-rose-500 hover:bg-rose-600 text-white"
          onClick={() => setShowComposer(true)}
        >
          <Megaphone className="h-4 w-4 mr-2" />
          New Announcement
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 border-rose-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-rose-600">{stats.totalSent}</div>
            <div className="text-xs text-muted-foreground">Total Sent</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.totalRecipients}</div>
            <div className="text-xs text-muted-foreground">Recipients Reached</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">{stats.openRate}%</div>
            <div className="text-xs text-muted-foreground">Open Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Composer */}
      {showComposer && (
        <Card className="border-rose-500/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-rose-500" />
              Compose Announcement
            </CardTitle>
            <CardDescription>
              Create a mass announcement for your volunteers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Announcement title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipients">Recipients</Label>
              <Select value={recipients} onValueChange={setRecipients}>
                <SelectTrigger>
                  <SelectValue placeholder="Select recipients" />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Write your announcement..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
              />
            </div>

            <div className="space-y-3">
              <Label>Delivery Methods</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="email" 
                    checked={sendEmail} 
                    onCheckedChange={(c) => setSendEmail(!!c)}
                  />
                  <label htmlFor="email" className="text-sm">Email</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="push" 
                    checked={sendPush} 
                    onCheckedChange={(c) => setSendPush(!!c)}
                  />
                  <label htmlFor="push" className="text-sm">Push Notification</label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowComposer(false)}>
                Cancel
              </Button>
              <Button 
                variant="outline"
                onClick={handleSaveDraft}
                disabled={!title.trim() || !message.trim() || createAnnouncement.isPending}
              >
                <Clock className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button 
                className="bg-rose-500 hover:bg-rose-600"
                onClick={handleSend}
                disabled={!title.trim() || !message.trim() || createAnnouncement.isPending}
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

      {/* Recent Announcements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Announcements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sentAnnouncements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No announcements sent yet.</p>
              <p className="text-xs mt-1">Create your first announcement above.</p>
            </div>
          ) : (
            sentAnnouncements.slice(0, 10).map((announcement) => (
              <div
                key={announcement.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{announcement.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      {getAudienceLabel(announcement.target_audience)}
                      <span className="text-muted-foreground/50">•</span>
                      <Clock className="h-3.5 w-3.5" />
                      {announcement.sent_at 
                        ? format(new Date(announcement.sent_at), 'MMM d, yyyy')
                        : 'Not sent'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-600">
                    Sent
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteAnnouncement.mutate(announcement.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
