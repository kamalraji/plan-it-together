import { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Send, Users, FileText, Clock, CheckCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SendBriefTabProps {
  workspace: Workspace;
}

interface Brief {
  id: string;
  title: string;
  recipients: string;
  status: 'draft' | 'sent' | 'scheduled';
  sentAt?: string;
  scheduledFor?: string;
}

// Mock data - replace with actual data fetching
const mockBriefs: Brief[] = [
  { id: '1', title: 'Pre-Event Briefing', recipients: 'All Volunteers', status: 'sent', sentAt: '2024-01-08T10:00:00' },
  { id: '2', title: 'Safety Guidelines Update', recipients: 'Team Leads', status: 'scheduled', scheduledFor: '2024-01-15T09:00:00' },
  { id: '3', title: 'Shift Reminder - Day 1', recipients: 'Morning Shift', status: 'draft' },
];

export function SendBriefTab({ workspace: _workspace }: SendBriefTabProps) {
  const [showComposer, setShowComposer] = useState(false);
  const [briefTitle, setBriefTitle] = useState('');
  const [briefContent, setBriefContent] = useState('');
  const [recipients, setRecipients] = useState('all');

  const handleSendBrief = () => {
    console.log('Sending brief:', { briefTitle, briefContent, recipients });
    setShowComposer(false);
    setBriefTitle('');
    setBriefContent('');
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
            <div className="text-2xl font-bold text-rose-600">{mockBriefs.length}</div>
            <div className="text-xs text-muted-foreground">Total Briefs</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">
              {mockBriefs.filter(b => b.status === 'sent').length}
            </div>
            <div className="text-xs text-muted-foreground">Sent</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-amber-600">
              {mockBriefs.filter(b => b.status === 'scheduled').length}
            </div>
            <div className="text-xs text-muted-foreground">Scheduled</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-slate-500/10 to-slate-600/5 border-slate-500/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-muted-foreground">
              {mockBriefs.filter(b => b.status === 'draft').length}
            </div>
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
                  <SelectItem value="leads">Team Leads Only</SelectItem>
                  <SelectItem value="morning">Morning Shift</SelectItem>
                  <SelectItem value="afternoon">Afternoon Shift</SelectItem>
                  <SelectItem value="evening">Evening Shift</SelectItem>
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
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowComposer(false)}>
                Cancel
              </Button>
              <Button variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                Schedule
              </Button>
              <Button 
                className="bg-rose-500 hover:bg-rose-600"
                onClick={handleSendBrief}
              >
                <Send className="h-4 w-4 mr-2" />
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
          {mockBriefs.map(brief => (
            <div
              key={brief.id}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  brief.status === 'sent' ? 'bg-emerald-500/10' :
                  brief.status === 'scheduled' ? 'bg-amber-500/10' :
                  'bg-slate-500/10'
                }`}>
                  {brief.status === 'sent' ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  ) : brief.status === 'scheduled' ? (
                    <Clock className="h-4 w-4 text-amber-500" />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-foreground">{brief.title}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    {brief.recipients}
                  </div>
                </div>
              </div>
              <Badge 
                variant="outline"
                className={
                  brief.status === 'sent' ? 'border-emerald-500/30 text-emerald-600' :
                  brief.status === 'scheduled' ? 'border-amber-500/30 text-amber-600' :
                  'border-slate-500/30 text-muted-foreground'
                }
              >
                {brief.status === 'sent' ? 'Sent' :
                 brief.status === 'scheduled' ? 'Scheduled' :
                 'Draft'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
