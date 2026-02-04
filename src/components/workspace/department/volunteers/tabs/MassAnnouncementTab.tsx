import { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Megaphone, Send, Users, Clock, CheckCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface MassAnnouncementTabProps {
  workspace: Workspace;
}

interface Announcement {
  id: string;
  title: string;
  recipients: string;
  sentAt: string;
  status: 'sent' | 'scheduled' | 'draft';
}

const mockAnnouncements: Announcement[] = [
  { id: '1', title: 'Event Day Briefing', recipients: 'All Volunteers', sentAt: '2024-01-08T09:00:00', status: 'sent' },
  { id: '2', title: 'Schedule Update Notice', recipients: 'Morning Shift', sentAt: '2024-01-07T14:00:00', status: 'sent' },
  { id: '3', title: 'Training Reminder', recipients: 'New Volunteers', sentAt: '2024-01-06T10:00:00', status: 'sent' },
];

export function MassAnnouncementTab({ workspace: _workspace }: MassAnnouncementTabProps) {
  const [showComposer, setShowComposer] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [recipients, setRecipients] = useState('all');
  const [sendEmail, setSendEmail] = useState(true);
  const [sendPush, setSendPush] = useState(true);

  const handleSend = () => {
    toast.success('Announcement sent to all recipients');
    setShowComposer(false);
    setTitle('');
    setMessage('');
  };

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
            <div className="text-2xl font-bold text-rose-600">{mockAnnouncements.length}</div>
            <div className="text-xs text-muted-foreground">Total Sent</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">156</div>
            <div className="text-xs text-muted-foreground">Recipients Reached</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">94%</div>
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
                  <SelectItem value="all">All Volunteers</SelectItem>
                  <SelectItem value="active">Active Volunteers Only</SelectItem>
                  <SelectItem value="leads">Team Leads Only</SelectItem>
                  <SelectItem value="morning">Morning Shift</SelectItem>
                  <SelectItem value="afternoon">Afternoon Shift</SelectItem>
                  <SelectItem value="evening">Evening Shift</SelectItem>
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
              <Button variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                Schedule
              </Button>
              <Button 
                className="bg-rose-500 hover:bg-rose-600"
                onClick={handleSend}
                disabled={!title.trim() || !message.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
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
          {mockAnnouncements.map(announcement => (
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
                    {announcement.recipients}
                    <span className="text-muted-foreground/50">•</span>
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(announcement.sentAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-600">
                Sent
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
