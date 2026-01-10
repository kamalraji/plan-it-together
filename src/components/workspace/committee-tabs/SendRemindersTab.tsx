import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mail,
  Send,
  Clock,
  Users,
  Calendar,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Smartphone,
  History,
  Eye
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Workspace } from '@/types';

interface SendRemindersTabProps {
  workspace: Workspace;
}

interface ReminderHistory {
  id: string;
  subject: string;
  recipientCount: number;
  sentAt: Date;
  status: 'sent' | 'scheduled' | 'failed';
  openRate?: number;
}

const reminderTemplates = [
  { id: 'event-reminder', name: 'Event Reminder', description: 'General reminder about the upcoming event' },
  { id: 'checkin-reminder', name: 'Check-in Info', description: 'Details about check-in process and QR codes' },
  { id: 'schedule-update', name: 'Schedule Update', description: 'Notify about schedule changes' },
  { id: 'last-minute', name: 'Last Minute Info', description: 'Day-of information and reminders' },
  { id: 'custom', name: 'Custom Message', description: 'Write your own message' },
];

const audienceFilters = [
  { id: 'all', name: 'All Registered', count: 1250 },
  { id: 'confirmed', name: 'Confirmed Only', count: 847 },
  { id: 'not-checked-in', name: 'Not Checked In', count: 403 },
  { id: 'vip', name: 'VIP Attendees', count: 156 },
  { id: 'pending', name: 'Pending Registration', count: 89 },
];

const mockHistory: ReminderHistory[] = [
  { id: '1', subject: 'Event starts tomorrow!', recipientCount: 847, sentAt: new Date('2025-01-09T10:00:00'), status: 'sent', openRate: 72 },
  { id: '2', subject: 'Your QR code for check-in', recipientCount: 1250, sentAt: new Date('2025-01-08T14:30:00'), status: 'sent', openRate: 85 },
  { id: '3', subject: 'Schedule update: New session added', recipientCount: 1250, sentAt: new Date('2025-01-07T09:00:00'), status: 'sent', openRate: 68 },
];

