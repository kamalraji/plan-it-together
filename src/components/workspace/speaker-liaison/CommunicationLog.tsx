import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Clock,
  ArrowRight
} from 'lucide-react';

interface Communication {
  id: string;
  speakerName: string;
  type: 'email' | 'call' | 'message';
  subject: string;
  timestamp: string;
  status: 'sent' | 'read' | 'replied' | 'pending';
}

export function CommunicationLog() {
  const communications: Communication[] = [
    {
      id: '1',
      speakerName: 'Dr. Sarah Chen',
      type: 'email',
      subject: 'Session confirmation received',
      timestamp: '2 hours ago',
      status: 'replied',
    },
    {
      id: '2',
      speakerName: 'James Wilson',
      type: 'email',
      subject: 'Presentation slides reminder',
      timestamp: '5 hours ago',
      status: 'read',
    },
    {
      id: '3',
      speakerName: 'Maria Garcia',
      type: 'call',
      subject: 'Initial outreach - voicemail left',
      timestamp: '1 day ago',
      status: 'pending',
    },
    {
      id: '4',
      speakerName: 'Prof. Robert Kim',
      type: 'message',
      subject: 'Travel arrangements confirmed',
      timestamp: '2 days ago',
      status: 'replied',
    },
  ];

  const getTypeIcon = (type: string) => {
    if (type === 'email') return <Mail className="h-3.5 w-3.5" />;
    if (type === 'call') return <Phone className="h-3.5 w-3.5" />;
    return <MessageSquare className="h-3.5 w-3.5" />;
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; label: string }> = {
      sent: { color: 'bg-blue-500/10 text-blue-600', label: 'Sent' },
      read: { color: 'bg-amber-500/10 text-amber-600', label: 'Read' },
      replied: { color: 'bg-emerald-500/10 text-emerald-600', label: 'Replied' },
      pending: { color: 'bg-muted text-muted-foreground', label: 'Pending' },
    };
    return configs[status] || configs.pending;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5 text-primary" />
            Communication Log
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs">
            View All <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {communications.map((comm) => {
          const statusConfig = getStatusConfig(comm.status);
          
          return (
            <div
              key={comm.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
            >
              <div className="p-2 rounded-lg bg-muted/50">
                {getTypeIcon(comm.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-medium text-sm truncate">{comm.speakerName}</p>
                  <Badge className={`${statusConfig.color} text-[10px]`}>
                    {statusConfig.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{comm.subject}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <Clock className="h-3 w-3" />
                {comm.timestamp}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
