import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
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
  Eye,
  Loader2
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Workspace } from '@/types';
import { useReminders } from '@/hooks/useReminders';

interface SendRemindersTabProps {
  workspace: Workspace;
}

export function SendRemindersTab({ workspace }: SendRemindersTabProps) {
  const {
    templates,
    campaigns,
    audienceCounts,
    isLoadingTemplates,
    isLoadingCampaigns,
    isLoadingAudience,
    isSending,
    sendReminder,
  } = useReminders(workspace.id, workspace.eventId);

  const [selectedTemplate, setSelectedTemplate] = useState<string>('event-reminder');
  const [selectedAudience, setSelectedAudience] = useState('confirmed');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [includeQR, setIncludeQR] = useState(true);
  const [scheduleTime, setScheduleTime] = useState<'now' | 'scheduled'>('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Build audience filters with real counts
  const audienceFilters = [
    { id: 'all', name: 'All Registered', count: audienceCounts.all },
    { id: 'confirmed', name: 'Confirmed Only', count: audienceCounts.confirmed },
    { id: 'not-checked-in', name: 'Not Checked In', count: audienceCounts.notCheckedIn },
    { id: 'vip', name: 'VIP Attendees', count: audienceCounts.vip },
    { id: 'pending', name: 'Pending Registration', count: audienceCounts.pending },
  ];

  const selectedAudienceData = audienceFilters.find(a => a.id === selectedAudience);

  const handleSend = async () => {
    if (!subject.trim()) {
      return;
    }

    await sendReminder({
      subject,
      body: message,
      audience: selectedAudience,
      includeQR,
      scheduledFor: scheduleTime === 'scheduled' ? scheduledDate : undefined,
    });

    // Reset form on success
    if (!isSending) {
      setSubject('');
      setMessage('');
    }
  };

  const loadTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setMessage(template.body);
      setIncludeQR(template.include_qr_code);
    } else {
      // Check default templates by id pattern
      const defaultTemplate = templates.find(t => t.name.toLowerCase().includes(templateId.replace(/-/g, ' ')));
      if (defaultTemplate) {
        setSubject(defaultTemplate.subject);
        setMessage(defaultTemplate.body);
        setIncludeQR(defaultTemplate.include_qr_code);
      }
    }
  };

  // Set initial template on load
  useEffect(() => {
    if (templates.length > 0 && !subject) {
      const firstTemplate = templates[0];
      setSelectedTemplate(firstTemplate.id);
      setSubject(firstTemplate.subject);
      setMessage(firstTemplate.body);
      setIncludeQR(firstTemplate.include_qr_code);
    }
  }, [templates, subject]);

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
                  {isLoadingTemplates ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} className="h-20 rounded-lg" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {templates.map(template => (
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
                  )}
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
                      Use {'{{name}}'}, {'{{event_name}}'}, {'{{event_date}}'}, {'{{event_location}}'} to personalize
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
                  {isLoadingAudience ? (
                    <>
                      {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} className="h-12 rounded-lg" />
                      ))}
                    </>
                  ) : (
                    audienceFilters.map(audience => (
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
                    ))
                  )}
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
                    disabled={isSending || !subject.trim() || (selectedAudienceData?.count || 0) === 0}
                    onClick={handleSend}
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : scheduleTime === 'scheduled' ? (
                      <>
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule for {selectedAudienceData?.count || 0}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send to {selectedAudienceData?.count || 0}
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
              {isLoadingCampaigns ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-20 rounded-lg" />
                  ))}
                </div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No reminders sent yet</p>
                  <p className="text-sm">Your sent reminders will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {campaigns.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {item.status === 'sent' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                        ) : item.status === 'scheduled' ? (
                          <Clock className="w-5 h-5 text-amber-500 mt-0.5" />
                        ) : item.status === 'sending' ? (
                          <Loader2 className="w-5 h-5 text-blue-500 mt-0.5 animate-spin" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                        )}
                        <div>
                          <p className="font-medium">{item.subject || item.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <span>{(item.sent_count || 0).toLocaleString()} recipients</span>
                            <span>·</span>
                            <span>
                              {item.sent_at 
                                ? formatDistanceToNow(new Date(item.sent_at), { addSuffix: true })
                                : item.created_at 
                                  ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true })
                                  : 'Recently'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {item.opened_count != null && item.sent_count && item.sent_count > 0 && (
                          <p className="text-sm font-medium text-emerald-600">
                            {Math.round((item.opened_count / item.sent_count) * 100)}% opened
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {item.sent_at 
                            ? format(new Date(item.sent_at), 'MMM d, h:mm a')
                            : item.scheduled_for
                              ? `Scheduled: ${format(new Date(item.scheduled_for), 'MMM d, h:mm a')}`
                              : ''
                          }
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