export function SendRemindersTab({ workspace: _workspace }: SendRemindersTabProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('event-reminder');
  const [selectedAudience, setSelectedAudience] = useState('confirmed');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [includeQR, setIncludeQR] = useState(true);
  const [scheduleTime, setScheduleTime] = useState<'now' | 'scheduled'>('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const selectedAudienceData = audienceFilters.find(a => a.id === selectedAudience);

  const handleSend = async () => {
    if (!subject.trim()) {
      toast.error('Please enter a subject line');
      return;
    }

    setIsSending(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSending(false);

    if (scheduleTime === 'scheduled') {
      toast.success('Reminder scheduled!', {
        description: `Will be sent to ${selectedAudienceData?.count} recipients on ${scheduledDate}`,
      });
    } else {
      toast.success('Reminder sent!', {
        description: `Sent to ${selectedAudienceData?.count} recipients`,
      });
    }

    setSubject('');
    setMessage('');
  };

  const loadTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    switch (templateId) {
      case 'event-reminder':
        setSubject('Don\'t forget: [Event Name] is coming up!');
        setMessage('Hi {{name}},\n\nThis is a friendly reminder that [Event Name] is happening soon. We\'re excited to see you there!\n\n📅 Date: [Event Date]\n📍 Location: [Venue]\n\nDon\'t forget to bring your ticket QR code for quick check-in.\n\nSee you soon!');
        break;
      case 'checkin-reminder':
        setSubject('Your check-in details for [Event Name]');
        setMessage('Hi {{name}},\n\nHere\'s everything you need for a smooth check-in:\n\n✅ Show your QR code (attached below)\n✅ Bring a valid ID\n✅ Arrive 15 minutes early\n\nCheck-in opens at [Time] at the [Location].\n\nSee you there!');
        break;
      case 'schedule-update':
        setSubject('Important: Schedule update for [Event Name]');
        setMessage('Hi {{name}},\n\nWe have an important update to share about the event schedule:\n\n[Describe changes here]\n\nPlease check the updated schedule on our event page.\n\nThank you for your understanding!');
        break;
      case 'last-minute':
        setSubject('[Event Name] starts today!');
        setMessage('Hi {{name}},\n\n🎉 It\'s finally here! [Event Name] starts today.\n\nQuick reminders:\n• Doors open at [Time]\n• Don\'t forget your QR code\n• [Any last-minute info]\n\nWe can\'t wait to see you!');
        break;
      default:
        setSubject('');
        setMessage('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Mail className="w-6 h-6 text-amber-500" />
          Send Reminders
        </h2>
        <p className="text-muted-foreground mt-1">Send email or SMS reminders to your attendees</p>
      </div>

      <Tabs defaultValue="compose" className="space-y-6">
        <TabsList>
          <TabsTrigger value="compose" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Compose
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="w-4 h-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Compose Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Template Selection */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Message Template</CardTitle>
                  <CardDescription>Start with a template or write a custom message</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {reminderTemplates.map(template => (
                      <button
                        key={template.id}
                        onClick={() => loadTemplate(template.id)}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          selectedTemplate === template.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <p className="font-medium text-sm">{template.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Message Compose */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Compose Message</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject Line *</Label>
                    <Input
                      id="subject"
                      placeholder="Enter email subject..."
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message Body</Label>
                    <Textarea
                      id="message"
                      placeholder="Write your message here..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={8}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use {'{{name}}'} to personalize with attendee name
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeQR"
                      checked={includeQR}
                      onCheckedChange={(checked) => setIncludeQR(!!checked)}
                    />
                    <Label htmlFor="includeQR" className="text-sm font-normal cursor-pointer">
                      Include check-in QR code
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {/* Scheduling */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Scheduling
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 mb-4">
                    <Button
                      variant={scheduleTime === 'now' ? 'default' : 'outline'}
                      onClick={() => setScheduleTime('now')}
                      className="flex-1"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Now
                    </Button>
                    <Button
                      variant={scheduleTime === 'scheduled' ? 'default' : 'outline'}
                      onClick={() => setScheduleTime('scheduled')}
                      className="flex-1"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule
                    </Button>
                  </div>

                  {scheduleTime === 'scheduled' && (
                    <div className="space-y-2">
                      <Label>Schedule Date & Time</Label>
                      <Input
                        type="datetime-local"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Audience Selection */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Audience
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {audienceFilters.map(audience => (
                    <button
                      key={audience.id}
                      onClick={() => setSelectedAudience(audience.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                        selectedAudience === audience.id
                          ? 'bg-primary/10 border border-primary/30'
                          : 'bg-muted/30 hover:bg-muted/50'
                      }`}
                    >
                      <span className="text-sm">{audience.name}</span>
                      <Badge variant="secondary">{audience.count.toLocaleString()}</Badge>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Delivery Method */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Delivery Method</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/30">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">Email</span>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-600">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 opacity-60">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      <span className="text-sm">SMS</span>
                    </div>
                    <Badge variant="outline">Coming Soon</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Preview & Send */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="pt-6 space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Message
                  </Button>
                  <Button 
                    className="w-full bg-amber-600 hover:bg-amber-700" 
                    disabled={isSending || !subject.trim()}
                    onClick={handleSend}
                  >
                    {isSending ? (
                      'Sending...'
                    ) : scheduleTime === 'scheduled' ? (
                      <>
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule for {selectedAudienceData?.count}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send to {selectedAudienceData?.count}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Sent Reminders</CardTitle>
              <CardDescription>History of all reminders sent to attendees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockHistory.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {item.status === 'sent' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                      ) : item.status === 'scheduled' ? (
                        <Clock className="w-5 h-5 text-amber-500 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium">{item.subject}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <span>{item.recipientCount.toLocaleString()} recipients</span>
                          <span>·</span>
                          <span>{formatDistanceToNow(item.sentAt, { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {item.openRate && (
                        <p className="text-sm font-medium text-emerald-600">{item.openRate}% opened</p>
                      )}
                      <p className="text-xs text-muted-foreground">{format(item.sentAt, 'MMM d, h:mm a')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
