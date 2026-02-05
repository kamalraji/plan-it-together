import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Mail, Bell, Newspaper, CheckCircle2, Clock } from 'lucide-react';

interface CommunicationItem {
  id: string;
  title: string;
  type: 'announcement' | 'email' | 'press' | 'notification';
  status: 'sent' | 'scheduled' | 'draft';
  audience: string;
  sentAt?: string;
  scheduledFor?: string;
}

export function CommunicationSummary() {
  const communications: CommunicationItem[] = [
    {
      id: '1',
      title: 'Speaker Lineup Announcement',
      type: 'announcement',
      status: 'sent',
      audience: 'All Subscribers',
      sentAt: '2026-01-04',
    },
    {
      id: '2',
      title: 'Early Bird Reminder',
      type: 'email',
      status: 'scheduled',
      audience: 'Newsletter',
      scheduledFor: '2026-01-07',
    },
    {
      id: '3',
      title: 'Press Release: Keynote Speaker',
      type: 'press',
      status: 'draft',
      audience: 'Media',
    },
    {
      id: '4',
      title: 'Venue Update Notification',
      type: 'notification',
      status: 'scheduled',
      audience: 'Registered Attendees',
      scheduledFor: '2026-01-06',
    },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement': return <Bell className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'press': return <Newspaper className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Sent
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge className="bg-info/10 text-info border-info/20 text-xs flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Scheduled
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-xs">Draft</Badge>;
    }
  };

  const sentCount = communications.filter(c => c.status === 'sent').length;
  const scheduledCount = communications.filter(c => c.status === 'scheduled').length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5 text-primary" />
            Communications
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{sentCount} sent</Badge>
            <Badge variant="outline" className="text-xs">{scheduledCount} scheduled</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {communications.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-muted text-muted-foreground">
              {getTypeIcon(item.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {item.audience}
                {item.scheduledFor && ` • ${new Date(item.scheduledFor).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
              </p>
            </div>
            {getStatusBadge(item.status)}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
